import { useState } from 'react'
import VerticalCalendar from '@/components/calendar/VerticalCalendar'
import DayViewSheet from '@/components/calendar/DayViewSheet'
import NewEventSheet from '@/components/calendar/NewEventSheet'
import CalendarFilters from '@/components/calendar/CalendarFilters'
import EventDetailSheet from '@/components/calendar/EventDetailSheet'
import ItineraryDetailSheet from '@/components/calendar/ItineraryDetailSheet'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import { mockEvents } from '@/data/mockEvents'
import { portugalGolfTripEvent } from '@/data/portugalGolfTrip'
import type { Event, ItineraryItem } from '@/types/events'

export default function Calendar() {
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

  // Combine regular events with Portugal golf trip
  const [allEvents, setAllEvents] = useState<Event[]>([...mockEvents, portugalGolfTripEvent])

  const handleEventFormSubmit = (eventData: any) => {
    const newEvent: Event = {
      id: `event_${Date.now()}`,
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setAllEvents(prev => [...prev, newEvent])
    console.log('New event created:', newEvent)
    alert(`Event "${eventData.title}" created successfully!`)
    setShowNewEventSheet(false)
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
    <div className="min-h-screen pb-24 bg-white flex flex-col">
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