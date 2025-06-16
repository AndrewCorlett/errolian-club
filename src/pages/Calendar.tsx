import { useState, useEffect } from 'react'
import VerticalCalendar from '@/components/calendar/VerticalCalendar'
import DayViewSheet from '@/components/calendar/DayViewSheet'
import NewEventSheet from '@/components/calendar/NewEventSheet'
import CalendarFilters from '@/components/calendar/CalendarFilters'
import EventDetailSheet from '@/components/calendar/EventDetailSheet'
import ItineraryDetailSheet from '@/components/calendar/ItineraryDetailSheet'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import { mockEvents } from '@/data/mockEvents'
import { portugalGolfTripEvent } from '@/data/portugalGolfTrip'
import { eventService, itineraryService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import type { Event, ItineraryItem } from '@/types/events'
import type { EventInsert } from '@/types/supabase'

export default function Calendar() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedItinerary, setSelectedItinerary] = useState<ItineraryItem | null>(null)
  const [showNewEventSheet, setShowNewEventSheet] = useState(false)
  const [showDayViewSheet, setShowDayViewSheet] = useState(false)
  const [showEventDetail, setShowEventDetail] = useState(false)
  const [showItineraryDetail, setShowItineraryDetail] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    events: true,
    availability: false,
    officers: false
  })
  const [loading, setLoading] = useState(true)

  // Start with mock events, then load real events from Supabase
  const [allEvents, setAllEvents] = useState<Event[]>([...mockEvents, portugalGolfTripEvent])

  // Load events from Supabase on mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const response = await eventService.getEvents(1, 100) // Get first 100 events
        
        // Convert Supabase events to frontend Event format
        const supabaseEvents: Event[] = response.data.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          status: event.status,
          startDate: new Date(event.start_date),
          endDate: new Date(event.end_date),
          location: event.location || '',
          maxParticipants: event.max_participants,
          isPublic: event.is_public,
          estimatedCost: event.estimated_cost,
          createdAt: new Date(event.created_at),
          updatedAt: new Date(event.updated_at),
          createdBy: event.created_by,
          participants: event.participants || [],
          itinerary: event.itinerary_items || []
        }))

        // Combine mock events with real events
        setAllEvents([...mockEvents, portugalGolfTripEvent, ...supabaseEvents])
      } catch (error) {
        console.error('Error loading events:', error)
        // Keep using mock events if Supabase fails
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadEvents()
    }
  }, [user])

  const handleEventFormSubmit = async (eventData: any) => {
    if (!user) {
      alert('You must be logged in to create events')
      return
    }

    try {
      // Prepare data for Supabase
      const eventInsert: EventInsert = {
        title: eventData.title,
        description: eventData.description || eventData.notes || '',
        type: eventData.type || 'other',
        status: 'published', // Officers can publish directly
        start_date: eventData.startDate.toISOString(),
        end_date: eventData.endDate.toISOString(),
        location: eventData.location,
        max_participants: eventData.maxParticipants,
        is_public: eventData.isPublic !== false,
        estimated_cost: eventData.estimatedCost,
        created_by: user.id
      }

      console.log('Creating event in Supabase:', eventInsert)
      
      // Save to Supabase
      const supabaseEvent = await eventService.createEvent(eventInsert)
      console.log('Event created in Supabase:', supabaseEvent)

      // Convert to frontend format and add to local state
      const newEvent: Event = {
        id: supabaseEvent.id,
        title: supabaseEvent.title,
        description: supabaseEvent.description,
        type: supabaseEvent.type,
        status: supabaseEvent.status,
        startDate: new Date(supabaseEvent.start_date),
        endDate: new Date(supabaseEvent.end_date),
        location: supabaseEvent.location || '',
        maxParticipants: supabaseEvent.max_participants,
        isPublic: supabaseEvent.is_public,
        estimatedCost: supabaseEvent.estimated_cost,
        createdAt: new Date(supabaseEvent.created_at),
        updatedAt: new Date(supabaseEvent.updated_at),
        createdBy: supabaseEvent.created_by,
        participants: [],
        itinerary: []
      }
      
      setAllEvents(prev => [...prev, newEvent])
      alert(`Event "${eventData.title}" created successfully!`)
      setShowNewEventSheet(false)

      // If there are itinerary items, create them too
      if (eventData.itinerary && eventData.itinerary.length > 0) {
        console.log('Creating itinerary items:', eventData.itinerary)
        for (const item of eventData.itinerary) {
          try {
            const itineraryInsert = {
              event_id: supabaseEvent.id,
              type: item.type,
              title: item.title,
              description: item.description,
              start_time: item.startTime,
              end_time: item.endTime,
              location: item.location,
              cost: item.cost,
              notes: item.notes,
              order_index: item.order || 0
            }
            
            await itineraryService.createItineraryItem(itineraryInsert)
            console.log('Itinerary item created:', item.title)
          } catch (itineraryError) {
            console.error('Error creating itinerary item:', itineraryError)
          }
        }
      }
      
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
    }
  }

  const handleEventClick = (event: Event) => {
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
          <IOSActionButton 
            key="add-event"
            onClick={handleNewEventFromFAB}
            aria-label="Add new event"
            variant="primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </IOSActionButton>
        ]}
      />

      {/* Vertical Calendar */}
      <div className="flex-1 pt-28">
        <VerticalCalendar
          events={allEvents}
          onDayShortPress={handleDayShortPress}
          onDayLongPress={handleDayLongPress}
          initialDate={new Date()}
        />
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