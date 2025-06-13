import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import FloatingActionButton from '@/components/ui/FloatingActionButton'
import FixedHeader from '@/components/layout/FixedHeader'
import { format } from 'date-fns'
import { mockExpenses, getUserBalance, calculateOptimalSettlements } from '@/data/mockExpenses'
import { getExpenseStatusColor, getExpenseCategoryColor } from '@/types/expenses'
import { getUserById } from '@/data/mockUsers'
import { getEventById } from '@/data/mockEvents'
import { useUserStore } from '@/store/userStore'
import AddExpenseModal from '@/components/splitpay/AddExpenseModal'
import SettleUpModal from '@/components/splitpay/SettleUpModal'
import type { ExpenseStatus, ExpenseCategory, Expense } from '@/types/expenses'

export default function SplitPay() {
  const { currentUser } = useUserStore()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all')
  const [showSettlements, setShowSettlements] = useState(false)
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [showSettleUpModal, setShowSettleUpModal] = useState(false)

  if (!currentUser) {
    return <div>Please log in to view expenses</div>
  }

  const userBalance = getUserBalance(currentUser.id)
  const optimalSettlements = calculateOptimalSettlements()

  // Filter expenses
  const filteredExpenses = mockExpenses.filter(expense => {
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    const userInvolved = expense.paidBy === currentUser.id || 
                        expense.participants.some(p => p.userId === currentUser.id)
    
    return matchesStatus && matchesCategory && userInvolved
  })

  // Group expenses by event
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const key = expense.eventId || 'standalone'
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(expense)
    return groups
  }, {} as Record<string, typeof filteredExpenses>)

  const handleAddExpense = () => {
    setShowAddExpenseModal(true)
  }

  const handleExpenseCreate = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExpense: Expense = {
      id: `expense_${Date.now()}`,
      ...expenseData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // TODO: Save to backend/state management
    console.log('New expense created:', newExpense)
    alert(`Expense "${expenseData.title}" created successfully!`)
    setShowAddExpenseModal(false)
  }

  const handleSettleUp = () => {
    setShowSettleUpModal(true)
  }

  const handleSettlement = (settlementData: any) => {
    // TODO: Save settlement to backend/state management
    console.log('Settlement recorded:', settlementData)
  }

  const handleEventClick = (eventId: string) => {
    // Navigate to event details or transactions view
    navigate(`/split-pay/event/${eventId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 pb-20">
      {/* Fixed Header with Balance Info */}
      <FixedHeader 
        title="Split-Pay" 
        subtitle={`Net: $${Math.abs(userBalance.netBalance).toFixed(2)} ${
          userBalance.netBalance > 0 ? 'owed to you' : 
          userBalance.netBalance < 0 ? 'you owe' : 'settled'
        }`}
      >
        <div className="flex items-center gap-2">
          {userBalance.netBalance !== 0 && (
            <Button 
              onClick={handleSettleUp}
              variant="outline"
              size="sm"
            >
              Settle Up
            </Button>
          )}
          <Button onClick={handleAddExpense} size="sm">
            Add Expense
          </Button>
        </div>
      </FixedHeader>

      {/* Balance Summary Card */}
      <div className="px-4 pt-24 pb-6 max-w-6xl mx-auto">
        <Card className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  ${userBalance.totalOwed.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">You Owe</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  ${userBalance.totalOwedTo.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">You're Owed</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  userBalance.netBalance > 0 ? 'text-green-600' : 
                  userBalance.netBalance < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  ${Math.abs(userBalance.netBalance).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {userBalance.netBalance > 0 ? 'Net Owed to You' : 
                   userBalance.netBalance < 0 ? 'Net You Owe' : 'All Settled'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExpenseStatus | 'all')}
              className="w-32"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="settled">Settled</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
              className="w-36"
            >
              <option value="all">All</option>
              <option value="accommodation">Accommodation</option>
              <option value="food">Food</option>
              <option value="transport">Transport</option>
              <option value="activities">Activities</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettlements(!showSettlements)}
          >
            {showSettlements ? 'Hide' : 'Show'} Settlements
          </Button>
        </div>

        {/* Optimal Settlements */}
        {showSettlements && optimalSettlements.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Suggested Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimalSettlements.map(settlement => {
                  const fromUser = getUserById(settlement.fromUserId)
                  const toUser = getUserById(settlement.toUserId)
                  
                  return (
                    <div key={settlement.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="font-medium">{fromUser?.name}</span>
                          <span className="text-gray-600"> should pay </span>
                          <span className="font-medium">{toUser?.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">${settlement.amount.toFixed(2)}</span>
                        <Button size="sm">
                          Mark Paid
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expenses by Event */}
        <div className="space-y-6">
          {Object.entries(groupedExpenses).map(([eventId, expenses]) => {
            const event = eventId !== 'standalone' ? getEventById(eventId) : null
            const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)
            
            return (
              <Card key={eventId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle 
                        className={`text-lg ${event ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
                        onClick={() => event && handleEventClick(eventId)}
                      >
                        {event ? event.title : 'Standalone Expenses'}
                        {event && (
                          <svg className="w-4 h-4 inline-block ml-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {expenses.length} expenses • Total: ${totalAmount.toFixed(2)}
                        {event && ` • ${format(event.startDate, 'MMM d, yyyy')}`}
                      </p>
                      {event && (
                        <p className="text-xs text-blue-600 mt-1">Click to view all transactions →</p>
                      )}
                    </div>
                    {event && (
                      <span className={`text-xs px-2 py-1 rounded-md ${getExpenseStatusColor(event.status as any)}`}>
                        {event.status}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expenses.map(expense => {
                      const paidByUser = getUserById(expense.paidBy)
                      const userParticipant = expense.participants.find(p => p.userId === currentUser.id)
                      const userAmount = userParticipant?.shareAmount || 0
                      const isPaidByUser = expense.paidBy === currentUser.id
                      const userOwes = userParticipant && !userParticipant.isPaid && !isPaidByUser
                      
                      return (
                        <div key={expense.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium">{expense.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-md ${getExpenseStatusColor(expense.status)}`}>
                                  {expense.status}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-md ${getExpenseCategoryColor(expense.category)}`}>
                                  {expense.category}
                                </span>
                              </div>
                              {expense.description && (
                                <p className="text-sm text-gray-600 mb-2">{expense.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Paid by {paidByUser?.name}</span>
                                <span>{format(expense.createdAt, 'MMM d, yyyy')}</span>
                                <span>{expense.participants.length} participants</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">${expense.amount.toFixed(2)}</div>
                              {userParticipant && (
                                <div className="text-sm">
                                  Your share: <span className="font-medium">${userAmount.toFixed(2)}</span>
                                  {isPaidByUser && (
                                    <div className="text-green-600 text-xs">You paid</div>
                                  )}
                                  {userOwes && (
                                    <div className="text-red-600 text-xs">You owe</div>
                                  )}
                                  {userParticipant.isPaid && !isPaidByUser && (
                                    <div className="text-green-600 text-xs">Paid</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Participants */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {expense.participants.map(participant => {
                              const user = getUserById(participant.userId)
                              const isPaid = participant.isPaid || participant.userId === expense.paidBy
                              
                              return (
                                <div key={participant.userId} className={`
                                  flex items-center justify-between p-2 rounded
                                  ${isPaid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}
                                `}>
                                  <span className="truncate">{user?.name}</span>
                                  <span className="font-medium">${participant.shareAmount.toFixed(2)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredExpenses.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-gray-600 mb-4">No expenses found</p>
              <Button onClick={handleAddExpense}>
                Add Your First Expense
              </Button>
            </CardContent>
          </Card>
        )}

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

        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={handleAddExpense}
          variant="secondary"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        />
      </div>
    </div>
  )
}