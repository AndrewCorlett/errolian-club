export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'settled'
export type ExpenseCategory = 'accommodation' | 'food' | 'transport' | 'activities' | 'equipment' | 'other'

export interface Expense {
  id: string
  title: string
  description?: string
  amount: number
  currency: string
  category: ExpenseCategory
  status: ExpenseStatus
  eventId?: string // Optional - can be standalone expense
  paidBy: string // User ID
  participants: ExpenseParticipant[]
  receiptUrl?: string
  createdAt: Date
  updatedAt: Date
  settledAt?: Date
}

export interface ExpenseParticipant {
  userId: string
  shareAmount: number
  isPaid: boolean
  paidAt?: Date
}

export interface Settlement {
  id: string
  fromUserId: string
  toUserId: string
  amount: number
  expenseIds: string[]
  createdAt: Date
  settledAt?: Date
  isSettled: boolean
}

export interface UserBalance {
  userId: string
  totalOwed: number // What they owe to others
  totalOwedTo: number // What others owe to them
  netBalance: number // Positive = owed money, Negative = owes money
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

// Expense Events - separate from calendar events but can be linked
export interface ExpenseEvent {
  id: string
  universal_id?: string // Universal identifier linking all related data
  title: string
  description?: string
  location?: string
  currency: string
  status: 'active' | 'settled' | 'archived'
  createdBy: string
  calendar_event_id?: string
  totalAmount: number
  participantCount: number
  createdAt: Date
  updatedAt: Date
  settledAt?: Date
  expenses?: Expense[]
}

export interface ExpenseEventParticipant {
  expenseEventId: string
  userId: string
  joinedAt: Date
  isActive: boolean
}

export function calculateUserBalance(expenses: Expense[], userId: string): UserBalance {
  let totalOwed = 0
  let totalOwedTo = 0

  expenses.forEach(expense => {
    if (expense.status === 'settled') return

    const userParticipant = expense.participants.find(p => p.userId === userId)
    
    if (userParticipant && !userParticipant.isPaid) {
      if (expense.paidBy === userId) {
        // User paid for others
        expense.participants.forEach(participant => {
          if (participant.userId !== userId && !participant.isPaid) {
            totalOwedTo += participant.shareAmount
          }
        })
      } else {
        // User owes money
        totalOwed += userParticipant.shareAmount
      }
    }
  })

  return {
    userId,
    totalOwed,
    totalOwedTo,
    netBalance: totalOwedTo - totalOwed
  }
}