import React, { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useUserStore } from '@/store/userStore'
import { getActiveUsers } from '@/data/mockUsers'
import LocationPicker from '@/components/maps/LocationPicker'
import type { EventType, EventStatus, ItineraryType, ItineraryItem, LocationData } from '@/types/events'

interface EnhancedEventCreateModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  onEventCreate: (eventData: any) => void
  onItineraryCreate?: (itineraryData: ItineraryItem) => void
}

type TabMode = 'event' | 'itinerary'

export default function EnhancedEventCreateModal({
  isOpen,
  onClose,
  selectedDate,
  onEventCreate,
  onItineraryCreate
}: EnhancedEventCreateModalProps) {
  const { currentUser } = useUserStore()
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

  // Itinerary form data
  const [itineraryData, setItineraryData] = useState({
    type: 'flight' as ItineraryType,
    title: '',
    description: '',
    startDate: format(selectedDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    location: null as LocationData | null,
    cost: '',
    paidBy: '',
    needsPayment: true,
    splitParticipants: [] as string[],
    // Flight-specific
    flightNumber: '',
    departureAirport: '',
    arrivalAirport: '',
    airline: '',
    // Accommodation-specific
    hotelName: '',
    roomType: '',
    checkIn: format(selectedDate, 'yyyy-MM-dd'),
    checkOut: format(selectedDate, 'yyyy-MM-dd'),
    // Travel-specific
    transportType: '',
    departureLocation: '',
    arrivalLocation: '',
    // Activity-specific
    duration: '',
    difficultyLevel: '',
    equipmentProvided: false
  })

  const activeUsers = getActiveUsers()

  if (!isOpen || !currentUser) return null

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}:00`)
    const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`)
    
    onEventCreate({
      ...eventData,
      startDate: startDateTime,
      endDate: endDateTime,
      maxParticipants: eventData.invitees.length,
      currentParticipants: eventData.invitees,
      createdBy: currentUser.id,
      estimatedCost: 0
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
  }

  const handleItinerarySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const startDateTime = new Date(`${itineraryData.startDate}T${itineraryData.startTime}:00`)
    const endDateTime = new Date(`${itineraryData.startDate}T${itineraryData.endTime}:00`)
    
    const itinerary: ItineraryItem = {
      id: `itinerary_${Date.now()}`,
      eventId: 'temp_event', // This would be set when attached to an event
      type: itineraryData.type,
      title: itineraryData.title,
      description: itineraryData.description,
      startTime: startDateTime,
      endTime: endDateTime,
      location: itineraryData.location || undefined,
      cost: itineraryData.cost ? parseFloat(itineraryData.cost) : undefined,
      order: 1,
      paidBy: itineraryData.paidBy || undefined,
      needsPayment: itineraryData.needsPayment,
      splitParticipants: itineraryData.splitParticipants,
      // Type-specific fields
      ...(itineraryData.type === 'flight' && {
        flightNumber: itineraryData.flightNumber,
        departureAirport: itineraryData.departureAirport,
        arrivalAirport: itineraryData.arrivalAirport,
        airline: itineraryData.airline
      }),
      ...(itineraryData.type === 'accommodation' && {
        hotelName: itineraryData.hotelName,
        roomType: itineraryData.roomType,
        checkIn: new Date(`${itineraryData.checkIn}T15:00:00`),
        checkOut: new Date(`${itineraryData.checkOut}T11:00:00`)
      }),
      ...(itineraryData.type === 'travel' && {
        transportType: itineraryData.transportType,
        departureLocation: itineraryData.departureLocation,
        arrivalLocation: itineraryData.arrivalLocation
      }),
      ...(itineraryData.type === 'activity' && {
        duration: itineraryData.duration ? parseInt(itineraryData.duration) : undefined,
        difficultyLevel: itineraryData.difficultyLevel,
        equipmentProvided: itineraryData.equipmentProvided
      })
    }
    
    onItineraryCreate?.(itinerary)
    
    // Reset form
    setItineraryData({
      type: 'flight',
      title: '',
      description: '',
      startDate: format(selectedDate, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      location: null as LocationData | null,
      cost: '',
      paidBy: '',
      needsPayment: true,
      splitParticipants: [],
      flightNumber: '',
      departureAirport: '',
      arrivalAirport: '',
      airline: '',
      hotelName: '',
      roomType: '',
      checkIn: format(selectedDate, 'yyyy-MM-dd'),
      checkOut: format(selectedDate, 'yyyy-MM-dd'),
      transportType: '',
      departureLocation: '',
      arrivalLocation: '',
      duration: '',
      difficultyLevel: '',
      equipmentProvided: false
    })
  }

  const toggleInvitee = (userId: string) => {
    setEventData(prev => ({
      ...prev,
      invitees: prev.invitees.includes(userId)
        ? prev.invitees.filter(id => id !== userId)
        : [...prev.invitees, userId]
    }))
  }

  const toggleSplitParticipant = (userId: string) => {
    setItineraryData(prev => ({
      ...prev,
      splitParticipants: prev.splitParticipants.includes(userId)
        ? prev.splitParticipants.filter(id => id !== userId)
        : [...prev.splitParticipants, userId]
    }))
  }

  const renderTypeSpecificFields = () => {
    switch (itineraryData.type) {
      case 'flight':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number</label>
              <Input
                type="text"
                value={itineraryData.flightNumber}
                onChange={(e) => setItineraryData(prev => ({ ...prev, flightNumber: e.target.value }))}
                placeholder="e.g., QF123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Airline</label>
              <Input
                type="text"
                value={itineraryData.airline}
                onChange={(e) => setItineraryData(prev => ({ ...prev, airline: e.target.value }))}
                placeholder="e.g., Qantas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departure Airport</label>
              <Input
                type="text"
                value={itineraryData.departureAirport}
                onChange={(e) => setItineraryData(prev => ({ ...prev, departureAirport: e.target.value }))}
                placeholder="e.g., SYD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Airport</label>
              <Input
                type="text"
                value={itineraryData.arrivalAirport}
                onChange={(e) => setItineraryData(prev => ({ ...prev, arrivalAirport: e.target.value }))}
                placeholder="e.g., MEL"
              />
            </div>
          </div>
        )
      
      case 'accommodation':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
              <Input
                type="text"
                value={itineraryData.hotelName}
                onChange={(e) => setItineraryData(prev => ({ ...prev, hotelName: e.target.value }))}
                placeholder="Hotel name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
              <Input
                type="text"
                value={itineraryData.roomType}
                onChange={(e) => setItineraryData(prev => ({ ...prev, roomType: e.target.value }))}
                placeholder="e.g., Double, Twin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
              <Input
                type="date"
                value={itineraryData.checkIn}
                onChange={(e) => setItineraryData(prev => ({ ...prev, checkIn: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
              <Input
                type="date"
                value={itineraryData.checkOut}
                onChange={(e) => setItineraryData(prev => ({ ...prev, checkOut: e.target.value }))}
              />
            </div>
          </div>
        )
        
      case 'travel':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transport Type</label>
              <Select
                value={itineraryData.transportType}
                onChange={(e) => setItineraryData(prev => ({ ...prev, transportType: e.target.value }))}
              >
                <option value="">Select transport</option>
                <option value="car">Car</option>
                <option value="train">Train</option>
                <option value="bus">Bus</option>
                <option value="ferry">Ferry</option>
                <option value="bike">Bike</option>
                <option value="walk">Walking</option>
              </Select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Departure Location</label>
              <Input
                type="text"
                value={itineraryData.departureLocation}
                onChange={(e) => setItineraryData(prev => ({ ...prev, departureLocation: e.target.value }))}
                placeholder="Starting point"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Location</label>
              <Input
                type="text"
                value={itineraryData.arrivalLocation}
                onChange={(e) => setItineraryData(prev => ({ ...prev, arrivalLocation: e.target.value }))}
                placeholder="Destination"
              />
            </div>
          </div>
        )
        
      case 'activity':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
              <Input
                type="number"
                value={itineraryData.duration}
                onChange={(e) => setItineraryData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="Duration in hours"
                min="0.5"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
              <Select
                value={itineraryData.difficultyLevel}
                onChange={(e) => setItineraryData(prev => ({ ...prev, difficultyLevel: e.target.value }))}
              >
                <option value="">Select difficulty</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="equipmentProvided"
                  checked={itineraryData.equipmentProvided}
                  onChange={(e) => setItineraryData(prev => ({ ...prev, equipmentProvided: e.target.checked }))}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="equipmentProvided" className="text-sm text-gray-700">
                  Equipment provided
                </label>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
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
                  {activeUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleInvitee(user.id)}
                      className={`p-3 rounded-xl border-2 transition-all-smooth text-left ${
                        eventData.invitees.includes(user.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                          ) : (
                            <span className="text-xs font-medium text-blue-600">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium truncate">{user.name}</span>
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
            <form onSubmit={handleItinerarySubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Itinerary Type *
                </label>
                <Select
                  value={itineraryData.type}
                  onChange={(e) => setItineraryData(prev => ({ ...prev, type: e.target.value as ItineraryType }))}
                  required
                >
                  <option value="flight">Flight</option>
                  <option value="travel">Travel</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="activity">Activity</option>
                  <option value="meal">Meal</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  type="text"
                  value={itineraryData.title}
                  onChange={(e) => setItineraryData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Itinerary item title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={itineraryData.description}
                  onChange={(e) => setItineraryData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all-smooth hover:border-gray-400"
                  rows={2}
                />
              </div>

              {/* Type-specific fields */}
              {renderTypeSpecificFields()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <Input
                    type="date"
                    value={itineraryData.startDate}
                    onChange={(e) => setItineraryData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <Input
                    type="time"
                    value={itineraryData.startTime}
                    onChange={(e) => setItineraryData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <Input
                    type="time"
                    value={itineraryData.endTime}
                    onChange={(e) => setItineraryData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <LocationPicker
                  value={itineraryData.location as LocationData | null}
                  onChange={(location) => setItineraryData(prev => ({ ...prev, location }))}
                  placeholder="Search for itinerary location..."
                />
              </div>

              {/* Payment Information */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost (AUD)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={itineraryData.cost}
                        onChange={(e) => setItineraryData(prev => ({ ...prev, cost: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
                      <Select
                        value={itineraryData.paidBy}
                        onChange={(e) => setItineraryData(prev => ({ ...prev, paidBy: e.target.value }))}
                      >
                        <option value="">Not paid yet</option>
                        {activeUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} {user.id === currentUser.id ? '(You)' : ''}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Split Between</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {activeUsers.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleSplitParticipant(user.id)}
                          className={`p-2 rounded-lg border transition-colors text-left ${
                            itineraryData.splitParticipants.includes(user.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-xs truncate">{user.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-blue-700">
                    💡 This will automatically create an expense in Split-Pay and link it to the event
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!itineraryData.title.trim()}>
                  Create Itinerary
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}