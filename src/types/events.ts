export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type EventType = 'adventure' | 'meeting' | 'social' | 'training' | 'other'

export interface LocationData {
  address: string
  lat: number
  lng: number
  placeId?: string
}

export interface Event {
  id: string
  title: string
  description: string
  type: EventType
  status: EventStatus
  startDate: Date
  endDate: Date
  location?: string | LocationData
  maxParticipants?: number
  currentParticipants: string[] // User IDs
  createdBy: string // User ID
  createdAt: Date
  updatedAt: Date
  itinerary: ItineraryItem[]
  estimatedCost?: number
  isPublic: boolean
}

export type ItineraryType = 'flight' | 'travel' | 'accommodation' | 'activity' | 'meal' | 'other'

export interface ItineraryItem {
  id: string
  eventId: string
  type: ItineraryType
  title: string
  description?: string
  startTime: Date
  endTime?: Date
  location?: string | LocationData
  cost?: number
  notes?: string
  order: number
  // Flight-specific fields
  flightNumber?: string
  departureAirport?: string
  arrivalAirport?: string
  airline?: string
  // Accommodation-specific fields
  hotelName?: string
  roomType?: string
  checkIn?: Date
  checkOut?: Date
  // Travel-specific fields
  transportType?: string
  departureLocation?: string
  arrivalLocation?: string
  // Activity-specific fields
  duration?: number
  difficultyLevel?: string
  equipmentProvided?: boolean
  // Payment info
  paidBy?: string
  needsPayment?: boolean
  splitParticipants?: string[]
}

export function getEventStatusColor(status: EventStatus): string {
  const colors: Record<EventStatus, string> = {
    'draft': 'bg-gray-100 text-gray-800',
    'published': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
    'completed': 'bg-blue-100 text-blue-800'
  }
  return colors[status]
}

export function getEventTypeColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    'adventure': 'bg-orange-100 text-orange-800',
    'meeting': 'bg-blue-100 text-blue-800',
    'social': 'bg-purple-100 text-purple-800',
    'training': 'bg-green-100 text-green-800',
    'other': 'bg-gray-100 text-gray-800'
  }
  return colors[type]
}