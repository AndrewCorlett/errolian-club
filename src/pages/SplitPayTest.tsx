import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { expenseService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import type { ExpenseWithDetails } from '@/types/supabase'

interface ExpenseEvent {
  id: string
  title: string
  icon: string
  flagIcon: string
  totalAmount: number
  myExpenses: number
  status: 'active' | 'settled' | 'pending'
  participantCount: number
}

export default function SplitPayTest() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [expenseEvents, setExpenseEvents] = useState<ExpenseEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (!user) {
          // For testing purposes, show empty state when not authenticated
          setExpenseEvents([])
          setLoading(false)
          return
        }
        
        // Fetch expenses from Supabase
        const response = await expenseService.getExpenses(1, 50)
        
        // Transform Supabase expenses into our display format
        const transformedEvents = transformExpensesToEvents(response.data, user.id)
        setExpenseEvents(transformedEvents)
        
      } catch (err) {
        console.error('Failed to fetch expenses:', err)
        setError('Failed to load expenses. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [user])

  const transformExpensesToEvents = (expenses: ExpenseWithDetails[], userId: string): ExpenseEvent[] => {
    // Group expenses by event (if they have one) or treat as standalone
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

    const events: ExpenseEvent[] = []

    // Process event groups
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

    // Process standalone expenses
    standaloneExpenses.forEach(expense => {
      const myParticipation = expense.participants?.find(p => p.user_id === userId)
      const myShare = myParticipation ? Number(myParticipation.share_amount) : 0

      events.push({
        id: expense.id,
        title: expense.title,
        icon: getCategoryIcon(expense.category),
        flagIcon: '📝', // Generic icon for standalone expenses
        totalAmount: Number(expense.amount),
        myExpenses: myShare,
        status: mapExpenseStatus(expense.status),
        participantCount: expense.participants?.length || 1
      })
    })

    return events.sort((a, b) => {
      // Sort by status priority: active > pending > settled
      const statusPriority = { active: 3, pending: 2, settled: 1 }
      if (statusPriority[a.status] !== statusPriority[b.status]) {
        return statusPriority[b.status] - statusPriority[a.status]
      }
      // Then by total amount descending
      return b.totalAmount - a.totalAmount
    })
  }

  const getCategoryIcon = (category: string): string => {
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

  const getLocationFlag = (location?: string): string => {
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

  const determineEventStatus = (expenses: ExpenseWithDetails[]): 'active' | 'settled' | 'pending' => {
    const statuses = expenses.map(exp => exp.status)
    
    if (statuses.every(status => status === 'settled')) return 'settled'
    if (statuses.some(status => status === 'approved')) return 'active'
    return 'pending'
  }

  const mapExpenseStatus = (status: string): 'active' | 'settled' | 'pending' => {
    switch (status) {
      case 'settled': return 'settled'
      case 'approved': return 'active'
      default: return 'pending'
    }
  }

  const handleAddExpense = () => {
    navigate('/split-pay/new-expense')
  }

  const handleEventClick = (eventId: string) => {
    navigate(`/test/split-pay/event/${eventId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-royal-100 text-royal-700 border-royal-200'
      case 'settled': return 'bg-accent-100 text-accent-700 border-accent-200'
      case 'pending': return 'bg-primary-100 text-primary-700 border-primary-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-royal-50">
      {/* Simple Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-100">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-semibold text-royal-700">Split Pay</h1>
          <button
            onClick={handleAddExpense}
            data-testid="add-expense-button"
            aria-label="Add expense"
            className="bg-royal-600 hover:bg-royal-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-royal-200 border-t-royal-600 rounded-full"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-lg">⚠️</span>
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && expenseEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-royal-900 mb-2">No Expenses Yet</h3>
            <p className="text-accent-600 mb-6">
              Start by creating your first expense to track shared costs with friends.
            </p>
            <Button
              onClick={handleAddExpense}
              className="bg-royal-600 hover:bg-royal-700 text-white px-6 py-3"
            >
              Create First Expense
            </Button>
          </div>
        )}

        {!loading && !error && expenseEvents.length > 0 && (
          <div className="space-y-3">
            {expenseEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event.id)}
              data-testid="expense-event"
              className="bg-white rounded-2xl p-4 shadow-sm border border-primary-100 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-primary-100 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-xl">{event.icon}</span>
                  </div>
                  {/* Flag overlay */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100">
                    <span className="text-xs">{event.flagIcon}</span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-royal-900 truncate">
                      {event.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-accent-600">
                      {event.participantCount} {event.participantCount === 1 ? 'person' : 'people'}
                    </span>
                    <div className="text-right">
                      <div className="text-royal-900 font-medium">
                        £{event.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-accent-500 text-xs">
                        Your share: £{event.myExpenses.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-primary-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}