import { useState, useEffect, useRef } from 'react'
import { 
  format, 
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
  headerHeight?: number
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
  initialDate = new Date(),
  headerHeight = 0
}: VerticalCalendarProps) {
  const [months, setMonths] = useState<MonthData[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  
  // Helper function to convert string dates to Date objects
  const parseEventDate = (dateString: string): Date => new Date(dateString)

  // Initialize months (previous 6 months, current, next 18 months)
  useEffect(() => {
    const monthsData: MonthData[] = []
    const startMonth = subMonths(initialDate, 6)
    
    for (let i = 0; i < 25; i++) {
      const monthDate = addMonths(startMonth, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
      
      monthsData.push({
        date: monthDate,
        days
      })
    }
    
    setMonths(monthsData)
    setCurrentMonthIndex(6) // Start at current month
  }, [initialDate])

  // Scroll to current month on mount
  useEffect(() => {
    if (scrollRef.current && months.length > 0) {
      const currentMonthElement = scrollRef.current.children[currentMonthIndex] as HTMLElement
      if (currentMonthElement) {
        currentMonthElement.scrollIntoView({ behavior: 'auto', block: 'start' })
      }
    }
  }, [months, currentMonthIndex])

  const getEventsForDate = (date: Date): EventWithDetails[] => {
    return events.filter(event => {
      const eventStart = parseEventDate(event.start_date)
      const eventEnd = parseEventDate(event.end_date)
      
      // Check if the date falls within the event range
      return date >= eventStart && date <= eventEnd
    })
  }

  const getEventPillsForDate = (date: Date): EventPill[] => {
    const dayEvents = getEventsForDate(date)
    const pills: EventPill[] = []
    
    // Add regular events as pills
    for (const event of dayEvents) {
      pills.push({
        id: event.id,
        title: event.title,
        color: event.color || '#8b5cf6'
      })
      
      // Add itinerary items as separate pills if they exist
      if (event.itinerary_items) {
        for (const item of event.itinerary_items) {
          pills.push({
            id: `${event.id}-${item.id}`,
            title: item.title,
            color: event.color || '#8b5cf6',
            isItinerary: true
          })
        }
      }
    }
    
    return pills
  }

  const getMultiDayEvents = (month: MonthData) => {
    const multiDayEvents: Array<{
      event: EventWithDetails
      startDate: Date
      endDate: Date
      daysInMonth: number
    }> = []
    
    for (const event of events) {
      const eventStart = parseEventDate(event.start_date)
      const eventEnd = parseEventDate(event.end_date)
      
      // Check if event spans multiple days and intersects with this month
      if (eventStart < eventEnd) {
        const monthStart = startOfMonth(month.date)
        const monthEnd = endOfMonth(month.date)
        
        if (eventEnd >= monthStart && eventStart <= monthEnd) {
          const daysInMonth = Math.min(
            Math.floor((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
            30 // Cap at 30 days for rendering
          )
          
          multiDayEvents.push({
            event,
            startDate: eventStart,
            endDate: eventEnd,
            daysInMonth
          })
        }
      }
    }
    
    return multiDayEvents
  }


  return (
    <div 
      ref={scrollRef}
      className="h-full bg-white"
    >
      <div className="px-4">
        {/* Render months without map */}
        {months.length > 0 && (
          <>
            {/* Month 0 */}
            {months[0] && (
              <div className="mb-8">
                {/* Month header with day headers - Sticky together */}
                <div className="sticky top-0 bg-white z-10">
                  <h2 className="text-xl font-bold text-primary-900 mb-2 py-2">
                    {format(months[0].date, 'MMMM yyyy')}
                  </h2>
                  
                  {/* Week day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    <div className="text-center text-xs font-medium text-primary-600 py-1">Mon</div>
                    <div className="text-center text-xs font-medium text-primary-600 py-1">Tue</div>
                    <div className="text-center text-xs font-medium text-primary-600 py-1">Wed</div>
                    <div className="text-center text-xs font-medium text-primary-600 py-1">Thu</div>
                    <div className="text-center text-xs font-medium text-primary-600 py-1">Fri</div>
                    <div className="text-center text-xs font-medium text-primary-600 py-1">Sat</div>
                    <div className="text-center text-xs font-medium text-primary-600 py-1">Sun</div>
                  </div>
                </div>


                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {months[0].days.slice(0, 35).reduce((acc: React.ReactElement[], date) => {
                    const isCurrentMonth = isSameMonth(date, months[0].date)
                    const isCurrentDay = isToday(date)
                    const eventPills = getEventPillsForDate(date)
                    
                    acc.push(
                      <div
                        key={date.toISOString()}
                        className={`
                          min-h-[60px] p-1 cursor-pointer
                          hover:bg-primary-50 transition-colors relative
                          ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                          ${isCurrentDay ? 'bg-primary-100' : ''}
                        `}
                        onClick={() => onDayShortPress(date)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          onDayLongPress(date)
                        }}
                      >
                        <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary-900' : ''}`}>
                          {format(date, 'd')}
                        </div>
                        
                        {/* Event pills - limit to 2 */}
                        <div className="space-y-0.5">
                          {eventPills.slice(0, 2).reduce((pillAcc: React.ReactElement[], pill, pillIndex) => {
                            pillAcc.push(
                              <div
                                key={`pill-${pill.id}-${pillIndex}`}
                                className="h-3 text-[10px] px-1 rounded text-white truncate leading-3"
                                style={{ backgroundColor: pill.color }}
                                title={pill.title}
                              >
                                {pill.isItinerary ? '→' : ''}{pill.title}
                              </div>
                            )
                            return pillAcc
                          }, [])}
                          
                          {eventPills.length > 2 && (
                            <div className="text-[10px] text-primary-600 font-medium">
                              +{eventPills.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )
                    return acc
                  }, [])}
                </div>
              </div>
            )}

            {/* Render additional months (1-24) */}
            {months.slice(1, 25).reduce((acc: React.ReactElement[], month) => {
              acc.push(
                <div key={month.date.toISOString()} className="mb-8">
                  {/* Month header with day headers - Sticky together */}
                  <div className="sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-primary-900 mb-2 py-2">
                      {format(month.date, 'MMMM yyyy')}
                    </h2>
                    
                    {/* Week day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      <div className="text-center text-xs font-medium text-primary-600 py-1">Mon</div>
                      <div className="text-center text-xs font-medium text-primary-600 py-1">Tue</div>
                      <div className="text-center text-xs font-medium text-primary-600 py-1">Wed</div>
                      <div className="text-center text-xs font-medium text-primary-600 py-1">Thu</div>
                      <div className="text-center text-xs font-medium text-primary-600 py-1">Fri</div>
                      <div className="text-center text-xs font-medium text-primary-600 py-1">Sat</div>
                      <div className="text-center text-xs font-medium text-primary-600 py-1">Sun</div>
                    </div>
                  </div>


                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {month.days.slice(0, 35).reduce((dayAcc: React.ReactElement[], date, dayIndex) => {
                      const isCurrentMonth = isSameMonth(date, month.date)
                      const isCurrentDay = isToday(date)
                      const eventPills = getEventPillsForDate(date)
                      
                      dayAcc.push(
                        <div
                          key={`${date.toISOString()}-${dayIndex}`}
                          className={`
                            min-h-[60px] p-1 cursor-pointer
                            hover:bg-primary-50 transition-colors relative
                            ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                            ${isCurrentDay ? 'bg-primary-100' : ''}
                          `}
                          onClick={() => onDayShortPress(date)}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            onDayLongPress(date)
                          }}
                        >
                          <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary-900' : ''}`}>
                            {format(date, 'd')}
                          </div>
                          
                          {/* Event pills - limit to 2 */}
                          <div className="space-y-0.5">
                            {eventPills.slice(0, 2).reduce((pillAcc: React.ReactElement[], pill, pillIndex) => {
                              pillAcc.push(
                                <div
                                  key={`pill-${pill.id}-${pillIndex}-${dayIndex}`}
                                  className="h-3 text-[10px] px-1 rounded text-white truncate leading-3"
                                  style={{ backgroundColor: pill.color }}
                                  title={pill.title}
                                >
                                  {pill.isItinerary ? '→' : ''}{pill.title}
                                </div>
                              )
                              return pillAcc
                            }, [])}
                            
                            {eventPills.length > 2 && (
                              <div className="text-[10px] text-primary-600 font-medium">
                                +{eventPills.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      )
                      return dayAcc
                    }, [])}
                  </div>
                </div>
              )
              return acc
            }, [])}
          </>
        )}
      </div>
    </div>
  )
}