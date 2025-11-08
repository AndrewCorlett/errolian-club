import { useState, useEffect, useRef } from 'react'
import VerticalCalendar from '@/components/calendar/VerticalCalendar'
import DayViewSheet from '@/components/calendar/DayViewSheet'
import NewEventSheet from '@/components/calendar/NewEventSheet'
import CalendarFilters from '@/components/calendar/CalendarFilters'
import CalendarEventDetailSheet from '@/components/calendar/CalendarEventDetailSheet'
import ItineraryDetailSheet from '@/components/calendar/ItineraryDetailSheet'
import CalendarActionDropdown from '@/components/calendar/CalendarActionDropdown'
import AvailabilitySheet from '@/components/calendar/AvailabilitySheet'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import { eventService, itineraryService, availabilityService, expenseEventService, expenseService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import type { ItineraryItem } from '@/types/events'
import type { EventWithDetails } from '@/types/supabase'
import type { ExpenseCategory } from '@/types/expenses'

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

  // Availability data
  const [availabilityData, setAvailabilityData] = useState<any[]>([])

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

  // Load availability data when filter is enabled
  useEffect(() => {
    const loadAvailability = async () => {
      if (!activeFilters.availability || !user) return
      
      try {
        // Get availability for the next 12 months
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 1)
        
        const data = await availabilityService.getAvailability(
          user.id,
          new Date().toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
        setAvailabilityData(data)
      } catch (err) {
        console.error('Failed to load availability:', err)
      }
    }

    loadAvailability()
  }, [activeFilters.availability, user])

  // Helper function to create expenses from itinerary items
  const createExpensesFromItineraryItems = async (eventId: string, expenseEventId: string, itineraryItems: ItineraryItem[], universalId: string) => {
    const expensesToCreate = itineraryItems.filter(item => 
      item.cost > 0 && item.paid_by && item.split_between && item.split_between.length > 0
    )

    for (const item of expensesToCreate) {
      try {
        // Map itinerary type to expense category
        const getExpenseCategory = (itineraryType: string): ExpenseCategory => {
          switch (itineraryType) {
            case 'accommodation': return 'accommodation'
            case 'meal': return 'food'
            case 'travel': return 'transport'
            case 'activity': return 'activities'
            default: return 'other'
          }
        }

        // Calculate share amount for each participant
        const shareAmount = item.cost / item.split_between!.length

        // Create expense participants
        const expenseParticipants = item.split_between!.map(userId => ({
          user_id: userId,
          share_amount: shareAmount,
          is_paid: userId === item.paid_by, // Mark as paid if they're the one who paid
          paid_at: userId === item.paid_by ? new Date().toISOString() : null
        }))

        // Create the expense
        const expenseData = {
          title: item.title,
          description: item.description || `${item.type} expense from ${item.title}`,
          amount: item.cost,
          currency: 'GBP',
          category: getExpenseCategory(item.type),
          status: 'pending' as const,
          paid_by: item.paid_by,
          expense_event_id: expenseEventId,
          event_id: eventId,
          universal_id: universalId, // Link using universal_id
          participants: expenseParticipants
        }

        const createdExpense = await expenseService.createExpense(expenseData)
        
        // Update the itinerary item with the expense ID
        item.expense_id = createdExpense.id
        
        console.log('Created expense from itinerary item:', createdExpense.id)
      } catch (error) {
        console.error('Failed to create expense from itinerary item:', item.title, error)
      }
    }
  }

  const handleEventFormSubmit = async (eventData: any) => {
    if (!user) {
      alert('You must be logged in to create events')
      return
    }

    try {
      // Generate universal_id for linking all related data
      const universalId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Extract itinerary items
      const { itineraryItems, ...eventDataWithoutItinerary } = eventData

      // Map camelCase to snake_case for database fields if needed
      const mappedEventData = {
        ...eventDataWithoutItinerary,
        // Add universal_id for data linking
        universal_id: universalId,
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
            universal_id: universalId, // Link using universal_id
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
      
      // Create corresponding expense event
      try {
        console.log('Creating expense event for calendar event:', newEvent.id)
        // Deduplicate participants to avoid duplicate key errors
        const uniqueParticipants = [...new Set(eventData.selectedParticipants || [user.id])] as string[]
        const expenseEventData = {
          title: newEvent.title,
          description: newEvent.description || undefined,
          location: newEvent.location || undefined,
          currency: 'GBP',
          createdBy: user.id,
          participants: uniqueParticipants, // Use deduplicated participants from calendar event
          calendar_event_id: newEvent.id, // Legacy link to calendar event
          universal_id: universalId // Universal identifier for linking all related data
        }
        
        console.log('Expense event data:', expenseEventData)
        
        const expenseEvent = await expenseEventService.createExpenseEvent(expenseEventData)
        
        console.log('Expense event created successfully:', expenseEvent)
        
        // Create expenses from itinerary items
        if (itineraryItems && itineraryItems.length > 0) {
          console.log('Creating expenses from itinerary items:', itineraryItems)
          await createExpensesFromItineraryItems(newEvent.id, expenseEvent.id, itineraryItems, universalId)
        }
        
        console.log('✅ Expense event created for calendar event:', expenseEvent.id)
      } catch (expenseErr) {
        console.error('❌ Failed to create expense event:', expenseErr)
        console.error('Error details:', JSON.stringify(expenseErr, null, 2))
        // Show user-friendly error
        alert('Warning: Calendar event created but expense tracking setup failed. You can manually create expenses in Split Pay.')
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
      
      // Handle participant changes
      if (eventData.selectedParticipants) {
        // Get current participants from database
        const currentEvent = await eventService.getEvent(eventData.id)
        const currentParticipants = currentEvent?.participants?.map((p: any) => p.user_id) || []
        const newParticipants = eventData.selectedParticipants || []
        
        // Find participants to add and remove
        const participantsToAdd = newParticipants.filter((id: string) => !currentParticipants.includes(id))
        const participantsToRemove = currentParticipants.filter(id => !newParticipants.includes(id))
        
        // Add new participants
        for (const userId of participantsToAdd) {
          try {
            await eventService.joinEvent(eventData.id, userId)
            console.log('Added participant to event:', userId)
          } catch (error) {
            console.error('Failed to add participant:', userId, error)
          }
        }
        
        // Remove participants
        for (const userId of participantsToRemove) {
          try {
            await eventService.leaveEvent(eventData.id, userId)
            console.log('Removed participant from event:', userId)
          } catch (error) {
            console.error('Failed to remove participant:', userId, error)
          }
        }
      }
      
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
        
        // Handle expense event creation/update for itinerary items
        try {
          console.log('Handling expense event for calendar event update:', eventData.id)
          
          // Find the associated expense event by calendar_event_id
          const updatedEvent = await eventService.getEvent(eventData.id)
          if (updatedEvent) {
            // Look up expense event by calendar_event_id
            let linkedExpenseEvent = await expenseEventService.getExpenseEventByCalendarEventId(eventData.id)
            
            // If no expense event exists, create one
            if (!linkedExpenseEvent) {
              console.log('No expense event found for calendar event, creating one...')
              // Deduplicate participants to avoid duplicate key errors
              const uniqueParticipants = [...new Set(eventData.selectedParticipants || [user.id])] as string[]
              const expenseEventData = {
                title: eventData.title,
                description: eventData.description || undefined,
                location: eventData.location || undefined,
                currency: 'GBP',
                createdBy: user.id,
                participants: uniqueParticipants,
                calendar_event_id: eventData.id,
                universal_id: updatedEvent.universal_id // Use Universal ID for linking
              }
              
              linkedExpenseEvent = await expenseEventService.createExpenseEvent(expenseEventData)
              console.log('✅ Created expense event for existing calendar event:', linkedExpenseEvent.id)
            } else {
              console.log('📝 Expense event already exists:', linkedExpenseEvent.id)
              
              // Update participants if needed
              if (eventData.selectedParticipants) {
                console.log('📝 Updating expense event participants if needed')
                
                // Add new participants using the service (the service will handle duplicates)
                for (const userId of eventData.selectedParticipants) {
                  try {
                    // Get the event's universal_id for linking
                    const currentEvent = await eventService.getEvent(eventData.id)
                    const universalId = currentEvent?.universal_id
                    await expenseEventService.addParticipant(linkedExpenseEvent.id, userId, universalId)
                    console.log('✅ Added participant to expense event:', userId)
                  } catch (error) {
                    console.error('❌ Failed to add participant to expense event:', userId, error)
                  }
                }
              }
            }
            
            // Create expenses from new/updated itinerary items
            if (linkedExpenseEvent) {
              // Get the event's universal_id for linking
              const currentEvent = await eventService.getEvent(eventData.id)
              const universalId = currentEvent?.universal_id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              await createExpensesFromItineraryItems(eventData.id, linkedExpenseEvent.id, itineraryItems, universalId)
            }
          }
        } catch (expenseError) {
          console.error('❌ Failed to handle expenses for calendar event update:', expenseError)
          console.error('Error details:', JSON.stringify(expenseError, null, 2))
          // Don't fail the whole operation if expense creation fails
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
        className="fixed left-0 right-0 overflow-y-auto bg-white"
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
            availability={availabilityData}
            showAvailability={activeFilters.availability}
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
      <CalendarEventDetailSheet
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
        onAvailabilitySubmit={async (data) => {
          console.log('Availability submitted:', data)
          // Reload availability data to reflect changes
          if (activeFilters.availability && user) {
            try {
              const endDate = new Date()
              endDate.setFullYear(endDate.getFullYear() + 1)
              
              const availData = await availabilityService.getAvailability(
                user.id,
                new Date().toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
              )
              setAvailabilityData(availData)
            } catch (err) {
              console.error('Failed to reload availability:', err)
            }
          }
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