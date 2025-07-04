import { useState, useEffect } from 'react'
import { format, addDays, subDays, isSameDay } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import AvailabilitySheet from './AvailabilitySheet'
import type { EventWithDetails } from '@/types/supabase'
import type { ItineraryItem } from '@/types/events'

interface DayViewSheetProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  events: EventWithDetails[]
  onEventClick?: (event: EventWithDetails) => void
  onItineraryClick?: (item: ItineraryItem) => void
  onNewEvent?: (date: Date) => void
}

interface TimelineItem {
  id: string
  title: string
  startTime: string
  endTime: string
  color: string
  type: 'event' | 'itinerary'
  data: EventWithDetails | ItineraryItem
}

export default function DayViewSheet({
  isOpen,
  onClose,
  selectedDate,
  events,
  onEventClick,
  onItineraryClick,
  onNewEvent
}: DayViewSheetProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [isAvailabilitySheetOpen, setIsAvailabilitySheetOpen] = useState(false)
  // Helper function to get color for event
  const getEventColor = (event: EventWithDetails): string => {
    // Use event's color field if available, otherwise fall back to type-based colors
    if (event.color) {
      return event.color
    }
    
    // Fallback to type-based colors for compatibility
    switch (event.type) {
      case 'adventure': return '#10b981'
      case 'meeting': return '#3b82f6'
      case 'social': return '#f59e0b'
      case 'training': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  useEffect(() => {
    if (isOpen) {
      setCurrentDate(selectedDate)
    }
  }, [isOpen, selectedDate])

  if (!isOpen) return null

  // Generate timeline hours (24-hour format)
  const timelineHours = Array.from({ length: 24 }, (_, i) => 
    format(new Date().setHours(i, 0, 0, 0), 'HH:mm')
  )

  // Get itinerary item color based on type
  const getItineraryItemColor = (type: string): string => {
    switch (type) {
      case 'travel': return '#10b981' // Green for flights
      case 'accommodation': return '#3b82f6' // Light blue for accommodation
      case 'activity': return '#8b5cf6' // Purple for activities
      case 'other': return '#f59e0b' // Yellow for other
      default: return '#6b7280'
    }
  }

  // Get all items for the current date
  const getTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = []

    // Regular events from Supabase
    events.forEach(event => {
      const eventStartDate = new Date(event.start_date)
      const eventEndDate = new Date(event.end_date)
      
      // Check if the event occurs on the current date (including multi-day events)
      const currentDateStart = new Date(currentDate)
      currentDateStart.setHours(0, 0, 0, 0)
      const currentDateEnd = new Date(currentDate)
      currentDateEnd.setHours(23, 59, 59, 999)
      
      // Event occurs on this date if:
      // 1. It starts on this date, OR
      // 2. It ends on this date, OR  
      // 3. It spans across this date (starts before and ends after)
      if (eventStartDate <= currentDateEnd && eventEndDate >= currentDateStart) {
        // Calculate the display times for this specific day
        let displayStartTime: string
        let displayEndTime: string
        
        if (isSameDay(currentDate, eventStartDate)) {
          // Event starts on this day - use actual start time
          displayStartTime = format(eventStartDate, 'HH:mm')
        } else {
          // Event started on a previous day - show from 00:00
          displayStartTime = '00:00'
        }
        
        if (isSameDay(currentDate, eventEndDate)) {
          // Event ends on this day - use actual end time
          displayEndTime = format(eventEndDate, 'HH:mm')
        } else {
          // Event continues to next day - show until 23:59
          displayEndTime = '23:59'
        }
        
        items.push({
          id: event.id,
          title: event.title,
          startTime: displayStartTime,
          endTime: displayEndTime,
          color: getEventColor(event),
          type: 'event',
          data: event
        })

        // Add itinerary items for this event on this day
        if (event.itinerary_items && event.itinerary_items.length > 0) {
          event.itinerary_items.forEach(itineraryItem => {
            // Only show itinerary items that have times and are for this day
            if (itineraryItem.start_time && itineraryItem.end_time) {
              // For now, assume itinerary items are on the same day as the event start
              // In a full implementation, you'd check the actual date of each itinerary item
              if (isSameDay(currentDate, eventStartDate)) {
                items.push({
                  id: `itinerary_${itineraryItem.id}`,
                  title: itineraryItem.title,
                  startTime: itineraryItem.start_time,
                  endTime: itineraryItem.end_time,
                  color: getItineraryItemColor(itineraryItem.type),
                  type: 'itinerary',
                  data: {
                    id: itineraryItem.id,
                    eventId: event.id,
                    type: itineraryItem.type,
                    title: itineraryItem.title,
                    description: itineraryItem.description || '',
                    startTime: itineraryItem.start_time,
                    endTime: itineraryItem.end_time,
                    location: itineraryItem.location || '',
                    cost: itineraryItem.cost || 0,
                    notes: itineraryItem.notes || '',
                    order: itineraryItem.order_index || 0,
                    createdAt: new Date(itineraryItem.created_at),
                    updatedAt: new Date(itineraryItem.updated_at)
                  } as ItineraryItem
                })
              }
            }
          })
        }
      }
    })

    // Sort by start time
    return items.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const timelineItems = getTimelineItems()

  const handlePreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1))
  }

  const handleNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1))
  }

  const handleItemClick = (item: TimelineItem) => {
    if (item.type === 'event' && onEventClick) {
      onEventClick(item.data as EventWithDetails)
    } else if (item.type === 'itinerary' && onItineraryClick) {
      onItineraryClick(item.data as ItineraryItem)
    }
  }

  const getTimePosition = (time: string): number => {
    const timeParts = time.split(':')
    const hours = Number(timeParts[0]) || 0
    const minutes = Number(timeParts[1]) || 0
    return (hours * 60 + minutes) / (24 * 60) * 100
  }

  const getItemHeight = (startTime: string, endTime: string): number => {
    const startPos = getTimePosition(startTime)
    const endPos = getTimePosition(endTime)
    return Math.max(endPos - startPos, 2.5) // Minimum height of 2.5%
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      style={{ overscrollBehavior: 'contain' }}
    >
      <div 
        className="absolute inset-x-0 top-0 h-full bg-white rounded-t-xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        
        {/* Pull Handle */}
        <div className="flex justify-center py-3 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-lg font-semibold text-primary-900">Day View</h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAvailabilitySheetOpen(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-forest-600 hover:bg-forest-700 transition-colors"
                title="Mark Availability"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <button
                onClick={() => onNewEvent?.(currentDate)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-royal-600 hover:bg-royal-700 transition-colors"
                title="Create Event"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Date Scroller */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousDay}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 hover:bg-primary-200 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="text-center">
                <h3 className="text-xl font-bold text-primary-900">
                  {format(currentDate, 'EEEE')}
                </h3>
                <p className="text-sm text-royal-600">
                  {format(currentDate, 'MMMM d, yyyy')}
                </p>
              </div>

              <button
                onClick={handleNextDay}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 hover:bg-primary-200 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Always show 24-hour timeline view */}
          <div className="relative">
            {/* Time labels */}
            <div className="sticky top-0 bg-white z-10 border-b border-primary-200">
              <div className="flex items-center text-xs text-royal-600 p-4">
                <div className="w-12">Time</div>
                <div className="flex-1">Events</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative" style={{ height: '1440px' }}> {/* 24 hours * 60px per hour */}
              {/* Hour lines and empty hour slots */}
              {timelineHours.length > 0 && Array.from({ length: Math.min(24, timelineHours.length) }, (_, index) => {
                const time = timelineHours[index]
                if (!time) return null
                
                const hourHasEvents = timelineItems.some(item => {
                  const startTimeParts = item.startTime.split(':')
                  const startHour = Number(startTimeParts[0]) || 0
                  return startHour === index
                })
                
                return (
                  <div
                    key={time}
                    className="absolute inset-x-0 border-t border-primary-100"
                    style={{ 
                      top: `${(index / 24) * 100}%`,
                      height: `${100 / 24}%`
                    }}
                  >
                    <div className="flex items-start px-4 pt-1 h-full">
                      <div className="w-12 text-xs text-royal-500 flex-shrink-0">{time}</div>
                      {!hourHasEvents && (
                        <div className="ml-2 flex-1 h-full">
                          <div 
                            className="h-full rounded-lg bg-primary-50/50 hover:bg-primary-100/50 transition-colors cursor-pointer border border-primary-100/50"
                            onClick={() => onNewEvent?.(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), index))}
                            title={`Add event at ${time}`}
                          >
                            <div className="flex items-center justify-center h-full">
                              <span className="text-xs text-royal-400 opacity-0 hover:opacity-100 transition-opacity">
                                + Add event
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }).filter(Boolean)}

              {/* Timeline items */}
              {timelineItems.length > 0 ? 
                timelineItems.slice(0, 10).filter(item => item && item.id).reduce((acc, item, index) => {
                  if (index < 5) { // Limit to first 5 items to avoid performance issues
                    acc.push(
                      <div
                        key={item.id}
                        className="absolute inset-x-0 px-4 z-30"
                        style={{
                          top: `${getTimePosition(item.startTime)}%`,
                          height: `${getItemHeight(item.startTime, item.endTime)}%`
                        }}
                      >
                        <div className={`${item.type === 'itinerary' ? 'ml-16' : 'ml-12'} mr-2 h-full`}>
                          <Card
                            className="h-full cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 shadow-sm"
                            style={{ 
                              borderLeftColor: item.color,
                              backgroundColor: `${item.color}20`
                            }}
                            onClick={() => handleItemClick(item)}
                          >
                            <CardContent className="p-3 h-full flex flex-col justify-start">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className={`font-medium text-primary-900 text-sm line-clamp-1 flex-1 ${
                                  item.type === 'itinerary' ? 'text-xs' : ''
                                }`}>
                                  {item.type === 'itinerary' && '┗ '}{item.title}
                                </h4>
                                <span className="text-xs text-royal-600 ml-2 whitespace-nowrap">
                                  {item.startTime} - {item.endTime}
                                </span>
                              </div>
                              {item.type === 'itinerary' && (
                                <p className="text-xs text-royal-600 line-clamp-1 mb-1">
                                  {(item.data as ItineraryItem).description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-auto">
                                <span 
                                  className="text-xs px-2 py-0.5 rounded-full text-primary-700 capitalize"
                                  style={{ 
                                    backgroundColor: item.type === 'itinerary' ? item.color : 'rgba(255,255,255,0.8)',
                                    color: item.type === 'itinerary' ? 'white' : undefined
                                  }}
                                >
                                  {item.type === 'itinerary' ? (item.data as ItineraryItem).type : 'event'}
                                </span>
                                {item.type === 'itinerary' && (item.data as ItineraryItem).cost > 0 && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 rounded-full text-green-700">
                                    £{(item.data as ItineraryItem).cost}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )
                  }
                  return acc
                }, [] as React.ReactElement[]) 
                : []}

              {/* Add event suggestion when no events exist */}
              {timelineItems.length === 0 && (
                <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 px-4 pointer-events-none">
                  <div className="ml-12 mr-2">
                    <div className="text-center py-8 text-royal-400">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-sm">Tap any hour to add an event</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Availability Sheet */}
      <AvailabilitySheet
        isOpen={isAvailabilitySheetOpen}
        onClose={() => setIsAvailabilitySheetOpen(false)}
        selectedDate={currentDate}
        onAvailabilitySubmit={(availability) => {
          console.log('Availability submitted:', availability)
          // TODO: Handle availability submission to backend
        }}
      />
    </div>
  )
}