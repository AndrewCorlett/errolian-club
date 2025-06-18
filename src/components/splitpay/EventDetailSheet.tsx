import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { expenseService } from '@/lib/database'
import type { ExpenseWithDetails, Event } from '@/types/supabase'

interface EventDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  groupKey: string
  onAddExpense?: (eventId?: string) => void
  onEditExpense?: (expense: ExpenseWithDetails) => void
  onDeleteExpense?: (expenseId: string) => void
}

export default function EventDetailSheet({ isOpen, onClose, event, groupKey, onAddExpense, onEditExpense, onDeleteExpense }: EventDetailSheetProps) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [userBalance, setUserBalance] = useState({ owed: 0, owing: 0 })

  // Load expenses for this event/group
  useEffect(() => {
    const loadEventExpenses = async () => {
      if (!isOpen || !user) return

      try {
        setLoading(true)
        
        // Get all expenses
        const expensesResponse = await expenseService.getExpenses(1, 100)
        
        // Filter by event or standalone
        const filteredExpenses = expensesResponse.data.filter(expense => {
          if (groupKey === 'standalone') {
            return !expense.event_id
          } else {
            return expense.event_id === groupKey
          }
        })

        // Only show expenses where user is involved
        const userExpenses = filteredExpenses.filter(expense => {
          const userInvolved = expense.paid_by === user.id || 
                              expense.participants.some(p => p.user_id === user.id)
          return userInvolved
        })

        setExpenses(userExpenses)

        // Calculate user's balance for this event
        let totalOwed = 0
        let totalOwing = 0

        userExpenses.forEach(expense => {
          const userParticipant = expense.participants.find(p => p.user_id === user.id)
          
          if (expense.paid_by === user.id) {
            // User paid - others owe them
            expense.participants.forEach(participant => {
              if (participant.user_id !== user.id && !participant.is_paid) {
                totalOwing += Number(participant.share_amount)
              }
            })
          } else if (userParticipant && !userParticipant.is_paid) {
            // User owes money
            totalOwed += Number(userParticipant.share_amount)
          }
        })

        setUserBalance({ owed: totalOwed, owing: totalOwing })
      } catch (err) {
        console.error('Failed to load event expenses:', err)
      } finally {
        setLoading(false)
      }
    }

    loadEventExpenses()
  }, [isOpen, user, groupKey])

  if (!isOpen) return null

  const eventTitle = event ? event.title : 'Personal Expenses'
  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const netBalance = userBalance.owing - userBalance.owed

  const getExpenseStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'settled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getExpenseCategoryColor = (category: string) => {
    switch (category) {
      case 'accommodation': return 'bg-purple-500'
      case 'food': return 'bg-orange-500'
      case 'transport': return 'bg-blue-500'
      case 'activities': return 'bg-green-500'
      case 'equipment': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <>
      {/* Backdrop with Modal */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end"
        onClick={onClose}
      >
        {/* Sheet */}
        <div 
          className="w-full bg-white rounded-t-3xl shadow-2xl animate-slide-up min-h-[50vh] max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-accent-700">{eventTitle}</h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-600">
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''} • £{totalAmount.toFixed(2)} total
                </p>
                {event && (
                  <p className="text-sm text-gray-500">
                    {format(new Date(event.start_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onAddExpense && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onAddExpense(event?.id)}
                  className="h-8 w-8 p-0 rounded-full border-accent-200 text-accent-600 hover:bg-accent-50"
                  title="Add expense to this event"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Balance Summary for this event (no settle up button) */}
          {netBalance !== 0 && (
            <div className={`
              mt-4 p-4 rounded-xl border-2
              ${userBalance.owed > 0 
                ? 'bg-red-50 border-red-200' 
                : 'bg-green-50 border-green-200'
              }
            `}>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${userBalance.owed > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                <div>
                  <p className={`font-semibold ${userBalance.owed > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {userBalance.owed > 0 
                      ? `You owe £${userBalance.owed.toFixed(2)} for this ${event ? 'event' : 'group'}`
                      : `You are owed £${userBalance.owing.toFixed(2)} for this ${event ? 'event' : 'group'}`
                    }
                  </p>
                  <p className={`text-sm ${userBalance.owed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {userBalance.owed > 0 ? 'Outstanding balance' : 'Others owe you'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {userBalance.owed === 0 && userBalance.owing === 0 && expenses.length > 0 && (
            <div className="mt-4 p-4 rounded-xl border-2 border-accent-200 bg-accent-50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-500" />
                <p className="font-semibold text-accent-700">
                  All settled for this {event ? 'event' : 'group'}!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading expenses...</div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses yet</h3>
              <p className="text-gray-600">No expenses found for this {event ? 'event' : 'group'}</p>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Expense Details ({expenses.length})
              </h3>
              
              {/* Sort expenses by created date (newest first) */}
              {expenses
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(expense => {
                  const paidByUser = expense.paid_by_user
                  const userParticipant = expense.participants.find(p => p.user_id === user?.id)
                  
                  return (
                    <Card key={expense.id} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-3 h-3 rounded-full ${getExpenseCategoryColor(expense.category)}`} />
                              <CardTitle className="text-lg">{expense.title}</CardTitle>
                              <span className={`text-xs px-2 py-1 rounded-full ${getExpenseStatusColor(expense.status)}`}>
                                {expense.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Paid by {paidByUser?.name} on {format(new Date(expense.created_at), 'MMM d, yyyy')}
                            </p>
                            {expense.description && (
                              <p className="text-sm text-gray-500 mt-1">{expense.description}</p>
                            )}
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="text-right">
                              <div className="text-xl font-bold">£{Number(expense.amount).toFixed(2)}</div>
                              <div className="text-xs text-gray-500 capitalize">{expense.category}</div>
                            </div>
                            {/* Edit/Delete buttons - only show if user created the expense */}
                            {expense.paid_by === user?.id && onEditExpense && onDeleteExpense && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditExpense(expense)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-accent-600"
                                  title="Edit expense"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${expense.title}"? This action cannot be undone.`)) {
                                      onDeleteExpense(expense.id)
                                    }
                                  }}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                  title="Delete expense"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">
                            Split between {expense.participants.length} {expense.participants.length === 1 ? 'person' : 'people'}:
                          </h4>
                          
                          {expense.participants.map(participant => (
                            <div key={participant.user_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${participant.is_paid ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className={`font-medium ${participant.user_id === user?.id ? 'text-accent-700' : 'text-gray-900'}`}>
                                  {participant.user?.name || 'Unknown User'}
                                  {participant.user_id === user?.id && ' (You)'}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">£{Number(participant.share_amount).toFixed(2)}</div>
                                <div className={`text-xs ${participant.is_paid ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {participant.is_paid ? 'Paid' : 'Pending'}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {userParticipant && (
                            <div className={`mt-3 p-3 rounded-lg ${userParticipant.is_paid ? 'bg-green-50' : 'bg-yellow-50'}`}>
                              <p className={`text-sm font-medium ${userParticipant.is_paid ? 'text-green-700' : 'text-yellow-700'}`}>
                                Your share: £{Number(userParticipant.share_amount).toFixed(2)} 
                                {userParticipant.is_paid ? ' ✓ Paid' : ' ⏳ Pending'}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}