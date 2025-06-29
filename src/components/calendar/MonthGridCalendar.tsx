import { format, isSameDay, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns'
import type { EventWithDetails } from '@/types/supabase'

interface MonthGridCalendarProps {
  yearMonth: Date
  events: EventWithDetails[]
  onDayShortPress: (date: Date) => void
  onDayLongPress: (date: Date) => void
}

interface EventPill {
  id: string
  title: string
  color: string
  isItinerary?: boolean
}

export default function MonthGridCalendar({
  yearMonth,
  events,
  onDayShortPress,
  onDayLongPress
}: MonthGridCalendarProps) {
  // Generate calendar days
  const monthStart = new Date(yearMonth.getFullYear(), yearMonth.getMonth(), 1)
  const monthEnd = new Date(yearMonth.getFullYear(), yearMonth.getMonth() + 1, 0)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  })

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const getEventPillsForDay = (date: Date): EventPill[] => {
    const pills: EventPill[] = []
    
    // Regular events
    events.forEach(event => {
      const eventStart = new Date(event.start_date)
      const eventEnd = new Date(event.end_date)
      
      if (isSameDay(date, eventStart) || 
          (date >= eventStart && date <= eventEnd)) {
        pills.push({
          id: event.id,
          title: event.title,
          color: event.color || '#8b5cf6', // default purple
          isItinerary: false
        })
      }
    })

    return pills.slice(0, 3) // Max 3 visible pills
  }

  const getOverflowCount = (date: Date): number => {
    const totalPills = getEventPillsForDay(date).length
    return Math.max(0, totalPills - 3)
  }

  const handleDayClick = (date: Date) => {
    onDayShortPress(date)
  }

  const handleDayLongPress = (date: Date) => {
    onDayLongPress(date)
  }

  return (
    <div className="bg-white h-full">
      {/* Month header */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-900">
          {format(yearMonth, 'MMMM yyyy')}
        </h2>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.length > 0 && weekDays.reduce((acc, day, index) => {
          acc.push(
            <div 
              key={day} 
              className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50"
            >
              {day}
            </div>
          )
          return acc
        }, [] as React.ReactElement[])}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.length > 0 && calendarDays.slice(0, 42).reduce((acc, date, index) => {
          if (index < 35) { // Limit to first 35 days to avoid performance issues
            const isCurrentMonth = isSameMonth(date, yearMonth)
            const isCurrentDay = isToday(date)
            const eventPills = getEventPillsForDay(date)
            const overflowCount = getOverflowCount(date)
            
            acc.push(
              <div
                key={date.toString()}
                className={`min-h-[100px] p-1 border-r border-b border-gray-200 cursor-pointer transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 ${
                  !isCurrentMonth ? 'bg-gray-25' : ''
                }`}
                onClick={() => handleDayClick(date)}
                onTouchStart={() => {
                  // Simple long press detection for mobile
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
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-sm rounded-full transition-all duration-200 ${
                      isCurrentDay
                        ? 'bg-blue-600 text-white font-semibold'
                        : isCurrentMonth
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-400'
                    }`}
                  >
                    {format(date, 'd')}
                  </span>
                </div>

                {/* Event pills */}
                <div className="space-y-1">
                  {eventPills.length > 0 && eventPills.slice(0, 3).reduce((pillAcc, pill, pillIndex) => {
                    if (pillIndex < 2) { // Limit to first 2 pills per day
                      pillAcc.push(
                        <div
                          key={`${pill.id}-${pillIndex}`}
                          className="h-4 rounded-sm text-xs font-medium text-gray-800 px-1 py-0.5 truncate transition-all duration-200 hover:shadow-sm"
                          style={{ backgroundColor: pill.color }}
                          title={pill.title}
                        >
                          {pill.title}
                        </div>
                      )
                    }
                    return pillAcc
                  }, [] as React.ReactElement[])}
                  
                  {/* Overflow indicator */}
                  {(eventPills.length > 2 || overflowCount > 0) && (
                    <div className="h-4 rounded-sm bg-gray-200 text-xs font-medium text-gray-600 px-1 py-0.5 text-center">
                      +{Math.max(eventPills.length - 2, overflowCount)}
                    </div>
                  )}
                </div>
              </div>
            )
          }
          return acc
        }, [] as React.ReactElement[])}
      </div>
    </div>
  )
}