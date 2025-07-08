import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import AddExpenseModal from '@/components/splitpay/AddExpenseModal'
import EditExpenseEventModal from '@/components/splitpay/EditExpenseEventModal'
import { format } from 'date-fns'
import { eventService, expenseService, userService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import type { ExpenseWithDetails, UserProfile } from '@/types/supabase'

type ViewMode = 'expenses' | 'balances'

interface UserBalance {
  userId: string
  user: UserProfile
  owes: number // Amount this user owes to others
  owed: number // Amount others owe to this user
  netBalance: number // Positive = owed money, Negative = owes money
}

export default function ExpenseEventDetail() {
  const { expenseEventId } = useParams<{ expenseEventId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [expenseEvent, setExpenseEvent] = useState<any | null>(null)
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [participants, setParticipants] = useState<UserProfile[]>([])
  const [balances, setBalances] = useState<UserBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('expenses')
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!expenseEventId || !user) return

      try {
        setLoading(true)
        setError(null)

        // Load event details (using regular events as expense events for now)
        const eventData = await eventService.getEvent(expenseEventId)
        if (!eventData) {
          setError('Event not found')
          return
        }
        
        // Transform event to look like an expense event
        const mockExpenseEvent = {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          currency: 'GBP',
          status: 'active',
          createdBy: eventData.created_by,
          totalAmount: 0,
          participantCount: eventData.participants?.length || 1,
          createdAt: eventData.created_at,
          participants: eventData.participants || []
        }
        
        setExpenseEvent(mockExpenseEvent)

        // Load expenses for this event
        const expensesResponse = await expenseService.getExpenses(1, 100)
        const eventExpenses = expensesResponse.data.filter(expense => 
          expense.event_id === expenseEventId
        )
        setExpenses(eventExpenses)

        // Load all users to get participant details
        const users = await userService.getUsers()
        
        // Get event participants from expense participants
        const participantIds = new Set<string>()
        eventExpenses.forEach(expense => {
          participantIds.add(expense.paid_by)
          expense.participants.forEach(participant => {
            participantIds.add(participant.user_id)
          })
        })

        const eventParticipants = users.filter(u => participantIds.has(u.id))
        setParticipants(eventParticipants)

        // Calculate balances
        const calculatedBalances = calculateEventBalances(eventExpenses, eventParticipants)
        setBalances(calculatedBalances)

      } catch (err) {
        console.error('Failed to load expense event data:', err)
        setError('Failed to load expense event')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [expenseEventId, user])

  const calculateEventBalances = (eventExpenses: ExpenseWithDetails[], eventParticipants: UserProfile[]): UserBalance[] => {
    const balanceMap = new Map<string, { owes: number; owed: number; user: UserProfile }>()

    // Initialize balances for all participants
    eventParticipants.forEach(participant => {
      balanceMap.set(participant.id, { owes: 0, owed: 0, user: participant })
    })

    // Calculate balances from expenses
    eventExpenses.forEach(expense => {
      if (expense.status === 'settled') return

      const paidBy = expense.paid_by
      const totalAmount = Number(expense.amount)

      expense.participants.forEach(participant => {
        const shareAmount = Number(participant.share_amount)
        
        if (participant.user_id === paidBy) {
          // This person paid, so others owe them
          const balance = balanceMap.get(paidBy)
          if (balance) {
            balance.owed += (totalAmount - shareAmount) // They're owed the total minus their own share
          }
        } else if (!participant.is_paid) {
          // This person owes money
          const owingBalance = balanceMap.get(participant.user_id)
          if (owingBalance) {
            owingBalance.owes += shareAmount
          }
          
          // The person who paid is owed this amount
          const paidBalance = balanceMap.get(paidBy)
          if (paidBalance) {
            paidBalance.owed += shareAmount
          }
        }
      })
    })

    // Convert to array format
    return Array.from(balanceMap.entries()).map(([userId, balance]) => ({
      userId,
      user: balance.user,
      owes: balance.owes,
      owed: balance.owed,
      netBalance: balance.owed - balance.owes
    }))
  }

  const handleAddExpense = () => {
    setShowAddExpenseModal(true)
  }

  const handleRecordPayment = () => {
    // TODO: Implement record payment functionality
    alert('Record Payment functionality will be implemented soon')
  }

  const handleSendReminder = () => {
    // TODO: Implement send reminder functionality
    alert('Send Reminder functionality will be implemented soon')
  }

  const handleViewReimbursements = () => {
    // TODO: Implement view reimbursements functionality
    alert('View All Suggested Reimbursements functionality will be implemented soon')
  }

  const handleEditEvent = () => {
    setShowEditModal(true)
    setShowMenu(false)
  }

  const handleEventUpdate = async (updatedData: any) => {
    if (!expenseEventId || !user) return

    try {
      // Since we're currently using regular events as expense events, 
      // we need to update the events table instead of expense_events table
      const updatePayload = {
        title: updatedData.title,
        description: updatedData.description,
        location: updatedData.location,
        // Note: events table doesn't have currency, status, or participant_count fields
        // These would need to be added to the events table or handled differently
      }

      console.log('Updating calendar event (used as expense event):', expenseEventId, updatePayload)
      await eventService.updateEvent(expenseEventId, updatePayload)

      // Handle participant changes for calendar events
      // Get current participants from the event data, not from UI state
      const eventData = await eventService.getEvent(expenseEventId)
      const currentParticipants = eventData?.participants?.map((p: any) => p.user_id) || []
      const newParticipants = updatedData.participants || []
      
      // Find participants to add and remove
      const participantsToAdd = newParticipants.filter((id: string) => !currentParticipants.includes(id))
      const participantsToRemove = currentParticipants.filter(id => !newParticipants.includes(id))

      // Add new participants to calendar event
      for (const userId of participantsToAdd) {
        try {
          await eventService.joinEvent(expenseEventId, userId)
          console.log('Added participant to calendar event:', userId)
        } catch (error) {
          console.error('Failed to add participant to calendar event:', userId, error)
        }
      }

      // Remove participants from calendar event
      for (const userId of participantsToRemove) {
        try {
          await eventService.leaveEvent(expenseEventId, userId)
          console.log('Removed participant from calendar event:', userId)
        } catch (error) {
          console.error('Failed to remove participant from calendar event:', userId, error)
        }
      }

      // Reload the data to reflect changes
      const loadData = async () => {
        try {
          setLoading(true)
          setError(null)

          // Load event details (using regular events as expense events for now)
          const eventData = await eventService.getEvent(expenseEventId)
          if (!eventData) {
            setError('Event not found')
            return
          }
          
          // Transform event to look like an expense event
          const mockExpenseEvent = {
            id: eventData.id,
            title: eventData.title,
            description: eventData.description,
            location: eventData.location,
            currency: 'GBP',
            status: 'active',
            createdBy: eventData.created_by,
            totalAmount: 0,
            participantCount: eventData.participants?.length || 1,
            createdAt: eventData.created_at,
            participants: eventData.participants || []
          }
          
          setExpenseEvent(mockExpenseEvent)

          // Load expenses for this event
          const expensesResponse = await expenseService.getExpenses(1, 100)
          const eventExpenses = expensesResponse.data.filter(expense => 
            expense.event_id === expenseEventId
          )
          setExpenses(eventExpenses)

          // Load all users to get participant details
          const users = await userService.getUsers()
          
          // Get event participants from expense participants
          const participantIds = new Set<string>()
          eventExpenses.forEach(expense => {
            participantIds.add(expense.paid_by)
            expense.participants.forEach(participant => {
              participantIds.add(participant.user_id)
            })
          })

          const eventParticipants = users.filter(u => participantIds.has(u.id))
          setParticipants(eventParticipants)

          // Calculate balances
          const calculatedBalances = calculateEventBalances(eventExpenses, eventParticipants)
          setBalances(calculatedBalances)

        } catch (err) {
          console.error('Failed to reload expense event data:', err)
          setError('Failed to reload expense event')
        } finally {
          setLoading(false)
        }
      }

      await loadData()
      
      console.log('Expense event updated successfully')
      alert('Expense event updated successfully!')
      
    } catch (error) {
      console.error('Failed to update expense event:', error)
      alert('Failed to update expense event. Please try again.')
      throw error
    }
  }

  const handleDeleteEvent = async () => {
    if (confirm('Are you sure you want to delete this expense event? This action cannot be undone.')) {
      try {
        // TODO: Implement delete event functionality
        alert('Delete Event functionality will be implemented soon')
        // await expenseEventService.deleteExpenseEvent(expenseEventId)
        // navigate('/split-pay')
      } catch (error) {
        console.error('Failed to delete expense event:', error)
        alert('Failed to delete expense event')
      }
    }
    setShowMenu(false)
  }


  const handleExpenseClick = (expenseId: string) => {
    navigate(`/split-pay/expenses/${expenseId}`)
  }

  const getExpenseIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍽️'
      case 'accommodation': return '🏨'
      case 'transport': return '🚗'
      case 'activities': return '⛰️'
      case 'equipment': return '🎒'
      default: return '💰'
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expense event...</div>
      </div>
    )
  }

  if (error || !expenseEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  const userBalance = balances.find(b => b.userId === user?.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-forest-50">
      {/* iOS Header */}
      <IOSHeader 
        title={expenseEvent.title}
        leftActions={[
          <IOSActionButton 
            key="back"
            onClick={() => navigate('/split-pay')}
            aria-label="Back to Split Pay"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </IOSActionButton>
        ]}
        rightActions={[
          <IOSActionButton 
            key="add-expense"
            onClick={handleAddExpense}
            aria-label="Add expense"
            variant="primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </IOSActionButton>,
          <IOSActionButton 
            key="menu"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="More options"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </IOSActionButton>
        ]}
      />

      {/* Menu Dropdown */}
      {showMenu && expenseEvent && user && expenseEvent.createdBy === user.id && (
        <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)}>
          <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48">
            <button
              onClick={handleEditEvent}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm text-gray-700">Edit Event</span>
            </button>
            <div className="border-t border-gray-200 my-2"></div>
            <button
              onClick={handleDeleteEvent}
              className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm text-red-600">Delete Event</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 pt-32 pb-24 max-w-md mx-auto space-y-6">
        {/* View Toggle */}
        <div className="flex rounded-xl p-1 bg-gray-100">
          <Button
            variant={viewMode === 'expenses' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('expenses')}
            className={`flex-1 ${viewMode === 'expenses' ? 'bg-royal-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Expenses
          </Button>
          <Button
            variant={viewMode === 'balances' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('balances')}
            className={`flex-1 ${viewMode === 'balances' ? 'bg-royal-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Balances
          </Button>
        </div>

        {viewMode === 'expenses' && (
          <>
            {/* Expense Summary */}
            <Card className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">My Expenses</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      £{expenses.filter(e => e.paid_by === user?.id).reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-semibold text-gray-900">Total Expenses</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      £{expenses.reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Date */}
            {expenseEvent.createdAt && (
              <div className="text-center">
                <p className="text-sm text-gray-600 bg-white rounded-full px-4 py-2 inline-block shadow-sm">
                  {format(new Date(expenseEvent.createdAt), 'd MMM yyyy')}
                </p>
              </div>
            )}

            {/* Expenses List */}
            <div className="space-y-3">
              {expenses.map(expense => {
                const userParticipant = expense.participants.find(p => p.user_id === user?.id)
                const isPaidByUser = expense.paid_by === user?.id
                
                return (
                  <Card 
                    key={expense.id}
                    className="rounded-xl cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleExpenseClick(expense.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-xl">
                            {getExpenseIcon(expense.category)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{expense.title}</h4>
                            <p className="text-sm text-gray-600">
                              Paid by {expense.paid_by_user?.name || 'Unknown'} 
                              {isPaidByUser && ' (me)'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">£{Number(expense.amount).toFixed(2)}</p>
                          {userParticipant && (
                            <p className={`text-sm ${userParticipant.is_paid ? 'text-green-600' : 'text-orange-600'}`}>
                              £{Number(userParticipant.share_amount).toFixed(2)} {userParticipant.is_paid ? 'Paid' : 'Owed'}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {expenses.length === 0 && (
                <Card className="rounded-xl">
                  <CardContent className="text-center py-8">
                    <div className="text-2xl mb-4">📝</div>
                    <h3 className="font-semibold text-gray-900 mb-2">No expenses yet</h3>
                    <p className="text-gray-600 mb-4">Start adding expenses to track spending for this event</p>
                    <Button onClick={handleAddExpense}>Add First Expense</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {viewMode === 'balances' && (
          <>
            {/* Your Balance */}
            {userBalance && (
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <div className="text-center">
                    <h3 className="text-sm text-gray-600 mb-1">Your Balance</h3>
                    <p className={`text-3xl font-bold ${userBalance.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {userBalance.netBalance >= 0 ? '+' : ''}£{userBalance.netBalance.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {userBalance.netBalance >= 0 ? 'You are owed money' : 'You owe money'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Balance Summary */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-xl">
                <CardContent className="p-4 text-center">
                  <h3 className="text-sm text-gray-600 mb-1">You Owe</h3>
                  <p className="text-xl font-bold text-red-600">£{userBalance?.owes.toFixed(2) || '0.00'}</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4 text-center">
                  <h3 className="text-sm text-gray-600 mb-1">Owed to You</h3>
                  <p className="text-xl font-bold text-green-600">£{userBalance?.owed.toFixed(2) || '0.00'}</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="bg-blue-50 text-blue-600 border-blue-200" onClick={handleRecordPayment}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center">💳</div>
                  Record Payment
                </div>
              </Button>
              <Button variant="outline" className="bg-purple-50 text-purple-600 border-purple-200" onClick={handleSendReminder}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-600 rounded text-white text-xs flex items-center justify-center">📨</div>
                  Send Reminder
                </div>
              </Button>
            </div>

            {/* View All Suggested Reimbursements */}
            <Button variant="ghost" className="w-full bg-purple-50 text-purple-600" onClick={handleViewReimbursements}>
              View All Suggested Reimbursements
            </Button>

            {/* Individual Balances */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Individual Balances
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">Owes</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                    <span className="text-gray-600">Owed</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {balances.map(balance => (
                    <div key={balance.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold">{balance.user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium">{balance.user.name}</p>
                          {balance.netBalance < 0 && (
                            <p className="text-xs text-red-600">Owed money</p>
                          )}
                          {balance.netBalance > 0 && (
                            <p className="text-xs text-green-600">Owed money</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${balance.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {balance.netBalance >= 0 ? '+' : ''}£{balance.netBalance.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">owed</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Edit Expense Event Modal */}
      <EditExpenseEventModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        expenseEvent={expenseEvent}
        onEventUpdate={handleEventUpdate}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        expenseEventParticipants={participants}
        onExpenseCreate={async (expense) => {
          try {
            // For now, we'll use event_id to store the expense event ID
            // This is a temporary solution until the database migration is applied
            const expenseData = {
              ...expense,
              event_id: expenseEventId
            }
            
            // Create the expense
            const newExpense = await expenseService.createExpense(expenseData)
            console.log('Expense created:', newExpense)
            
            setShowAddExpenseModal(false)
            
            // Reload data to show the new expense
            if (expenseEventId && user) {
              // Reload expenses and balances
              const response = await expenseService.getExpenses(1, 50)
              const eventExpenses = response.data.filter(exp => exp.event_id === expenseEventId)
              setExpenses(eventExpenses)
              setBalances(calculateEventBalances(eventExpenses, participants))
            }
          } catch (error) {
            console.error('Failed to create expense:', error)
            alert('Failed to create expense. Please try again.')
          }
        }}
      />
    </div>
  )
}