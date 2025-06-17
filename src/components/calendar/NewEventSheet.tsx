import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import ItineraryBuilder from './ItineraryBuilder'
import type { EventType, EventStatus, ItineraryItem, LocationData } from '@/types/events'

interface NewEventSheetProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date
  onEventCreate: (eventData: any) => void
}

type ActiveTab = 'event' | 'itinerary'
type EventColor = 'violet' | 'sky' | 'amber' | 'rose'

const colorOptions: { value: EventColor; label: string; color: string }[] = [
  { value: 'violet', label: 'Purple', color: '#d7c6ff' },
  { value: 'sky', label: 'Blue', color: '#bae6fd' },
  { value: 'amber', label: 'Yellow', color: '#fde68a' },
  { value: 'rose', label: 'Pink', color: '#fecaca' }
]

export default function NewEventSheet({
  isOpen,
  onClose,
  selectedDate,
  onEventCreate
}: NewEventSheetProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('event')
  const [isClosing, setIsClosing] = useState(false)

  // Event form data
  const [eventData, setEventData] = useState({
    title: '',
    location: null as LocationData | null,
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
    if (isOpen && selectedDate) {
      setEventData(prev => ({
        ...prev,
        startDate: format(selectedDate, 'yyyy-MM-dd'),
        endDate: format(selectedDate, 'yyyy-MM-dd')
      }))
    }
  }, [isOpen, selectedDate])

  if (!isOpen && !isClosing) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
      // Reset form
      setEventData({
        title: '',
        location: null,
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

  const handleEventSubmit = () => {
    if (!eventData.title.trim() || !user) return

    const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}:00`)
    const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`)

    const totalCost = itineraryItems.reduce((sum: number, item: any) => sum + (item.cost || 0), 0)

    onEventCreate({
      title: eventData.title,
      description: eventData.notes,
      type: 'adventure' as EventType,
      status: 'published' as EventStatus,
      startDate: startDateTime,
      endDate: endDateTime,
      location: eventData.location?.address || null,
      is_public: true,
      max_participants: null,
      created_by: user.id,
      estimated_cost: totalCost > 0 ? totalCost : null
    })

    handleClose()
  }

  const handleAddExpense = (expenseData: {
    title: string
    amount: number
    category: string
    description?: string
  }) => {
    // This would integrate with Split-Pay system
    console.log('Adding expense from itinerary:', expenseData)
  }


  const isFormValid = eventData.title.trim().length > 0

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
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
          
          <h2 className="text-lg font-semibold text-primary-900">New Event</h2>
          
          <button
            onClick={handleEventSubmit}
            disabled={!isFormValid}
            className="text-royal-600 font-medium disabled:text-primary-400 hover:text-royal-700 disabled:hover:text-primary-400"
          >
            Add
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
                  <input 
                    type="text"
                    className="w-full px-3 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-royal-500 focus:border-royal-500 text-primary-900"
                    placeholder="Enter location"
                    onChange={(e) => setEventData(prev => ({ ...prev, location: { address: e.target.value, lat: 0, lng: 0 } }))}
                  />
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
                  {colorOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setEventData(prev => ({ ...prev, color: option.value }))}
                      className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
                        eventData.color === option.value
                          ? 'border-primary-900 scale-110'
                          : 'border-primary-200 hover:border-primary-400'
                      }`}
                      style={{ backgroundColor: option.color }}
                      title={option.label}
                    />
                  ))}
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
              eventId="temp_event"
              initialItems={itineraryItems}
              onItemsChange={setItineraryItems}
              onAddExpense={handleAddExpense}
            />
          )}
        </div>
      </div>
    </div>
  )
}