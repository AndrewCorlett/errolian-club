import { useState, useEffect, useRef } from 'react'
import { 
  format, 
  isSameDay, 
  isSameMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isToday,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth
} from 'date-fns'
import type { EventWithDetails } from '@/types/supabase'

interface VerticalCalendarProps {
  events: EventWithDetails[]
  onDayShortPress: (date: Date) => void
  onDayLongPress: (date: Date) => void
  initialDate?: Date
}

interface EventPill {
  id: string
  title: string
  color: string
  isItinerary?: boolean
}

interface MonthData {
  date: Date
  days: Date[]
}

export default function VerticalCalendar({
  events,
  onDayShortPress,
  onDayLongPress,
  initialDate = new Date()
}: VerticalCalendarProps) {
  const [months, setMonths] = useState<MonthData[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  // Helper function to convert string dates to Date objects
  const parseEventDate = (dateString: string): Date => new Date(dateString)

  // Initialize months (previous 6 months, current, next 18 months)
  useEffect(() => {
    const monthsArray: MonthData[] = []
    const startMonth = subMonths(initialDate, 6)
    
    for (let i = 0; i < 25; i++) {
      const monthDate = addMonths(startMonth, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      
      const days = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
      })

      monthsArray.push({
        date: monthDate,
        days
      })
      
      // Mark current month index
      if (isSameMonth(monthDate, initialDate)) {
        setCurrentMonthIndex(i)
      }
    }
    
    setMonths(monthsArray)
  }, [initialDate])

  // Scroll to current month on mount
  useEffect(() => {
    if (months.length > 0 && scrollRef.current) {
      const currentMonthElement = scrollRef.current.children[currentMonthIndex] as HTMLElement
      if (currentMonthElement) {
        currentMonthElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [months, currentMonthIndex])

  const getEventPillsForDay = (date: Date): EventPill[] => {
    const pills: EventPill[] = []
    
    // Regular events from Supabase
    events.forEach(event => {
      const startDate = parseEventDate(event.start_date)
      const endDate = parseEventDate(event.end_date)
      
      if (isSameDay(date, startDate) || 
          (endDate && date >= startDate && date <= endDate)) {
        pills.push({
          id: event.id,
          title: event.title,
          color: event.type === 'adventure' ? '#d7c6ff' : 
                 event.type === 'meeting' ? '#bae6fd' :
                 event.type === 'social' ? '#fde68a' :
                 event.type === 'training' ? '#fecaca' : '#e5e7eb',
          isItinerary: false
        })
      }
    })

    return pills.slice(0, 3)
  }

  const getMultiDayEvents = (date: Date) => {
    const multiDayEvents: Array<{
      event: EventWithDetails
      position: 'start' | 'middle' | 'end' | 'single'
      color: string
    }> = []

    events.forEach(event => {
      const startDate = parseEventDate(event.start_date)
      const endDate = parseEventDate(event.end_date)
      
      if (endDate && startDate < endDate) {
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff > 1) { // Multi-day event
          const eventColor = event.type === 'adventure' ? '#d7c6ff' : 
                            event.type === 'meeting' ? '#bae6fd' :
                            event.type === 'social' ? '#fde68a' :
                            event.type === 'training' ? '#fecaca' : '#e5e7eb'
          
          if (isSameDay(date, startDate)) {
            multiDayEvents.push({
              event,
              position: 'start',
              color: eventColor
            })
          } else if (isSameDay(date, endDate)) {
            multiDayEvents.push({
              event,
              position: 'end', 
              color: eventColor
            })
          } else if (date > startDate && date < endDate) {
            multiDayEvents.push({
              event,
              position: 'middle',
              color: eventColor
            })
          }
        }
      }
    })

    return multiDayEvents
  }

  const getOverflowCount = (date: Date): number => {
    const regularEvents = events.filter(event => {
      const startDate = parseEventDate(event.start_date)
      const endDate = parseEventDate(event.end_date)
      return isSameDay(date, startDate) || 
             (endDate && date >= startDate && date <= endDate)
    }).length
    return Math.max(0, regularEvents - 3)
  }

  const handleDayClick = (date: Date) => {
    onDayShortPress(date)
  }

  const handleDayLongPress = (date: Date) => {
    onDayLongPress(date)
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="flex-1 overflow-hidden">

      {/* Scrollable months */}
      <div 
        ref={scrollRef}
        className="absolute inset-x-0 overflow-y-auto"
        style={{ top: '120px', bottom: '70px' }}
      >
        {months.map((month) => (
          <div key={month.date.toISOString()} className="mb-6">
            {/* Month title with day headers */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-primary-100">
              <div className="py-2 px-4">
                <h2 className="text-lg font-semibold text-royal-600">
                  {format(month.date, 'MMMM yyyy')}
                </h2>
              </div>
              {/* Day headers for this month */}
              <div className="grid grid-cols-7 py-1 border-t border-primary-200/50">
                {weekDays.map(day => (
                  <div 
                    key={day} 
                    className="text-center text-xs font-semibold text-royal-600 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-7 gap-0">
              {month.days.map((date) => {
                const isCurrentMonth = isSameMonth(date, month.date)
                const isCurrentDay = isToday(date)
                const eventPills = getEventPillsForDay(date)
                const overflowCount = getOverflowCount(date)
                const multiDayEvents = getMultiDayEvents(date)
                
                return (
                  <div
                    key={date.toString()}
                    className={`min-h-[80px] p-2 cursor-pointer transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 relative ${
                      !isCurrentMonth ? 'opacity-30' : ''
                    }`}
                    onClick={() => handleDayClick(date)}
                    onTouchStart={() => {
                      const timer = setTimeout(() => handleDayLongPress(date), 500)
                      const element = document.activeElement as HTMLElement
                      const cleanup = () => {
                        clearTimeout(timer)
                        element?.removeEventListener('touchend', cleanup)
                        element?.removeEventListener('touchmove', cleanup)
                      }
                      element?.addEventListener('touchend', cleanup)
                      element?.addEventListener('touchmove', cleanup)
                    }}
                  >
                    {/* Multi-day event continuous lines */}
                    {multiDayEvents.map((multiEvent, index) => (
                      <div
                        key={`multi-${multiEvent.event.id}-${index}`}
                        className="absolute top-8 h-4 flex items-center"
                        style={{
                          left: multiEvent.position === 'start' ? '8px' : '0px',
                          right: multiEvent.position === 'end' ? '8px' : '0px',
                          zIndex: 10,
                          marginTop: `${index * 16}px`
                        }}
                      >
                        <div
                          className={`h-2 flex items-center ${
                            multiEvent.position === 'start' 
                              ? 'rounded-l-full pl-2' 
                              : multiEvent.position === 'end'
                              ? 'rounded-r-full pr-2'
                              : ''
                          }`}
                          style={{ 
                            backgroundColor: multiEvent.color,
                            width: '100%'
                          }}
                        >
                          {multiEvent.position === 'start' && (
                            <span className="text-[9px] font-medium text-gray-800 truncate">
                              {multiEvent.event.title}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Day number */}
                    <div className="flex items-center justify-center mb-1">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full transition-all duration-200 ${
                          isCurrentDay
                            ? 'bg-royal-600 text-white font-semibold'
                            : isCurrentMonth
                            ? 'text-gray-900 font-medium hover:bg-gray-100'
                            : 'text-gray-400'
                        }`}
                      >
                        {format(date, 'd')}
                      </span>
                    </div>

                    {/* Event pills (positioned below multi-day lines) */}
                    <div 
                      className="space-y-0.5"
                      style={{ marginTop: `${multiDayEvents.length * 16 + 4}px` }}
                    >
                      {eventPills.map((pill, pillIndex) => (
                        <div
                          key={`${pill.id}-${pillIndex}`}
                          className="h-3 rounded-full text-[10px] font-medium text-gray-800 px-1.5 transition-all duration-200 shadow-sm overflow-hidden"
                          style={{ backgroundColor: pill.color }}
                          title={pill.title}
                        >
                          <div className="truncate">
                            {pill.title}
                          </div>
                        </div>
                      ))}
                      
                      {/* Overflow indicator */}
                      {overflowCount > 0 && (
                        <div className="h-3 rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 px-1.5 text-center">
                          +{overflowCount}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}