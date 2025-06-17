import { useState, useEffect } from 'react'
import VerticalCalendar from '@/components/calendar/VerticalCalendar'
import DayViewSheet from '@/components/calendar/DayViewSheet'
import NewEventSheet from '@/components/calendar/NewEventSheet'
import CalendarFilters from '@/components/calendar/CalendarFilters'
import EventDetailSheet from '@/components/calendar/EventDetailSheet'
import ItineraryDetailSheet from '@/components/calendar/ItineraryDetailSheet'
import CalendarActionDropdown from '@/components/calendar/CalendarActionDropdown'
import AvailabilitySheet from '@/components/calendar/AvailabilitySheet'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import { eventService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import type { ItineraryItem } from '@/types/events'
import type { EventWithDetails } from '@/types/supabase'

export default function Calendar() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<EventWithDetails | null>(null)
  const [selectedItinerary, setSelectedItinerary] = useState<ItineraryItem | null>(null)
  const [showNewEventSheet, setShowNewEventSheet] = useState(false)
  const [showDayViewSheet, setShowDayViewSheet] = useState(false)
  const [showEventDetail, setShowEventDetail] = useState(false)
  const [showItineraryDetail, setShowItineraryDetail] = useState(false)
  const [showAvailabilitySheet, setShowAvailabilitySheet] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    events: true,
    availability: false,
    officers: false
  })

  // Real events from Supabase
  const [allEvents, setAllEvents] = useState<EventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load events from Supabase
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await eventService.getEvents(1, 100) // Get more events for calendar view
        setAllEvents(response.data)
      } catch (err) {
        console.error('Failed to load events:', err)
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const handleEventFormSubmit = async (eventData: any) => {
    if (!user) {
      alert('You must be logged in to create events')
      return
    }

    try {
      // Map camelCase to snake_case for database fields if needed
      const mappedEventData = {
        ...eventData,
        // Ensure snake_case fields for database
        start_date: eventData.start_date || eventData.startDate,
        end_date: eventData.end_date || eventData.endDate,
        created_by: eventData.created_by || eventData.createdBy || user.id,
        max_participants: eventData.max_participants || eventData.maxParticipants,
        estimated_cost: eventData.estimated_cost || eventData.estimatedCost,
        is_public: eventData.is_public !== undefined ? eventData.is_public : eventData.isPublic
      }

      // Remove camelCase fields to avoid conflicts
      delete mappedEventData.startDate
      delete mappedEventData.endDate  
      delete mappedEventData.createdBy
      delete mappedEventData.maxParticipants
      delete mappedEventData.estimatedCost
      delete mappedEventData.isPublic

      console.log('Creating event with mapped data:', mappedEventData)
      
      const newEvent = await eventService.createEvent(mappedEventData)
      
      // Reload events to get the new one with full details
      const response = await eventService.getEvents(1, 100)
      setAllEvents(response.data)
      
      console.log('New event created:', newEvent)
      alert(`Event "${eventData.title}" created successfully!`)
      setShowNewEventSheet(false)
    } catch (err) {
      console.error('Failed to create event:', err)
      alert('Failed to create event. Please try again.')
    }
  }

  const handleEventClick = (event: EventWithDetails) => {
    setSelectedEvent(event)
    setShowEventDetail(true)
    setShowDayViewSheet(false)
  }

  const handleItineraryClick = (item: ItineraryItem) => {
    setSelectedItinerary(item)
    setShowItineraryDetail(true)
    setShowDayViewSheet(false)
  }

  const handleDayShortPress = (date: Date) => {
    setSelectedDate(date)
    setShowDayViewSheet(true)
    setShowEventDetail(false)
  }

  const handleDayLongPress = (date: Date) => {
    setSelectedDate(date)
    setShowNewEventSheet(true)
  }


  const handleNewEventFromFAB = () => {
    setSelectedDate(new Date())
    setShowNewEventSheet(true)
  }

  const handleNewEventFromDay = (date: Date) => {
    setSelectedDate(date)
    setShowNewEventSheet(true)
  }

  const handleMarkAvailability = () => {
    setSelectedDate(new Date())
    setShowAvailabilitySheet(true)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* iOS Calendar Header */}
      <IOSHeader 
        title="Calendar"
        rightActions={[
          <IOSActionButton 
            key="filters"
            onClick={() => setShowFilters(true)}
            aria-label="Open filters"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0111 21v-6.586a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" 
              />
            </svg>
          </IOSActionButton>,
          <CalendarActionDropdown
            key="calendar-actions"
            onCreateEvent={handleNewEventFromFAB}
            onMarkAvailability={handleMarkAvailability}
          />
        ]}
      />

      {/* Vertical Calendar */}
      <div className="flex-1 pt-20">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading calendar...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Error: {error}</div>
          </div>
        ) : (
          <VerticalCalendar
            events={allEvents}
            onDayShortPress={handleDayShortPress}
            onDayLongPress={handleDayLongPress}
            initialDate={new Date()}
          />
        )}
      </div>


      {/* New Event Sheet */}
      <NewEventSheet
        isOpen={showNewEventSheet}
        onClose={() => setShowNewEventSheet(false)}
        selectedDate={selectedDate}
        onEventCreate={handleEventFormSubmit}
      />

      {/* Day View Sheet */}
      <DayViewSheet
        isOpen={showDayViewSheet}
        onClose={() => setShowDayViewSheet(false)}
        selectedDate={selectedDate}
        events={allEvents}
        onEventClick={handleEventClick}
        onItineraryClick={handleItineraryClick}
        onNewEvent={handleNewEventFromDay}
      />

      {/* Event Detail Sheet */}
      <EventDetailSheet
        event={selectedEvent}
        isOpen={showEventDetail}
        onClose={() => setShowEventDetail(false)}
      />

      {/* Itinerary Detail Sheet */}
      <ItineraryDetailSheet
        item={selectedItinerary}
        isOpen={showItineraryDetail}
        onClose={() => setShowItineraryDetail(false)}
      />

      {/* Availability Sheet */}
      <AvailabilitySheet
        isOpen={showAvailabilitySheet}
        onClose={() => setShowAvailabilitySheet(false)}
        selectedDate={selectedDate}
        onAvailabilitySubmit={(data) => {
          console.log('Availability submitted:', data)
          // In a real app, this would save to backend
        }}
      />

      {/* Calendar Filters */}
      <CalendarFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
      />
    </div>
  )
}