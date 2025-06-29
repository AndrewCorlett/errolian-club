import { useState, useEffect, useRef } from 'react'
import VerticalCalendar from '@/components/calendar/VerticalCalendar'
import DayViewSheet from '@/components/calendar/DayViewSheet'
import NewEventSheet from '@/components/calendar/NewEventSheet'
import CalendarFilters from '@/components/calendar/CalendarFilters'
import EventDetailSheet from '@/components/calendar/EventDetailSheet'
import ItineraryDetailSheet from '@/components/calendar/ItineraryDetailSheet'
import CalendarActionDropdown from '@/components/calendar/CalendarActionDropdown'
import AvailabilitySheet from '@/components/calendar/AvailabilitySheet'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import { eventService, itineraryService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import type { ItineraryItem } from '@/types/events'
import type { EventWithDetails } from '@/types/supabase'

export default function Calendar() {
  const { user } = useAuth()
  const headerRef = useRef<HTMLDivElement>(null)
  const [, setHeaderHeight] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<EventWithDetails | null>(null)
  const [selectedItinerary, setSelectedItinerary] = useState<ItineraryItem | null>(null)
  const [showNewEventSheet, setShowNewEventSheet] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventWithDetails | null>(null)
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

  // Measure header height
  useEffect(() => {
    const measureHeader = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }
    
    measureHeader()
    window.addEventListener('resize', measureHeader)
    
    return () => window.removeEventListener('resize', measureHeader)
  }, [])

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
      // Extract itinerary items
      const { itineraryItems, ...eventDataWithoutItinerary } = eventData

      // Map camelCase to snake_case for database fields if needed
      const mappedEventData = {
        ...eventDataWithoutItinerary,
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
      
      // Save itinerary items if any
      if (itineraryItems && itineraryItems.length > 0) {
        for (const item of itineraryItems) {
          const itineraryData = {
            event_id: newEvent.id,
            type: item.type,
            title: item.title,
            description: item.description,
            start_time: item.startTime,
            end_time: item.endTime,
            location: item.location,
            cost: item.cost,
            notes: item.notes,
            order_index: item.order
          }
          await itineraryService.createItineraryItem(itineraryData)
        }
      }
      
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

  const handleEditEvent = async (event: EventWithDetails) => {
    setEditingEvent(event)
    setShowEventDetail(false)
    setShowNewEventSheet(true)
  }

  const handleEventUpdate = async (eventData: any) => {
    if (!user) {
      alert('You must be logged in to update events')
      return
    }

    try {
      // Extract itinerary items
      const { itineraryItems } = eventData

      // Map the fields for update
      const mappedEventData = {
        title: eventData.title,
        description: eventData.description,
        type: eventData.type,
        status: eventData.status,
        start_date: eventData.start_date || eventData.startDate,
        end_date: eventData.end_date || eventData.endDate,
        location: eventData.location,
        is_public: eventData.is_public,
        max_participants: eventData.max_participants,
        estimated_cost: eventData.estimated_cost,
        color: eventData.color
      }

      console.log('Updating event with mapped data:', mappedEventData)
      
      await eventService.updateEvent(eventData.id, mappedEventData)
      
      // Handle itinerary items update
      if (itineraryItems) {
        // Get existing itinerary items
        const existingItems = await itineraryService.getItineraryItems(eventData.id)
        
        // Delete items that are no longer in the list
        for (const existingItem of existingItems) {
          const stillExists = itineraryItems.find((item: any) => item.id === existingItem.id)
          if (!stillExists) {
            await itineraryService.deleteItineraryItem(existingItem.id)
          }
        }
        
        // Update or create items
        for (const item of itineraryItems) {
          const itineraryData = {
            event_id: eventData.id,
            type: item.type,
            title: item.title,
            description: item.description,
            start_time: item.startTime,
            end_time: item.endTime,
            location: item.location,
            cost: item.cost,
            notes: item.notes,
            order_index: item.order
          }
          
          // Check if item exists
          const existingItem = existingItems.find(existing => existing.id === item.id)
          if (existingItem) {
            // Update existing item
            await itineraryService.updateItineraryItem(item.id, itineraryData)
          } else {
            // Create new item
            await itineraryService.createItineraryItem(itineraryData)
          }
        }
      }
      
      // Reload events to get the updated data
      const response = await eventService.getEvents(1, 100)
      setAllEvents(response.data)
      
      console.log('Event updated successfully')
      alert(`Event "${eventData.title}" updated successfully!`)
      setShowNewEventSheet(false)
      setEditingEvent(null)
    } catch (err) {
      console.error('Failed to update event:', err)
      alert('Failed to update event. Please try again.')
    }
  }

  const handleDeleteEvent = async (event: EventWithDetails) => {
    if (!confirm(`Are you sure you want to delete the event "${event.title}"?`)) {
      return
    }

    try {
      console.log('Deleting event from Calendar component:', event.id)
      await eventService.deleteEvent(event.id)
      
      // Reload events to update the calendar
      const response = await eventService.getEvents(1, 100)
      setAllEvents(response.data)
      
      setShowEventDetail(false)
      console.log('Event deleted successfully:', event.title)
      alert(`Event "${event.title}" has been deleted.`)
    } catch (err) {
      console.error('Failed to delete event:', err)
      alert(`Failed to delete event. Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="relative h-screen bg-white">
      {/* iOS Calendar Header - Fixed */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-white">
        <IOSHeader 
          title="Calendar"
          titleClassName="text-royal-600"
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
      </div>

      {/* Calendar Container - Bounded between header and footer */}
      <div 
        className="fixed left-0 right-0 overflow-y-auto"
        style={{ 
          top: '85px',
          bottom: '80px'
        }}
      >
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
            headerHeight={0}
          />
        )}
      </div>


      {/* New Event Sheet */}
      <NewEventSheet
        isOpen={showNewEventSheet}
        onClose={() => {
          setShowNewEventSheet(false)
          setEditingEvent(null)
        }}
        selectedDate={selectedDate}
        onEventCreate={handleEventFormSubmit}
        editEvent={editingEvent}
        onEventUpdate={handleEventUpdate}
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
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
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