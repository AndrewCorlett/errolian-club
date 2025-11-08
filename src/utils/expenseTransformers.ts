import type { ExpenseWithDetails } from '@/types/supabase'
import type { ExpenseEvent as ExpenseEventType } from '@/types/expenses'

export interface DisplayExpenseEvent {
  id: string
  title: string
  icon: string
  flagIcon: string
  totalAmount: number
  myExpenses: number
  status: 'active' | 'settled' | 'pending'
  participantCount: number
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    accommodation: '🏨',
    food: '🍽️',
    transport: '🚗',
    activities: '🎯',
    equipment: '🎒',
    other: '💳'
  }
  return icons[category] || '💳'
}

export function getLocationFlag(location?: string): string {
  if (!location) return '📍'

  const locationFlags: Record<string, string> = {
    'spain': '🇪🇸',
    'barcelona': '🇪🇸',
    'alicante': '🇪🇸',
    'poland': '🇵🇱',
    'uk': '🇬🇧',
    'united kingdom': '🇬🇧',
    'england': '🇬🇧',
    'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'ireland': '🇮🇪',
    'france': '🇫🇷',
    'germany': '🇩🇪',
    'italy': '🇮🇹'
  }

  const normalizedLocation = location.toLowerCase()
  for (const [country, flag] of Object.entries(locationFlags)) {
    if (normalizedLocation.includes(country)) {
      return flag
    }
  }

  return '📍'
}

export function determineEventStatus(expenses: ExpenseWithDetails[]): 'active' | 'settled' | 'pending' {
  const statuses = expenses.map(exp => exp.status)

  if (statuses.every(status => status === 'settled')) return 'settled'
  if (statuses.some(status => status === 'approved')) return 'active'
  return 'pending'
}

export function mapExpenseStatus(status: string): 'active' | 'settled' | 'pending' {
  switch (status) {
    case 'settled': return 'settled'
    case 'approved': return 'active'
    default: return 'pending'
  }
}

export function transformExpensesToEvents(
  expenses: ExpenseWithDetails[],
  userId: string
): DisplayExpenseEvent[] {
  const eventGroups = new Map<string, ExpenseWithDetails[]>()
  const standaloneExpenses: ExpenseWithDetails[] = []

  expenses.forEach(expense => {
    if (expense.event_id && expense.event) {
      if (!eventGroups.has(expense.event_id)) {
        eventGroups.set(expense.event_id, [])
      }
      eventGroups.get(expense.event_id)!.push(expense)
    } else {
      standaloneExpenses.push(expense)
    }
  })

  const events: DisplayExpenseEvent[] = []

  eventGroups.forEach((groupExpenses, eventId) => {
    const event = groupExpenses[0].event!
    const totalAmount = groupExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const myExpenses = groupExpenses.reduce((sum, exp) => {
      const myParticipation = exp.participants?.find(p => p.user_id === userId)
      return sum + (myParticipation ? Number(myParticipation.share_amount) : 0)
    }, 0)

    const allParticipants = new Set<string>()
    groupExpenses.forEach(exp =>
      exp.participants?.forEach(p => allParticipants.add(p.user_id))
    )

    events.push({
      id: eventId,
      title: event.title,
      icon: getCategoryIcon(groupExpenses[0].category),
      flagIcon: getLocationFlag(event.location || ''),
      totalAmount,
      myExpenses,
      status: determineEventStatus(groupExpenses),
      participantCount: allParticipants.size
    })
  })

  standaloneExpenses.forEach(expense => {
    const myParticipation = expense.participants?.find(p => p.user_id === userId)
    const myShare = myParticipation ? Number(myParticipation.share_amount) : 0

    events.push({
      id: expense.id,
      title: expense.title,
      icon: getCategoryIcon(expense.category),
      flagIcon: '📝',
      totalAmount: Number(expense.amount),
      myExpenses: myShare,
      status: mapExpenseStatus(expense.status),
      participantCount: expense.participants?.length || 1
    })
  })

  return events.sort((a, b) => {
    const statusPriority = { active: 3, pending: 2, settled: 1 }
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[b.status] - statusPriority[a.status]
    }
    return b.totalAmount - a.totalAmount
  })
}

export function transformExpenseEventsToEvents(
  expenseEvents: ExpenseEventType[],
  userId: string
): DisplayExpenseEvent[] {
  return expenseEvents.map(expenseEvent => {
    const totalAmount = expenseEvent.expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
    const myExpenses = expenseEvent.expenses?.reduce((sum, exp) => {
      const myParticipation = exp.participants?.find((p: { user_id?: string; userId?: string }) =>
        (p.user_id || p.userId) === userId
      )
      if (myParticipation) {
        const shareAmount = (myParticipation as { share_amount?: number; shareAmount?: number }).share_amount ||
                            (myParticipation as { share_amount?: number; shareAmount?: number }).shareAmount || 0
        return sum + Number(shareAmount)
      }
      return sum
    }, 0) || 0

    return {
      id: expenseEvent.id,
      title: expenseEvent.title,
      icon: '🎯',
      flagIcon: getLocationFlag(expenseEvent.location || ''),
      totalAmount,
      myExpenses,
      status: expenseEvent.status as 'active' | 'settled' | 'pending',
      participantCount: expenseEvent.participantCount
    }
  })
}
