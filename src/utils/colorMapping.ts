import type { EventStatus, EventType } from '@/types/events'
import type { ExpenseStatus, ExpenseCategory } from '@/types/expenses'
import type { DocumentType, DocumentStatus } from '@/types/documents'
import type { ItineraryType } from '@/types/supabase'

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

export function getExpenseStatusColor(status: ExpenseStatus): string {
  const colors: Record<ExpenseStatus, string> = {
    'draft': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'settled': 'bg-blue-100 text-blue-800'
  }
  return colors[status]
}

export function getExpenseCategoryColor(category: ExpenseCategory): string {
  const colors: Record<ExpenseCategory, string> = {
    'accommodation': 'bg-blue-100 text-blue-800',
    'food': 'bg-orange-100 text-orange-800',
    'transport': 'bg-green-100 text-green-800',
    'activities': 'bg-purple-100 text-purple-800',
    'equipment': 'bg-gray-100 text-gray-800',
    'other': 'bg-gray-100 text-gray-800'
  }
  return colors[category]
}

export function getDocumentTypeColor(type: DocumentType): string {
  const colors: Record<DocumentType, string> = {
    'pdf': 'bg-red-100 text-red-800',
    'image': 'bg-green-100 text-green-800',
    'video': 'bg-purple-100 text-purple-800',
    'audio': 'bg-blue-100 text-blue-800',
    'doc': 'bg-blue-100 text-blue-800',
    'spreadsheet': 'bg-green-100 text-green-800',
    'other': 'bg-gray-100 text-gray-800'
  }
  return colors[type]
}

export function getDocumentStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800'
  }
  return colors[status]
}

/**
 * Get background color for expense categories (used for icons/dots)
 */
export function getExpenseCategoryBgColor(category: ExpenseCategory): string {
  const colors: Record<ExpenseCategory, string> = {
    'accommodation': 'bg-purple-500',
    'food': 'bg-orange-500',
    'transport': 'bg-blue-500',
    'activities': 'bg-green-500',
    'equipment': 'bg-gray-500',
    'other': 'bg-gray-500'
  }
  return colors[category]
}

/**
 * Get Tailwind classes for general status badges (used in SplitPay pages)
 */
export function getStatusClasses(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800'
    case 'settled':
      return 'bg-green-100 text-green-800'
    case 'active':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get icon for event type
 */
export function getEventTypeIcon(type: EventType): string {
  const icons: Record<EventType, string> = {
    'adventure': '⛰️',
    'meeting': '👥',
    'social': '🎉',
    'training': '📚',
    'other': '📅'
  }
  return icons[type]
}

/**
 * Get Tailwind classes for itinerary item types
 */
export function getItineraryTypeColor(type: ItineraryType): string {
  const colors: Record<ItineraryType, string> = {
    'travel': 'bg-blue-100 text-blue-800',
    'accommodation': 'bg-purple-100 text-purple-800',
    'activity': 'bg-green-100 text-green-800',
    'meal': 'bg-orange-100 text-orange-800',
    'other': 'bg-gray-100 text-gray-800'
  }
  return colors[type]
}
