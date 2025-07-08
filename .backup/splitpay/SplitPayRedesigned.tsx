import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import { expenseService, userService, expenseEventService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import type { ExpenseWithDetails } from '@/types/supabase'
import type { ExpenseEvent as ExpenseEventType } from '@/types/expenses'

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

export default function SplitPayRedesigned() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [expenseEvents, setExpenseEvents] = useState<ExpenseEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)

  useEffect(() => {
    const fetchExpenses = async () => {
      // Wait for auth to complete before attempting to fetch
      if (authLoading) {
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        
        if (!user) {
          setExpenseEvents([])
          setLoading(false)
          return
        }
        
        // Fetch both regular expenses and expense events from Supabase
        const [expenseResponse, expenseEventResponse] = await Promise.all([
          expenseService.getExpenses(1, 50),
          expenseEventService.getExpenseEvents(1, 50)
        ])
        
        // Transform both types into our display format
        const expenseBasedEvents = transformExpensesToEvents(expenseResponse.data, user.id)
        const expenseEventBasedEvents = transformExpenseEventsToEvents(expenseEventResponse.data, user.id)
        
        setExpenseEvents([...expenseEventBasedEvents, ...expenseBasedEvents])
        
      } catch (err) {
        console.error('Failed to fetch expenses:', err)
        setError(`Failed to load expenses: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [user, authLoading])

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
        const myParticipation = exp.participants?.find((p: any) => p.user_id === userId)
        return sum + (myParticipation ? Number(myParticipation.share_amount) : 0)
      }, 0)
      
      const allParticipants = new Set<string>()
      groupExpenses.forEach(exp => 
        exp.participants?.forEach((p: any) => allParticipants.add(p.user_id))
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

  const transformExpenseEventsToEvents = (expenseEvents: ExpenseEventType[], userId: string): ExpenseEvent[] => {
    return expenseEvents.map(expenseEvent => {
      const totalAmount = expenseEvent.expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
      const myExpenses = expenseEvent.expenses?.reduce((sum, exp) => {
        // Handle inconsistent database field naming for expense participants
        const myParticipation = exp.participants?.find((p: any) => p.user_id === userId)
        if (myParticipation) {
          // Try different property names due to potential type inconsistencies
          const shareAmount = myParticipation.share_amount || myParticipation.shareAmount || 0
          return sum + Number(shareAmount)
        }
        return sum
      }, 0) || 0

      return {
        id: expenseEvent.id,
        title: expenseEvent.title,
        icon: '🎯', // Default icon for expense events
        flagIcon: getLocationFlag(expenseEvent.location || ''),
        totalAmount,
        myExpenses,
        status: expenseEvent.status as 'active' | 'settled' | 'pending',
        participantCount: expenseEvent.participantCount
      }
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
    setShowCreateEventModal(true)
  }

  const handleEventClick = (eventId: string) => {
    navigate(`/split-pay/event/${eventId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-royal-100 text-royal-700 border-royal-200'
      case 'settled': return 'bg-accent-100 text-accent-700 border-accent-200'
      case 'pending': return 'bg-primary-100 text-primary-700 border-primary-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Create Expense Event Modal Component
  const CreateExpenseEventModal = () => {
    const [eventName, setEventName] = useState('')
    const [location, setLocation] = useState('')
    const [currency, setCurrency] = useState('GBP')
    const [participants, setParticipants] = useState<{id: string, name: string, selected: boolean}[]>([])

    useEffect(() => {
      if (showCreateEventModal && user) {
        // Fetch all users and initialize participants
        userService.getUsers().then(users => {
          const allParticipants = users.map(u => ({
            id: u.id,
            name: u.id === user?.id ? `${u.name} (Me)` : u.name,
            selected: u.id === user?.id // Only current user selected by default
          }))
          setParticipants(allParticipants)
        }).catch(error => {
          console.error('Failed to fetch users:', error)
          // Fallback to just current user
          if (user && profile) {
            setParticipants([{
              id: user.id,
              name: `${profile.name} (Me)`,
              selected: true
            }])
          }
        })
      }
    }, [showCreateEventModal, user, profile])

    const handleCreate = async () => {
      try {
        // Basic validation
        if (!eventName.trim()) {
          alert('Please enter an event name')
          return
        }

        if (participants.filter(p => p.selected).length === 0) {
          alert('Please select at least one participant')
          return
        }

        console.log('Creating expense event:', {
          eventName,
          location,
          currency,
          participants: participants.filter(p => p.selected)
        })

        // Create event in Supabase
        const newEvent = await expenseEventService.createExpenseEvent({
          title: eventName,
          description: '',
          location,
          currency,
          createdBy: user!.id,
          participants: participants.filter(p => p.selected).map(p => p.id)
        })

        console.log('Created expense event:', newEvent)
        setShowCreateEventModal(false)
        
        // Refresh the events list
        const response = await expenseEventService.getExpenseEvents(1, 50)
        const transformedEvents = transformExpenseEventsToEvents(response.data, user!.id)
        setExpenseEvents(transformedEvents)
      } catch (error) {
        console.error('Failed to create event:', error)
        alert('Failed to create event. Please try again.')
      }
    }

    const toggleParticipant = (participantId: string) => {
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, selected: !p.selected } : p
      ))
    }

    if (!showCreateEventModal) return null

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button
              onClick={() => setShowCreateEventModal(false)}
              className="text-blue-600 font-medium"
            >
              Cancel
            </button>
            <h2 className="text-lg font-semibold text-gray-900">New Expense Event</h2>
            <button
              onClick={handleCreate}
              className="text-blue-600 font-medium"
            >
              Create
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="E.g. Dinner in Glasgow"
                className="w-full px-3 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="E.g. Glasgow, Scotland"
                className="w-full px-3 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              >
                <option value="GBP">£ GBP - British Pound</option>
                <option value="EUR">€ EUR - Euro</option>
                <option value="USD">$ USD - US Dollar</option>
                <option value="PLN">zł PLN - Polish Złoty</option>
                <option value="AUD">$ AUD - Australian Dollar</option>
                <option value="CAD">$ CAD - Canadian Dollar</option>
              </select>
            </div>

            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Participants</label>
              
              {/* Participants List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {participants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => toggleParticipant(participant.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          participant.selected 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {participant.selected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-900 select-none">{participant.name}</span>
                    </div>
                    {participant.id === user?.id && (
                      <span className="text-xs text-gray-500">You</span>
                    )}
                  </div>
                ))}
              </div>
              
              {participants.filter(p => p.selected).length === 0 && (
                <p className="text-sm text-red-600 mt-2">At least one participant must be selected</p>
              )}
            </div>

            {/* Event Type */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-4 border border-primary-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💡</span>
                <span className="text-sm font-medium text-royal-700">Quick Tip</span>
              </div>
              <p className="text-sm text-primary-600">
                This creates a standalone expense event. To link expenses to calendar events, create them from the Calendar section instead.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-royal-50">
      {/* iOS Header with app theming */}
      <IOSHeader 
        title="Split Pay"
        className="[&_.ios-header-title]:text-royal-700 [&_.ios-header-title]:font-semibold bg-white/80 backdrop-blur-md"
        rightActions={[
          <IOSActionButton 
            key="add-expense"
            onClick={handleAddExpense}
            aria-label="Add expense"
            data-testid="add-expense-button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </IOSActionButton>
        ]}
      />

      {/* Main Content */}
      <div className="px-4 pt-24 pb-24 max-w-md mx-auto">
        {(loading || authLoading) && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-royal-200 border-t-royal-600 rounded-full"></div>
            <p className="text-sm text-gray-500 mt-4">
              {authLoading ? 'Authenticating...' : 'Loading expenses...'}
            </p>
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
            <h3 className="text-xl font-bold text-royal-900 mb-2">No Expense Events Yet</h3>
            <p className="text-accent-600 mb-6">
              Create an expense event to start tracking shared costs with friends.
            </p>
            <Button
              onClick={handleAddExpense}
              className="bg-royal-600 hover:bg-royal-700 text-white px-6 py-3"
            >
              Create Expense Event
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

      {/* Bottom Navigation Space */}
      <div className="h-20" />
      
      {/* Create Expense Event Modal */}
      <CreateExpenseEventModal />
    </div>
  )
}