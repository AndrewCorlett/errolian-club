import { format, addHours, startOfDay } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Event } from '@/types/events'
import { mockEvents } from '@/data/mockEvents'
import { getEventTypeColor, getEventStatusColor } from '@/types/events'

interface DayTimelineSheetProps {
  selectedDate: Date
  isOpen: boolean
  onClose: () => void
  onEventCreate?: () => void
  onEventClick?: (event: Event) => void
}

export default function DayTimelineSheet({ 
  selectedDate, 
  isOpen, 
  onClose, 
  onEventClick 
}: DayTimelineSheetProps) {
  if (!isOpen) return null

  // Get events for the selected day
  const dayEvents = mockEvents.filter(event => 
    format(event.startDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  )

  // Generate 24-hour timeline
  const generateTimeSlots = () => {
    const slots = []
    const dayStart = startOfDay(selectedDate)
    
    for (let hour = 0; hour < 24; hour++) {
      const timeSlot = addHours(dayStart, hour)
      const slotEvents = dayEvents.filter(event => {
        const eventHour = event.startDate.getHours()
        return eventHour === hour
      })
      
      slots.push({
        time: timeSlot,
        hour,
        events: slotEvents
      })
    }
    
    return slots
  }

  const timeSlots = generateTimeSlots()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full h-4/5 rounded-t-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-sm text-gray-600">
              {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto">
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium mb-2">No events today</p>
              <p className="text-sm text-center">Use the floating button to create your first event</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {timeSlots.filter(slot => slot.events.length > 0).length > 0 && 
                timeSlots.filter(slot => slot.events.length > 0).slice(0, 10).reduce((acc, slot, index) => {
                  if (index < 5) { // Limit to first 5 slots
                    acc.push(
                      <div key={slot.hour} className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Time */}
                          <div className="flex-shrink-0 w-16 text-sm text-gray-500 font-medium">
                            {format(slot.time, 'HH:mm')}
                          </div>
                          
                          {/* Events */}
                          <div className="flex-1 space-y-2">
                            {slot.events.length > 0 && slot.events.slice(0, 3).reduce((eventAcc, event, eventIndex) => {
                              if (eventIndex < 2) { // Limit to first 2 events per slot
                                eventAcc.push(
                                  <Card 
                                    key={event.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => onEventClick?.(event)}
                                  >
                                    <CardHeader className="pb-2">
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium">
                                          {event.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                          <span className={`text-xs px-2 py-1 rounded-md ${getEventTypeColor(event.type)}`}>
                                            {event.type}
                                          </span>
                                          <span className={`text-xs px-2 py-1 rounded-md ${getEventStatusColor(event.status)}`}>
                                            {event.status}
                                          </span>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                      <p className="text-sm text-gray-600 mb-2">
                                        {event.description}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                                        </div>
                                        {event.location && (
                                          <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {event.location}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                          </svg>
                                          {event.currentParticipants.length} participants
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              }
                              return eventAcc
                            }, [] as React.ReactElement[])}
                            {slot.events.length > 2 && (
                              <div className="text-sm text-gray-500 text-center">
                                +{slot.events.length - 2} more events
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return acc
                }, [] as React.ReactElement[])}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}