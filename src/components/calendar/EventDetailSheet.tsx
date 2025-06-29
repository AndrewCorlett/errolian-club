import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EventWithDetails } from '@/types/supabase'
import { useAuth } from '@/hooks/useAuth'

interface EventDetailSheetProps {
  event: EventWithDetails | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (event: EventWithDetails) => void
  onDelete?: (event: EventWithDetails) => void
  onJoinLeave?: (event: EventWithDetails, action: 'join' | 'leave') => void
}

export default function EventDetailSheet({ 
  event, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete,
  onJoinLeave 
}: EventDetailSheetProps) {
  const { user } = useAuth()

  if (!isOpen || !event) return null

  const creator = event.creator
  const participants = event.participants || []
  const isParticipant = user ? participants.some(p => p.id === user.id) : false
  const isCreator = user?.id === event.created_by
  const canEdit = user ? (isCreator || user.role === 'super-admin' || user.role === 'commodore') : false
  const canDelete = user ? (isCreator || user.role === 'super-admin' || user.role === 'commodore') : false
  const isFull = event.max_participants ? participants.length >= event.max_participants : false
  
  // Helper functions for colors
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'adventure': return '#10b981'
      case 'meeting': return '#3b82f6'
      case 'social': return '#f59e0b'
      case 'training': return '#8b5cf6'
      default: return '#6b7280'
    }
  }
  
  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#10b981'
      case 'draft': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      case 'completed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const handleJoinLeave = () => {
    if (!user || !onJoinLeave) return
    
    const action = isParticipant ? 'leave' : 'join'
    onJoinLeave(event, action)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full h-4/5 rounded-t-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Handle */}
        <div className="flex justify-center py-3 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-md ${getEventTypeColor(event.type)}`}>
                {event.type}
              </span>
              <span className={`text-xs px-2 py-1 rounded-md ${getEventStatusColor(event.status)}`}>
                {event.status}
              </span>
              {!event.is_public && (
                <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-800">
                  Private
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{event.title}</h2>
            <p className="text-gray-600 text-sm">
              Created by {creator?.name || 'Unknown'} on {format(new Date(event.created_at), 'MMM d, yyyy')}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{event.description}</p>
          </div>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Start Date
                  </div>
                  <p className="font-medium">{format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-sm text-gray-600">{format(new Date(event.start_date), 'h:mm a')}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    End Date
                  </div>
                  <p className="font-medium">{format(new Date(event.end_date), 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-sm text-gray-600">{format(new Date(event.end_date), 'h:mm a')}</p>
                </div>
              </div>

              {event.location && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </div>
                  <p className="font-medium">{event.location}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    Participants
                  </div>
                  <p className="font-medium">
                    {participants.length}
                    {event.max_participants ? ` / ${event.max_participants}` : ''}
                  </p>
                </div>

                {event.estimated_cost && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Estimated Cost
                    </div>
                    <p className="font-medium">${Number(event.estimated_cost).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Participants ({participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {participants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {participants[0]?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{participants[0]?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 capitalize">{participants[0]?.role?.replace('-', ' ') || 'member'}</p>
                        </div>
                        {participants[0]?.id === event.created_by && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Organizer
                          </span>
                        )}
                      </div>
                      {participants.length > 1 && (
                        <div className="text-sm text-gray-600">
                          +{participants.length - 1} more participants
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No participants yet</p>
              )}
            </CardContent>
          </Card>

          {/* Itinerary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Itinerary</CardTitle>
            </CardHeader>
            <CardContent>
              {event.itinerary_items && event.itinerary_items.length > 0 ? (
                <div className="space-y-3">
                  {event.itinerary_items.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-12 text-sm text-gray-500 font-medium">
                          {event.itinerary_items[0]?.start_time && event.itinerary_items[0].start_time.trim() ? 
                            (event.itinerary_items[0].start_time.includes('T') ? 
                              format(new Date(event.itinerary_items[0].start_time), 'HH:mm') : 
                              event.itinerary_items[0].start_time
                            ) : 
                            'TBD'
                          }
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{event.itinerary_items[0]?.title || 'Untitled'}</h4>
                          {event.itinerary_items[0]?.description && (
                            <p className="text-sm text-gray-600 mt-1">{event.itinerary_items[0].description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded ${getEventTypeColor(event.itinerary_items[0]?.type as any)}`}>
                              {event.itinerary_items[0]?.type || 'activity'}
                            </span>
                            {event.itinerary_items[0]?.location && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {event.itinerary_items[0].location}
                              </span>
                            )}
                            {event.itinerary_items[0]?.cost && (
                              <span>${event.itinerary_items[0].cost.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {event.itinerary_items.length > 1 && (
                        <div className="text-sm text-gray-600 text-center">
                          +{event.itinerary_items.length - 1} more itinerary items
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No itinerary items yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user && (
                <Button
                  onClick={handleJoinLeave}
                  variant={isParticipant ? "outline" : "default"}
                  disabled={!isParticipant && isFull}
                  size="sm"
                >
                  {isParticipant ? 'Leave Event' : isFull ? 'Event Full' : 'Join Event'}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {canEdit && (
                <Button 
                  onClick={() => onEdit?.(event)} 
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button 
                  onClick={() => onDelete?.(event)} 
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Delete
                </Button>
              )}
              <Button variant="outline" onClick={onClose} size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}