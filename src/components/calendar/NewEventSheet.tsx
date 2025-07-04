import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { AutocompleteInput } from '@/components/places/AutocompleteInput'
import { MapPreview } from '@/components/places/MapPreview'
import { useAuth } from '@/hooks/useAuth'
import ItineraryBuilder from './ItineraryBuilder'
import type { EventType, EventStatus, ItineraryItem } from '@/types/events'
import type { EventWithDetails } from '@/types/supabase'
import type { Place } from '@/types/places'

interface NewEventSheetProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date
  onEventCreate: (eventData: any) => void
  editEvent?: EventWithDetails | null
  onEventUpdate?: (eventData: any) => void
}

type ActiveTab = 'event' | 'itinerary'
type EventColor = 'violet' | 'sky' | 'amber' | 'rose' | 'emerald' | 'indigo'

const colorOptions: { value: EventColor; label: string; color: string }[] = [
  { value: 'violet', label: 'Royal Purple', color: '#8b5cf6' },
  { value: 'sky', label: 'Sky Blue', color: '#3b82f6' },
  { value: 'emerald', label: 'Forest Green', color: '#10b981' },
  { value: 'indigo', label: 'Deep Purple', color: '#6366f1' },
  { value: 'amber', label: 'Coral', color: '#f97316' },
  { value: 'rose', label: 'Pink', color: '#ec4899' }
]

export default function NewEventSheet({
  isOpen,
  onClose,
  selectedDate,
  onEventCreate,
  editEvent,
  onEventUpdate
}: NewEventSheetProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('event')
  const [isClosing, setIsClosing] = useState(false)

  // Event form data
  const [eventData, setEventData] = useState({
    title: '',
    location: '',
    locationPlace: null as Place | null,
    allDay: false,
    startDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endTime: '17:00',
    color: 'violet' as EventColor,
    notes: ''
  })

  // Itinerary state
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([])


  useEffect(() => {
    if (isOpen) {
      if (editEvent) {
        // Populate form with existing event data
        const startDate = new Date(editEvent.start_date)
        const endDate = new Date(editEvent.end_date)
        const colorValue = colorOptions.find(opt => opt.color === editEvent.color)?.value || 'violet'
        
        // Detect if this is an all-day event
        const isAllDay = (
          format(startDate, 'HH:mm') === '00:00' && 
          (format(endDate, 'HH:mm') === '23:59' || format(endDate, 'HH:mm') === '00:00')
        )
        
        setEventData({
          title: editEvent.title,
          location: editEvent.location || '',
          locationPlace: null,
          allDay: isAllDay,
          startDate: format(startDate, 'yyyy-MM-dd'),
          startTime: format(startDate, 'HH:mm'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          endTime: format(endDate, 'HH:mm'),
          color: colorValue,
          notes: editEvent.description || ''
        })
        
        // Set itinerary items if they exist
        if (editEvent.itinerary_items) {
          const mappedItems: ItineraryItem[] = editEvent.itinerary_items.map(item => ({
            id: item.id,
            eventId: item.event_id,
            type: item.type,
            title: item.title,
            description: item.description || '',
            startTime: item.start_time || '',
            endTime: item.end_time || '',
            location: item.location || '',
            cost: item.cost || 0,
            notes: item.notes || '',
            order: item.order_index || 0,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at)
          }))
          setItineraryItems(mappedItems)
        }
      } else if (selectedDate) {
        // Reset form for new event
        setEventData({
          title: '',
          location: '',
          locationPlace: null,
          allDay: false,
          startDate: format(selectedDate, 'yyyy-MM-dd'),
          startTime: '09:00',
          endDate: format(selectedDate, 'yyyy-MM-dd'),
          endTime: '17:00',
          color: 'violet',
          notes: ''
        })
        setItineraryItems([])
      }
    }
  }, [isOpen, selectedDate, editEvent])

  if (!isOpen && !isClosing) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
      // Reset form
      setEventData({
        title: '',
        location: '',
        locationPlace: null,
        allDay: false,
        startDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        endTime: '17:00',
        color: 'violet',
        notes: ''
      })
      setItineraryItems([])
      setActiveTab('event')
    }, 300)
  }

  const handlePlaceSelected = (place: Place) => {
    setEventData(prev => ({
      ...prev,
      location: place.address,
      locationPlace: place
    }))
  }

  const handleEventSubmit = () => {
    if (!eventData.title.trim() || !user) return

    // Handle all-day events differently
    let startDateTime: Date
    let endDateTime: Date
    
    if (eventData.allDay) {
      // All-day events: start at 00:00 and end at 23:59
      startDateTime = new Date(`${eventData.startDate}T00:00:00`)
      endDateTime = new Date(`${eventData.endDate}T23:59:59`)
    } else {
      // Regular events: use selected times
      startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}:00`)
      endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`)
    }

    const totalCost = itineraryItems.reduce((sum: number, item: any) => sum + (item.cost || 0), 0)

    const eventPayload = {
      title: eventData.title,
      description: eventData.notes,
      type: 'adventure' as EventType,
      status: 'published' as EventStatus,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
      startDate: startDateTime,
      endDate: endDateTime,
      location: eventData.location || null,
      is_public: true,
      max_participants: null,
      created_by: user.id,
      estimated_cost: totalCost > 0 ? totalCost : null,
      color: colorOptions.find(opt => opt.value === eventData.color)?.color || '#8b5cf6'
    }

    if (editEvent && onEventUpdate) {
      // Update existing event
      onEventUpdate({
        ...eventPayload,
        id: editEvent.id,
        itineraryItems: itineraryItems
      })
    } else {
      // Create new event
      onEventCreate({
        ...eventPayload,
        itineraryItems: itineraryItems
      })
    }

    handleClose()
  }



  const isFormValid = eventData.title.trim().length > 0

  return (
    <div 
      className={`fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
      style={{ overscrollBehavior: 'contain' }}
    >
      <div 
        className={`absolute inset-x-0 bottom-0 bg-white rounded-t-xl overflow-hidden transition-transform duration-300 flex flex-col ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`} 
        style={{ height: '85%', overscrollBehavior: 'contain' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Handle bar */}
        <div className="flex justify-center py-3 cursor-pointer" onClick={handleClose}>
          <div className="w-12 h-1 bg-primary-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4">
          <button
            onClick={handleClose}
            className="text-royal-600 font-medium hover:text-royal-700"
          >
            Cancel
          </button>
          
          <h2 className="text-lg font-semibold text-primary-900">
            {editEvent ? 'Edit Event' : 'New Event'}
          </h2>
          
          <button
            onClick={handleEventSubmit}
            disabled={!isFormValid}
            className="text-royal-600 font-medium disabled:text-primary-400 hover:text-royal-700 disabled:hover:text-primary-400"
          >
            {editEvent ? 'Update' : 'Add'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 mb-6">
          <div className="flex bg-primary-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('event')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'event'
                  ? 'bg-white text-primary-900 shadow-sm'
                  : 'text-primary-600 hover:text-primary-900'
              }`}
            >
              Event
            </button>
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'itinerary'
                  ? 'bg-white text-primary-900 shadow-sm'
                  : 'text-primary-600 hover:text-primary-900'
              }`}
            >
              Itinerary
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {activeTab === 'event' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Event Title *
                  </label>
                  <Input
                    type="text"
                    value={eventData.title}
                    onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter event title"
                    className="text-lg"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Location
                  </label>
                  <AutocompleteInput
                    onPlaceSelected={handlePlaceSelected}
                    placeholder="Search for event location..."
                  />
                  {eventData.locationPlace && (
                    <>
                      <div className="text-sm text-primary-600 mt-1">
                        Selected: {eventData.locationPlace.name} - {eventData.locationPlace.address}
                      </div>
                      <div className="mt-4">
                        <MapPreview
                          latitude={eventData.locationPlace.coordinates.latitude}
                          longitude={eventData.locationPlace.coordinates.longitude}
                          name={eventData.locationPlace.name}
                          address={eventData.locationPlace.address}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-primary-700">All-day</label>
                    <button
                      onClick={() => setEventData(prev => ({ ...prev, allDay: !prev.allDay }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        eventData.allDay ? 'bg-royal-600' : 'bg-primary-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          eventData.allDay ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={eventData.startDate}
                        onChange={(e) => setEventData(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={eventData.endDate}
                        onChange={(e) => setEventData(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {!eventData.allDay && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-primary-700 mb-1">
                          Start Time
                        </label>
                        <Input
                          type="time"
                          value={eventData.startTime}
                          onChange={(e) => setEventData(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-700 mb-1">
                          End Time
                        </label>
                        <Input
                          type="time"
                          value={eventData.endTime}
                          onChange={(e) => setEventData(prev => ({ ...prev, endTime: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-3">
                  Color
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEventData(prev => ({ ...prev, color: 'violet' }))}
                    className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
                      eventData.color === 'violet'
                        ? 'border-primary-900 scale-110'
                        : 'border-primary-200 hover:border-primary-400'
                    }`}
                    style={{ backgroundColor: '#8b5cf6' }}
                    title="Royal Purple"
                  />
                  <button
                    onClick={() => setEventData(prev => ({ ...prev, color: 'sky' }))}
                    className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
                      eventData.color === 'sky'
                        ? 'border-primary-900 scale-110'
                        : 'border-primary-200 hover:border-primary-400'
                    }`}
                    style={{ backgroundColor: '#3b82f6' }}
                    title="Sky Blue"
                  />
                  <button
                    onClick={() => setEventData(prev => ({ ...prev, color: 'emerald' }))}
                    className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
                      eventData.color === 'emerald'
                        ? 'border-primary-900 scale-110'
                        : 'border-primary-200 hover:border-primary-400'
                    }`}
                    style={{ backgroundColor: '#10b981' }}
                    title="Forest Green"
                  />
                  <button
                    onClick={() => setEventData(prev => ({ ...prev, color: 'indigo' }))}
                    className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
                      eventData.color === 'indigo'
                        ? 'border-primary-900 scale-110'
                        : 'border-primary-200 hover:border-primary-400'
                    }`}
                    style={{ backgroundColor: '#6366f1' }}
                    title="Deep Purple"
                  />
                  <button
                    onClick={() => setEventData(prev => ({ ...prev, color: 'amber' }))}
                    className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
                      eventData.color === 'amber'
                        ? 'border-primary-900 scale-110'
                        : 'border-primary-200 hover:border-primary-400'
                    }`}
                    style={{ backgroundColor: '#f97316' }}
                    title="Coral"
                  />
                  <button
                    onClick={() => setEventData(prev => ({ ...prev, color: 'rose' }))}
                    className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
                      eventData.color === 'rose'
                        ? 'border-primary-900 scale-110'
                        : 'border-primary-200 hover:border-primary-400'
                    }`}
                    style={{ backgroundColor: '#ec4899' }}
                    title="Pink"
                  />
                </div>
              </div>


              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Event Details
                </label>
                <Textarea
                  value={eventData.notes}
                  onChange={(e) => setEventData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes, description, or special instructions..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {activeTab === 'itinerary' && (
            <ItineraryBuilder
              items={itineraryItems}
              onItemsChange={setItineraryItems}
            />
          )}
        </div>
      </div>
    </div>
  )
}