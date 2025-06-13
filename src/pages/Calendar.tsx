import { useState } from 'react'
import { Button } from '@/components/ui/button'
import FloatingActionButton from '@/components/ui/FloatingActionButton'
import FixedHeader from '@/components/layout/FixedHeader'
import CalendarGrid from '@/components/calendar/CalendarGrid'
import CalendarFilters from '@/components/calendar/CalendarFilters'
import DayTimelineSheet from '@/components/calendar/DayTimelineSheet'
import EnhancedEventCreateModal from '@/components/calendar/EnhancedEventCreateModal'
import EventDetailSheet from '@/components/calendar/EventDetailSheet'
import type { Event } from '@/types/events'
import { useUserStore } from '@/store/userStore'

export default function Calendar() {
  const { currentUser } = useUserStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDayTimeline, setShowDayTimeline] = useState(false)
  const [showEventCreateModal, setShowEventCreateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventDetail, setShowEventDetail] = useState(false)
  const [filters, setFilters] = useState({
    showEvents: true,
    showAvailability: false,
    showOfficerEvents: true
  })

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setShowDayTimeline(true)
  }

  const handleEventCreate = () => {
    setShowEventCreateModal(true)
  }

  const handleDateLongPress = (date: Date) => {
    setSelectedDate(date)
    setShowEventCreateModal(true)
  }

  const handleEventFormSubmit = (eventData: any) => {
    // Generate new event ID
    const newEvent: Event = {
      id: `event_${Date.now()}`,
      title: eventData.title,
      description: eventData.description,
      type: eventData.type,
      status: eventData.status,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      location: eventData.location || undefined,
      maxParticipants: eventData.maxParticipants || undefined,
      currentParticipants: eventData.invitees || (currentUser ? [currentUser.id] : []),
      createdBy: currentUser?.id || '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      itinerary: [],
      estimatedCost: eventData.estimatedCost || undefined,
      isPublic: eventData.isPublic
    }
    
    // TODO: Save to backend/state management
    console.log('New event created:', newEvent)
    alert(`Event "${eventData.title}" created successfully!`)
    setShowEventCreateModal(false)
  }

  const handleItineraryCreate = (itineraryData: any) => {
    // TODO: Handle itinerary creation and link to split-pay
    console.log('New itinerary created:', itineraryData)
    alert(`Itinerary "${itineraryData.title}" created successfully!`)
    setShowEventCreateModal(false)
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setShowEventDetail(true)
    setShowDayTimeline(false) // Close day timeline if open
  }

  const handleEventEdit = (event: Event) => {
    // TODO: Implement event editing
    console.log('Edit event:', event)
    alert(`Edit "${event.title}" - Coming soon!`)
    setShowEventDetail(false)
  }

  const handleEventDelete = (event: Event) => {
    // TODO: Implement event deletion
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      console.log('Delete event:', event)
      alert(`Event "${event.title}" deleted!`)
      setShowEventDetail(false)
    }
  }

  const handleEventJoinLeave = (event: Event, action: 'join' | 'leave') => {
    if (!currentUser) return
    
    // TODO: Update event participants in state/backend
    const actionText = action === 'join' ? 'joined' : 'left'
    console.log(`User ${currentUser.name} ${actionText} event:`, event.title)
    alert(`You have ${actionText} "${event.title}"!`)
    
    // Close detail sheet and refresh view
    setShowEventDetail(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 pb-20">
      {/* Fixed Header */}
      <FixedHeader 
        title="Calendar" 
        subtitle="Plan and view club events"
      >
        <Button
          onClick={() => setSelectedDate(new Date())}
          variant="outline"
          size="sm"
        >
          Today
        </Button>
      </FixedHeader>

      <div className="px-4 pt-24 pb-6 max-w-6xl mx-auto">

        {/* Filters */}
        <CalendarFilters 
          filters={filters}
          onFilterChange={setFilters}
        />

        {/* Quick Help */}
        <div className="flex justify-end mb-4">
          <div className="text-sm text-gray-600">
            Tap a day to view timeline • Long press to create
          </div>
        </div>

        {/* Calendar Grid */}
        <CalendarGrid
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          onDateLongPress={handleDateLongPress}
          filters={filters}
        />

        {/* Day Timeline Sheet */}
        <DayTimelineSheet
          selectedDate={selectedDate}
          isOpen={showDayTimeline}
          onClose={() => setShowDayTimeline(false)}
          onEventCreate={handleEventCreate}
          onEventClick={handleEventClick}
        />

        {/* Enhanced Event Creation Modal */}
        <EnhancedEventCreateModal
          isOpen={showEventCreateModal}
          onClose={() => setShowEventCreateModal(false)}
          selectedDate={selectedDate}
          onEventCreate={handleEventFormSubmit}
          onItineraryCreate={handleItineraryCreate}
        />

        {/* Event Detail Sheet */}
        <EventDetailSheet
          event={selectedEvent}
          isOpen={showEventDetail}
          onClose={() => setShowEventDetail(false)}
          onEdit={handleEventEdit}
          onDelete={handleEventDelete}
          onJoinLeave={handleEventJoinLeave}
        />

        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={handleEventCreate}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        />
      </div>
    </div>
  )
}