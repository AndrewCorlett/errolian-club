import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import { eventService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'

export default function SplitPay() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [expenseEvents, setExpenseEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userBalance, setUserBalance] = useState({ owed: 0, owing: 0 })

  // Load expense events and user balance
  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        setError(null)
        
        // For now, use regular events as expense events until the database is properly set up
        const eventsResponse = await eventService.getEvents(1, 100)
        
        // Transform events to look like expense events
        const mockExpenseEvents = eventsResponse.data.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          currency: 'GBP',
          status: 'active',
          createdBy: event.created_by,
          totalAmount: 0,
          participantCount: event.participants?.length || 1,
          createdAt: event.created_at
        }))
        
        setExpenseEvents(mockExpenseEvents)
        
        // Simple balance calculation - using mock data until database is set up
        setUserBalance({ owed: 0, owing: 0 })
      } catch (err) {
        console.error('Failed to load split-pay data:', err)
        setError('Failed to load expense events')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const handleCreateExpenseEvent = () => {
    navigate('/split-pay/new-expense-event')
  }

  const handleExpenseEventClick = (expenseEventId: string) => {
    navigate(`/split-pay/events/${expenseEventId}`)
  }

  const getExpenseEventIcon = (expenseEvent: any) => {
    // Return appropriate icon based on event or default
    if (expenseEvent.location?.toLowerCase().includes('restaurant') || expenseEvent.title.toLowerCase().includes('dinner')) {
      return '🍽️'
    }
    if (expenseEvent.location?.toLowerCase().includes('hotel') || expenseEvent.title.toLowerCase().includes('accommodation')) {
      return '🏨'
    }
    if (expenseEvent.title.toLowerCase().includes('transport') || expenseEvent.title.toLowerCase().includes('travel')) {
      return '🚗'
    }
    if (expenseEvent.title.toLowerCase().includes('activity') || expenseEvent.title.toLowerCase().includes('adventure')) {
      return '⛰️'
    }
    return '💰'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'settled': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expense events...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  // Calculate balance amounts
  const owesAmount = userBalance.owed // What user owes to others
  const owedAmount = userBalance.owing // What others owe to user

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-forest-50" data-splitpay-loaded="true">
      {/* iOS Header with Gold Accent */}
      <IOSHeader 
        title="Split Pay"
        className="[&_.ios-header-title]:text-accent-600 [&_.ios-header-title]:font-semibold"
        rightActions={[
          <IOSActionButton 
            key="add-expense-event"
            onClick={handleCreateExpenseEvent}
            aria-label="Add expense event"
            variant="primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </IOSActionButton>
        ]}
      />

      {/* Main Content */}
      <div className="px-4 pt-32 pb-24 max-w-md mx-auto space-y-6">
        {/* Enhanced Balance Status Banner */}
        {(owesAmount > 0 || owedAmount > 0) && (
          <div className={`
            rounded-2xl p-4 shadow-lg border-2 transition-all duration-300
            ${owesAmount > 0 
              ? 'bg-gradient-to-r from-red-50 via-red-25 to-white border-red-200' 
              : 'bg-gradient-to-r from-green-50 via-green-25 to-white border-green-200'
            }
          `}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${owesAmount > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                  <h2 className={`text-lg font-bold ${owesAmount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {owesAmount > 0 ? `You owe £${owesAmount.toFixed(2)}` : `You are owed £${owedAmount.toFixed(2)}`}
                  </h2>
                </div>
                <p className={`text-sm ${owesAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {owesAmount > 0 ? 'Outstanding balance' : 'Friends owe you money'}
                </p>
              </div>
              <Button 
                size="sm"
                className={`
                  font-semibold transition-all duration-300
                  ${owesAmount > 0 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  }
                `}
              >
                {owesAmount > 0 ? 'Settle Up' : 'Request'}
              </Button>
            </div>
          </div>
        )}

        {/* Balanced State Banner */}
        {owesAmount === 0 && owedAmount === 0 && expenseEvents.length > 0 && (
          <div className="rounded-2xl p-4 shadow-lg border-2 border-accent-200 bg-gradient-to-r from-accent-50 via-accent-25 to-white">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent-500" />
              <div>
                <h2 className="text-lg font-bold text-accent-700">All settled up!</h2>
                <p className="text-sm text-accent-600">No outstanding balances</p>
              </div>
            </div>
          </div>
        )}

        {/* Expense Event Cards */}
        <div className="space-y-4">
          {expenseEvents.map((expenseEvent) => (
            <Card 
              key={expenseEvent.id} 
              className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleExpenseEventClick(expenseEvent.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Icon */}
                    <div className="text-2xl">
                      {getExpenseEventIcon(expenseEvent)}
                    </div>
                    
                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {expenseEvent.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {expenseEvent.participantCount} person{expenseEvent.participantCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Amount and Status */}
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(expenseEvent.status)}`}>
                        {expenseEvent.status}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="font-bold text-lg text-gray-900">
                      £{(expenseEvent.totalAmount || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Your share: £{((expenseEvent.totalAmount || 0) / (expenseEvent.participantCount || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {expenseEvents.length === 0 && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No expense events yet</h3>
              <p className="text-gray-600 mb-6">Create your first expense event to start splitting costs with friends</p>
              <Button onClick={handleCreateExpenseEvent} variant="default">
                Create Expense Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}