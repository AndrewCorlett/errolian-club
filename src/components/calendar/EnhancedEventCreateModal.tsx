import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/lib/database'
import LocationPicker from '@/components/maps/LocationPicker'
import type { EventType, EventStatus, ItineraryItem, LocationData } from '@/types/events'
import ItineraryBuilder from './ItineraryBuilder'

interface EnhancedEventCreateModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  onEventCreate: (eventData: any) => void
}

type TabMode = 'event' | 'itinerary'

export default function EnhancedEventCreateModal({
  isOpen,
  onClose,
  selectedDate,
  onEventCreate
}: EnhancedEventCreateModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabMode>('event')
  
  // Event form data
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    type: 'adventure' as EventType,
    status: 'draft' as EventStatus,
    startDate: format(selectedDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    endDate: format(selectedDate, 'yyyy-MM-dd'),
    endTime: '17:00',
    location: null as LocationData | null,
    isPublic: true,
    invitees: [] as string[]
  })

  // Itinerary state
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([])

  const [users, setUsers] = useState<any[]>([])

  // Load users from database
  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        try {
          const usersData = await userService.getUsers()
          setUsers(usersData)
        } catch (error) {
          console.error('Failed to load users:', error)
          setUsers([])
        }
      }
      loadUsers()
    }
  }, [isOpen])

  if (!isOpen || !user) return null

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}:00`)
    const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`)
    
    const totalCost = itineraryItems.reduce((sum, item) => sum + (item.cost || 0), 0)
    
    onEventCreate({
      title: eventData.title,
      description: eventData.description,
      type: eventData.type,
      status: eventData.status,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
      location: eventData.location?.address || null,
      is_public: eventData.isPublic,
      max_participants: eventData.invitees.length > 0 ? eventData.invitees.length : null,
      created_by: user.id,
      estimated_cost: totalCost > 0 ? totalCost : null
    })
    
    // Reset form
    setEventData({
      title: '',
      description: '',
      type: 'adventure',
      status: 'draft',
      startDate: format(selectedDate, 'yyyy-MM-dd'),
      startTime: '09:00',
      endDate: format(selectedDate, 'yyyy-MM-dd'),
      endTime: '17:00',
      location: null as LocationData | null,
      isPublic: true,
      invitees: []
    })
    setItineraryItems([])
  }

  const handleAddExpense = (expenseData: {
    title: string
    amount: number
    category: string
    description?: string
  }) => {
    // This would integrate with Split-Pay system
    console.log('Adding expense from itinerary:', expenseData)
  }

  const toggleInvitee = (userId: string) => {
    setEventData(prev => ({
      ...prev,
      invitees: prev.invitees.includes(userId)
        ? prev.invitees.filter(id => id !== userId)
        : [...prev.invitees, userId]
    }))
  }


  return (
    <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-scale custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Create New</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tab Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('event')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
                activeTab === 'event'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Event
            </button>
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
                activeTab === 'itinerary'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Itinerary
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'event' ? (
            <form onSubmit={handleEventSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <Input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What's the adventure?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell everyone about this event..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all-smooth hover:border-gray-400"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <Select
                    value={eventData.type}
                    onChange={(e) => setEventData(prev => ({ ...prev, type: e.target.value as EventType }))}
                  >
                    <option value="adventure">Adventure</option>
                    <option value="meeting">Meeting</option>
                    <option value="social">Social</option>
                    <option value="training">Training</option>
                    <option value="other">Other</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select
                    value={eventData.status}
                    onChange={(e) => setEventData(prev => ({ ...prev, status: e.target.value as EventStatus }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={eventData.startDate}
                      onChange={(e) => setEventData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                    <Input
                      type="time"
                      value={eventData.startTime}
                      onChange={(e) => setEventData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={eventData.endDate}
                      onChange={(e) => setEventData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                    <Input
                      type="time"
                      value={eventData.endTime}
                      onChange={(e) => setEventData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <LocationPicker
                  value={eventData.location as LocationData | null}
                  onChange={(location) => setEventData(prev => ({ ...prev, location }))}
                  placeholder="Search for event location..."
                />
              </div>

              {/* Invitees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Invite Members</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {users.map(activeUser => (
                    <button
                      key={activeUser.id}
                      type="button"
                      onClick={() => toggleInvitee(activeUser.id)}
                      className={`p-3 rounded-xl border-2 transition-all-smooth text-left ${
                        eventData.invitees.includes(activeUser.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          {activeUser.avatar_url ? (
                            <img src={activeUser.avatar_url} alt={activeUser.name} className="w-6 h-6 rounded-full" />
                          ) : (
                            <span className="text-xs font-medium text-blue-600">
                              {activeUser.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium truncate">{activeUser.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={eventData.isPublic}
                  onChange={(e) => setEventData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make event public (visible to all club members)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!eventData.title.trim()}>
                  Create Event
                </Button>
              </div>
            </form>
          ) : (
            <div>
              {activeTab === 'itinerary' && (
                <ItineraryBuilder
                  eventId="temp_event"
                  initialItems={itineraryItems}
                  onItemsChange={setItineraryItems}
                  onAddExpense={handleAddExpense}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}