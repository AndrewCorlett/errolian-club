import { useState, useEffect } from 'react'
import { format, addDays, subDays, isSameDay } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import type { Event, ItineraryItem } from '@/types/events'
import { getPortugalTripEventsByDate, getPortugalTripColors } from '@/data/portugalGolfTrip'

interface DayViewSheetProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  events: Event[]
  onEventClick?: (event: Event) => void
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
  data: Event | ItineraryItem
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
  const colors = getPortugalTripColors()

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

  // Get all items for the current date
  const getTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = []

    // Regular events
    events.forEach(event => {
      if (isSameDay(currentDate, event.startDate)) {
        items.push({
          id: event.id,
          title: event.title,
          startTime: format(event.startDate, 'HH:mm'),
          endTime: format(event.endDate, 'HH:mm'),
          color: '#d7c6ff',
          type: 'event',
          data: event
        })
      }
    })

    // Portugal trip itinerary items
    const itineraryItems = getPortugalTripEventsByDate(currentDate)
    itineraryItems.forEach(item => {
      items.push({
        id: item.id,
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        color: colors[item.type] || '#d7c6ff',
        type: 'itinerary',
        data: item
      })
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
      onEventClick(item.data as Event)
    } else if (item.type === 'itinerary' && onItineraryClick) {
      onItineraryClick(item.data as ItineraryItem)
    }
  }

  const getTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return (hours * 60 + minutes) / (24 * 60) * 100
  }

  const getItemHeight = (startTime: string, endTime: string): number => {
    const startPos = getTimePosition(startTime)
    const endPos = getTimePosition(endTime)
    return Math.max(endPos - startPos, 2.5) // Minimum height of 2.5%
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
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
            
            <h2 className="text-lg font-semibold text-gray-900">Day View</h2>
            
            <button
              onClick={() => onNewEvent?.(currentDate)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Date Scroller */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousDay}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {format(currentDate, 'EEEE')}
                </h3>
                <p className="text-sm text-gray-600">
                  {format(currentDate, 'MMMM d, yyyy')}
                </p>
              </div>

              <button
                onClick={handleNextDay}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
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
            <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
              <div className="flex items-center text-xs text-gray-500 p-4">
                <div className="w-12">Time</div>
                <div className="flex-1">Events</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative" style={{ height: '1440px' }}> {/* 24 hours * 60px per hour */}
              {/* Hour lines and empty hour slots */}
              {timelineHours.map((time, index) => {
                const hourHasEvents = timelineItems.some(item => {
                  const [startHour] = item.startTime.split(':').map(Number)
                  return startHour === index
                })
                
                return (
                  <div
                    key={time}
                    className="absolute inset-x-0 border-t border-gray-100"
                    style={{ 
                      top: `${(index / 24) * 100}%`,
                      height: `${100 / 24}%`
                    }}
                  >
                    <div className="flex items-start px-4 pt-1 h-full">
                      <div className="w-12 text-xs text-gray-500 flex-shrink-0">{time}</div>
                      {!hourHasEvents && (
                        <div className="ml-2 flex-1 h-full">
                          <div 
                            className="h-full rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer border border-gray-100/50"
                            onClick={() => onNewEvent?.(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), index))}
                            title={`Add event at ${time}`}
                          >
                            <div className="flex items-center justify-center h-full">
                              <span className="text-xs text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
                                + Add event
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Timeline items */}
              {timelineItems.map((item) => (
                <div
                  key={item.id}
                  className="absolute inset-x-0 px-4 z-20"
                  style={{
                    top: `${getTimePosition(item.startTime)}%`,
                    height: `${getItemHeight(item.startTime, item.endTime)}%`
                  }}
                >
                  <div className="ml-12 mr-2 h-full">
                    <Card
                      className="h-full cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 shadow-sm"
                      style={{ 
                        borderLeftColor: item.color,
                        backgroundColor: `${item.color}20`
                      }}
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="p-3 h-full flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                            {item.title}
                          </h4>
                          <span className="text-xs text-gray-600 ml-2 whitespace-nowrap">
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>
                        {item.type === 'itinerary' && (
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {(item.data as ItineraryItem).description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-white/80 rounded-full text-gray-700 capitalize">
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
              ))}

              {/* Add event suggestion when no events exist */}
              {timelineItems.length === 0 && (
                <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 px-4 pointer-events-none">
                  <div className="ml-12 mr-2">
                    <div className="text-center py-8 text-gray-400">
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
    </div>
  )
}