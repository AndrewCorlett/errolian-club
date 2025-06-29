import { useState, useEffect } from 'react'
import type { Event } from '@/types/events'
import { mockEvents } from '@/data/mockEvents'
import { getEventTypeColor } from '@/types/events'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import { useLongPress } from '@/hooks/useLongPress'

interface CalendarGridProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onEventClick?: (event: Event) => void
  onDateLongPress?: (date: Date) => void
  filters: {
    showEvents: boolean
    showAvailability: boolean
    showOfficerEvents: boolean
  }
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  events: Event[]
}

export default function CalendarGrid({ selectedDate, onDateSelect, onEventClick, onDateLongPress, filters }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)
  
  // Initialize visible months (-12 to +24 months) - for future infinite scroll
  useEffect(() => {
    // This will be used for infinite scroll implementation
    console.log('Calendar initialized with date range:', selectedDate)
  }, [])

  // Generate calendar days for a specific month
  const generateCalendarDays = (month: Date): CalendarDay[] => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days: CalendarDay[] = []
    let currentDate = calendarStart

    while (currentDate <= calendarEnd) {
      const dayEvents = mockEvents.filter(event => 
        isSameDay(event.startDate, currentDate) && 
        (filters.showEvents || filters.showOfficerEvents)
      )

      days.push({
        date: new Date(currentDate),
        isCurrentMonth: isSameMonth(currentDate, month),
        isToday: isSameDay(currentDate, new Date()),
        isSelected: isSameDay(currentDate, selectedDate),
        events: dayEvents
      })

      currentDate = addDays(currentDate, 1)
    }

    return days
  }

  const handleDateClick = (date: Date) => {
    onDateSelect(date)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1)
    setCurrentMonth(newMonth)
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.length > 0 && weekDays.reduce((acc, day) => {
          acc.push(
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50">
              {day}
            </div>
          )
          return acc
        }, [] as React.ReactElement[])}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {generateCalendarDays(currentMonth).length > 0 && 
          generateCalendarDays(currentMonth).slice(0, 42).reduce((acc, day, index) => {
            if (index < 35) { // Limit to first 35 days to avoid performance issues
              const DayCell = ({ day }: { day: CalendarDay }) => {
                const longPressEvents = useLongPress({
                  onLongPress: () => {
                    if (onDateLongPress) {
                      onDateLongPress(day.date)
                    }
                  },
                  onClick: () => handleDateClick(day.date),
                  threshold: 500
                })

                return (
                  <div
                    className={`
                      min-h-[100px] p-2 border-r border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors select-none
                      ${!day.isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : ''}
                      ${day.isToday ? 'bg-blue-50' : ''}
                      ${day.isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : ''}
                    `}
                    {...longPressEvents}
                  >
                    {/* Date Number */}
                    <div className={`
                      text-sm font-medium mb-1
                      ${day.isToday ? 'text-blue-600' : ''}
                      ${day.isSelected ? 'text-blue-700' : ''}
                    `}>
                      {format(day.date, 'd')}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {day.events.length > 0 && day.events.slice(0, 3).reduce((eventAcc, event, eventIndex) => {
                        if (eventIndex < 2) { // Limit to first 2 events per day
                          eventAcc.push(
                            <div
                              key={event.id}
                              className={`
                                text-xs px-2 py-1 rounded-md cursor-pointer truncate
                                ${getEventTypeColor(event.type)}
                                hover:opacity-80 transition-opacity
                              `}
                              onClick={(e) => {
                                e.stopPropagation()
                                onEventClick?.(event)
                              }}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          )
                        }
                        return eventAcc
                      }, [] as React.ReactElement[])}
                      
                      {day.events.length > 2 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{day.events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              acc.push(<DayCell key={index} day={day} />)
            }
            return acc
          }, [] as React.ReactElement[])}
      </div>
    </div>
  )
}