import { useState, useEffect } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import { format } from 'date-fns'
import { expenseService } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import AddExpenseModal from '@/components/splitpay/AddExpenseModal'
import SettleUpModal from '@/components/splitpay/SettleUpModal'
import EventDetailSheet from '@/components/splitpay/EventDetailSheet'
import EditExpenseModal from '@/components/splitpay/EditExpenseModal'
import type { ExpenseWithDetails, Event, ExpenseCategory } from '@/types/supabase'

export default function SplitPay() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [showSettleUpModal, setShowSettleUpModal] = useState(false)
  const [showEventDetailSheet, setShowEventDetailSheet] = useState(false)
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false)
  const [selectedEventGroup, setSelectedEventGroup] = useState<{groupKey: string, event: Event | null}>({groupKey: '', event: null})
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | null>(null)
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userBalance, setUserBalance] = useState({ owed: 0, owing: 0 })
  
  // Get open state from URL
  const openCardId = searchParams.get('open')

  // Auto-open add expense modal when on new-expense route
  useEffect(() => {
    if (location.pathname === '/split-pay/new-expense') {
      setShowAddExpenseModal(true)
    }
  }, [location.pathname])

  // Load expenses and user balance
  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Load expenses and user balance in parallel
        const [expensesResponse, balanceResponse] = await Promise.all([
          expenseService.getExpenses(1, 100),
          expenseService.getUserBalance(user.id)
        ])
        
        setExpenses(expensesResponse.data)
        setUserBalance(balanceResponse)
      } catch (err) {
        console.error('Failed to load split-pay data:', err)
        setError('Failed to load expenses')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Please log in to view expenses</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expenses...</div>
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
  // userBalance.owed = what user owes to others
  // userBalance.owing = what others owe to user  
  const owesAmount = userBalance.owed // What user owes to others
  const owedAmount = userBalance.owing // What others owe to user

  // Helper functions for styling
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

  // Filter expenses for current user
  const userExpenses = expenses.filter(expense => {
    const userInvolved = expense.paid_by === user.id || 
                        expense.participants.some(p => p.user_id === user.id)
    return userInvolved
  })

  // Group expenses by event
  const groupedExpenses = userExpenses.reduce((groups, expense) => {
    const key = expense.event_id || 'standalone'
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(expense)
    return groups
  }, {} as Record<string, ExpenseWithDetails[]>)
  
  const toggleCard = (cardId: string) => {
    if (openCardId === cardId) {
      searchParams.delete('open')
    } else {
      searchParams.set('open', cardId)
    }
    setSearchParams(searchParams)
  }

  const handleEventDetailClick = (groupKey: string, event: Event | null) => {
    setSelectedEventGroup({ groupKey, event })
    setShowEventDetailSheet(true)
  }

  const handleAddExpenseFromDetail = (_eventId?: string) => {
    // Close the detail sheet and open add expense modal with event pre-selected
    setShowEventDetailSheet(false)
    setShowAddExpenseModal(true)
    // TODO: Pass eventId to AddExpenseModal to pre-select the event
  }

  const handleEditExpense = (expense: ExpenseWithDetails) => {
    setSelectedExpense(expense)
    setShowEventDetailSheet(false)
    setShowEditExpenseModal(true)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) return

    try {
      await expenseService.deleteExpense(expenseId)
      
      // Reload expenses and balance
      const [expensesResponse, balanceResponse] = await Promise.all([
        expenseService.getExpenses(1, 100),
        expenseService.getUserBalance(user.id)
      ])
      
      setExpenses(expensesResponse.data)
      setUserBalance(balanceResponse)
      
      alert('Expense deleted successfully!')
    } catch (err) {
      console.error('Failed to delete expense:', err)
      alert('Failed to delete expense. Please try again.')
    }
  }

  const handleAddExpense = () => {
    setShowAddExpenseModal(true)
  }

  const handleExpenseCreate = async (expenseData: {
    title: string
    description?: string
    amount: number
    category: string
    event_id?: string
    participants: Array<{
      user_id: string
      share_amount: number
      is_paid?: boolean
      paid_at?: string | null
    }>
  }) => {
    try {
      // Extract participants before sending to service
      const { participants, ...expenseOnly } = expenseData
      
      const newExpense = await expenseService.createExpense({
        ...expenseOnly,
        paid_by: user.id
      })
      
      // Then add participants separately with all fields
      if (participants && participants.length > 0) {
        const participantInserts = participants.map((p) => ({
          expense_id: newExpense.id,
          user_id: p.user_id,
          share_amount: p.share_amount,
          is_paid: p.is_paid || false,
          paid_at: p.paid_at || null
        }))

        const { error: participantsError } = await supabase
          .from('expense_participants')
          .insert(participantInserts)

        if (participantsError) {
          // If participants creation fails, delete the expense to maintain consistency
          await supabase.from('expenses').delete().eq('id', newExpense.id)
          throw participantsError
        }
      }
      
      // Reload expenses to show the new one
      const expensesResponse = await expenseService.getExpenses(1, 100)
      setExpenses(expensesResponse.data)
      
      console.log('New expense created:', newExpense)
      alert(`Expense "${expenseData.title}" created successfully!`)
      setShowAddExpenseModal(false)
    } catch (err) {
      console.error('Failed to create expense:', err)
      alert('Failed to create expense. Please try again.')
    }
  }

  const handleSettleUp = () => {
    setShowSettleUpModal(true)
  }

  const handleExpenseUpdate = async (expenseId: string, expenseData: {
    title: string
    description?: string
    amount: number
    category: string
    event_id?: string
    participants: Array<{
      user_id: string
      share_amount: number
      is_paid?: boolean
      paid_at?: string | null
    }>
  }) => {
    if (!user) return

    try {
      // Update the expense
      await expenseService.updateExpense(expenseId, {
        title: expenseData.title,
        description: expenseData.description || null,
        amount: expenseData.amount,
        category: expenseData.category as ExpenseCategory,
        event_id: expenseData.event_id || null,
      })

      // Delete existing participants and add new ones
      await supabase
        .from('expense_participants')
        .delete()
        .eq('expense_id', expenseId)

      if (expenseData.participants.length > 0) {
        const participantInserts = expenseData.participants.map(p => ({
          expense_id: expenseId,
          user_id: p.user_id,
          share_amount: p.share_amount,
          is_paid: p.is_paid || false,
          paid_at: p.paid_at || null
        }))

        const { error: participantsError } = await supabase
          .from('expense_participants')
          .insert(participantInserts)

        if (participantsError) throw participantsError
      }

      // Reload expenses and balance
      const [expensesResponse, balanceResponse] = await Promise.all([
        expenseService.getExpenses(1, 100),
        expenseService.getUserBalance(user.id)
      ])
      
      setExpenses(expensesResponse.data)
      setUserBalance(balanceResponse)
      
      alert(`Expense "${expenseData.title}" updated successfully!`)
      setShowEditExpenseModal(false)
    } catch (err) {
      console.error('Failed to update expense:', err)
      alert('Failed to update expense. Please try again.')
    }
  }

  const handleSettlement = (settlementData: {
    from_user_id: string
    to_user_id: string
    amount: number
    expense_ids: string[]
  }) => {
    console.log('Settlement recorded:', settlementData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-forest-50">
      {/* iOS Header with Gold Accent */}
      <IOSHeader 
        title="Split Pay"
        className="[&_.ios-header-title]:text-accent-600 [&_.ios-header-title]:font-semibold"
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
          </IOSActionButton>
        ]}
      />

      {/* Main Content with More Breathing Room */}
      <div className="px-4 pt-40 pb-24 max-w-6xl mx-auto space-y-8">
        {/* Enhanced Balance Status Banner */}
        {(owesAmount > 0 || owedAmount > 0) && (
          <div className={`
            rounded-2xl p-6 shadow-lg border-2 transition-all duration-300
            ${owesAmount > 0 
              ? 'bg-gradient-to-r from-red-50 via-red-25 to-white border-red-200' 
              : 'bg-gradient-to-r from-green-50 via-green-25 to-white border-green-200'
            }
          `}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${owesAmount > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                  <h2 className={`text-2xl font-bold ${owesAmount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {owesAmount > 0 ? `You owe £${owesAmount.toFixed(2)}` : `You are owed £${owedAmount.toFixed(2)}`}
                  </h2>
                </div>
                <p className={`text-base font-medium ${owesAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {owesAmount > 0 ? 'Outstanding balance to settle with friends' : 'Friends owe you money - time to collect!'}
                </p>
                <p className={`text-sm mt-1 ${owesAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {owesAmount > 0 ? 'Tap "Settle Up" to resolve your debts' : 'Share your payment details to get paid'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button 
                  onClick={handleSettleUp}
                  size="lg"
                  className={`
                    font-semibold px-6 py-3 transition-all duration-300 shadow-lg
                    ${owesAmount > 0 
                      ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-200' 
                      : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-green-200'
                    }
                  `}
                >
                  {owesAmount > 0 ? 'Settle Up' : 'Request Payment'}
                </Button>
                <span className={`text-xs font-medium ${owesAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {owesAmount > 0 ? 'Pay now' : 'Get paid'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Balanced State Banner */}
        {owesAmount === 0 && owedAmount === 0 && userExpenses.length > 0 && (
          <div className="rounded-2xl p-6 shadow-lg border-2 border-accent-200 bg-gradient-to-r from-accent-50 via-accent-25 to-white">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-accent-500" />
              <div>
                <h2 className="text-2xl font-bold text-accent-700">All settled up!</h2>
                <p className="text-base font-medium text-accent-600 mt-1">
                  No outstanding balances - you're all even with your friends
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expense Groups - Collapsible Cards */}
        <div className="space-y-4">
          {Object.entries(groupedExpenses).map(([groupKey, expenses]) => {
            const event = expenses[0]?.event || null
            const groupTitle = event ? event.title : 'Personal Expenses'
            const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
            const isOpen = openCardId === groupKey
            
            return (
              <Card key={groupKey} className="rounded-2xl shadow-lg overflow-hidden">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{groupTitle}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {expenses.length} expense{expenses.length !== 1 ? 's' : ''} • £{totalAmount.toFixed(2)} total
                      </p>
                      {event && (
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(event.start_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEventDetailClick(groupKey, event)}
                        className="text-accent-600 border-accent-200 hover:bg-accent-50"
                      >
                        View Details
                      </Button>
                      <button
                        onClick={() => toggleCard(groupKey)}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">£{totalAmount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            {isOpen ? 'Hide' : 'Show'} expenses
                          </div>
                        </div>
                        <svg 
                          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </CardHeader>
                
                {isOpen && (
                  <CardContent className="p-4 md:p-6 pt-0 border-t border-gray-100">
                    <div className="space-y-3">
                      {expenses.map(expense => {
                        const paidByUser = expense.paid_by_user
                        const userParticipant = expense.participants.find(p => p.user_id === user.id)
                        
                        return (
                          <div key={expense.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${getExpenseCategoryColor(expense.category)}`} />
                                <h4 className="font-medium text-gray-900">{expense.title}</h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${getExpenseStatusColor(expense.status)}`}>
                                  {expense.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Paid by {paidByUser?.name} • {format(new Date(expense.created_at), 'MMM d')}
                              </p>
                              {expense.description && (
                                <p className="text-xs text-gray-500 mt-1">{expense.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="font-semibold text-lg">£{Number(expense.amount).toFixed(2)}</div>
                                {userParticipant && (
                                  <div className={`text-sm font-medium ${userParticipant.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                                    Your share: £{Number(userParticipant.share_amount).toFixed(2)}
                                    <span className="ml-1">{userParticipant.is_paid ? '✓' : '⏳'}</span>
                                  </div>
                                )}
                              </div>
                              {/* Edit/Delete buttons - only show if user created the expense */}
                              {expense.paid_by === user?.id && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditExpense(expense)}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-accent-600"
                                    title="Edit expense"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete "${expense.title}"? This action cannot be undone.`)) {
                                        handleDeleteExpense(expense.id)
                                      }
                                    }}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                                    title="Delete expense"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {Object.keys(groupedExpenses).length === 0 && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses yet</h3>
              <p className="text-gray-600 mb-6">Start tracking your shared expenses with friends</p>
              <Button onClick={handleAddExpense} variant="default">
                Add Your First Expense
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onExpenseCreate={handleExpenseCreate}
      />
      
      <SettleUpModal
        isOpen={showSettleUpModal}
        onClose={() => setShowSettleUpModal(false)}
        onSettlement={handleSettlement}
      />

      <EventDetailSheet
        isOpen={showEventDetailSheet}
        onClose={() => setShowEventDetailSheet(false)}
        event={selectedEventGroup.event}
        groupKey={selectedEventGroup.groupKey}
        onAddExpense={handleAddExpenseFromDetail}
        onEditExpense={handleEditExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      <EditExpenseModal
        isOpen={showEditExpenseModal}
        onClose={() => setShowEditExpenseModal(false)}
        expense={selectedExpense}
        onExpenseUpdate={handleExpenseUpdate}
      />
    </div>
  )
}