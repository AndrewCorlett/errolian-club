export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type EventType = 'adventure' | 'meeting' | 'social' | 'training' | 'other'


export interface Event {
  id: string
  universal_id: string // Universal identifier linking all related data
  title: string
  description: string
  type: EventType
  status: EventStatus
  startDate: Date
  endDate: Date
  location?: string
  maxParticipants?: number
  currentParticipants: string[] // User IDs
  createdBy: string // User ID
  createdAt: Date
  updatedAt: Date
  itinerary: ItineraryItem[]
  estimatedCost?: number
  isPublic: boolean
}

export type ItineraryType = 'travel' | 'accommodation' | 'activity' | 'meal' | 'other'
export type DifficultyLevel = 'easy' | 'moderate' | 'challenging' | 'extreme'

export interface ItineraryItem {
  id: string
  eventId: string
  universal_id: string // Universal identifier linking all related data
  type: ItineraryType
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  cost: number
  notes: string
  order: number
  createdAt: Date
  updatedAt: Date
  
  // Expense-related fields
  paid_by?: string // User ID of who paid for this item
  split_between?: string[] // Array of user IDs to split the cost between
  expense_id?: string // ID of the generated expense in the expense event
  
  // Travel-specific fields
  travelMethod?: string
  departureLocation?: string
  arrivalLocation?: string
  confirmation?: string
  
  // Accommodation-specific fields
  accommodationType?: string
  address?: string
  checkIn?: string
  checkOut?: string
  
  // Activity-specific fields
  category?: string
  duration?: number
  difficulty?: DifficultyLevel
  requirements?: string
  
  // Meal-specific fields
  mealType?: string
  cuisine?: string
  reservation?: string
}

export { getEventStatusColor, getEventTypeColor } from '@/utils/colorMapping'