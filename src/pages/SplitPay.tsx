import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import { format } from 'date-fns'
import { mockExpenses, getUserBalance } from '@/data/mockExpenses'
import { getExpenseStatusColor, getExpenseCategoryColor } from '@/types/expenses'
import { getUserById } from '@/data/mockUsers'
import { getEventById } from '@/data/mockEvents'
import { useUserStore } from '@/store/userStore'
import AddExpenseModal from '@/components/splitpay/AddExpenseModal'
import SettleUpModal from '@/components/splitpay/SettleUpModal'
import type { Expense } from '@/types/expenses'

export default function SplitPay() {
  const { currentUser } = useUserStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [showSettleUpModal, setShowSettleUpModal] = useState(false)
  
  // Get open state from URL
  const openCardId = searchParams.get('open')

  if (!currentUser) {
    return <div>Please log in to view expenses</div>
  }

  const userBalance = getUserBalance(currentUser.id)
  
  // Determine if user owes money or is owed money
  const netBalance = userBalance.netBalance
  const owesAmount = netBalance < 0 ? Math.abs(netBalance) : 0
  const owedAmount = netBalance > 0 ? netBalance : 0

  // Filter expenses for current user
  const userExpenses = mockExpenses.filter(expense => {
    const userInvolved = expense.paidBy === currentUser.id || 
                        expense.participants.some(p => p.userId === currentUser.id)
    return userInvolved
  })

  // Group expenses by event
  const groupedExpenses = userExpenses.reduce((groups, expense) => {
    const key = expense.eventId || 'standalone'
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(expense)
    return groups
  }, {} as Record<string, Expense[]>)
  
  const toggleCard = (cardId: string) => {
    if (openCardId === cardId) {
      searchParams.delete('open')
    } else {
      searchParams.set('open', cardId)
    }
    setSearchParams(searchParams)
  }

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
    
    console.log('New expense created:', newExpense)
    alert(`Expense "${expenseData.title}" created successfully!`)
    setShowAddExpenseModal(false)
  }

  const handleSettleUp = () => {
    setShowSettleUpModal(true)
  }

  const handleSettlement = (settlementData: any) => {
    console.log('Settlement recorded:', settlementData)
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* iOS Header */}
      <IOSHeader 
        title="Split-Pay"
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

      <div className="px-4 pt-32 pb-6 max-w-6xl mx-auto space-y-6">
        {/* You Owe/You're Owed Banner */}
        {netBalance !== 0 && (
          <div className={`
            rounded-2xl p-6 shadow-lg
            ${owesAmount > 0 
              ? 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200' 
              : 'bg-gradient-to-r from-green-50 to-green-100 border border-green-200'
            }
          `}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-bold ${owesAmount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {owesAmount > 0 ? `You owe $${owesAmount.toFixed(2)}` : `You're owed $${owedAmount.toFixed(2)}`}
                </h2>
                <p className={`text-sm ${owesAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {owesAmount > 0 ? 'Outstanding balance to settle' : 'Others owe you money'}
                </p>
              </div>
              {netBalance !== 0 && (
                <Button 
                  onClick={handleSettleUp}
                  className={`
                    ${owesAmount > 0 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    }
                  `}
                >
                  Settle Up
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Expense Groups - Collapsible Cards */}
        <div className="space-y-4">
          {Object.entries(groupedExpenses).map(([groupKey, expenses]) => {
            const event = groupKey !== 'standalone' ? getEventById(groupKey) : null
            const groupTitle = event ? event.title : 'Personal Expenses'
            const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
            const isOpen = openCardId === groupKey
            
            return (
              <Card key={groupKey} className="rounded-2xl shadow-lg overflow-hidden">
                <CardHeader 
                  className="cursor-pointer p-4 md:p-6 hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCard(groupKey)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">{groupTitle}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {expenses.length} expense{expenses.length !== 1 ? 's' : ''} • ${totalAmount.toFixed(2)} total
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-semibold">${totalAmount.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {event ? format(new Date(event.startDate), 'MMM d') : 'Various dates'}
                        </div>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardHeader>
                
                {isOpen && (
                  <CardContent className="p-4 md:p-6 pt-0 border-t border-gray-100">
                    <div className="space-y-3">
                      {expenses.map(expense => {
                        const paidByUser = getUserById(expense.paidBy)
                        const userParticipant = expense.participants.find(p => p.userId === currentUser.id)
                        
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
                                Paid by {paidByUser?.name} • {format(expense.createdAt, 'MMM d')}
                              </p>
                              {expense.description && (
                                <p className="text-xs text-gray-500 mt-1">{expense.description}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-semibold text-lg">${expense.amount.toFixed(2)}</div>
                              {userParticipant && (
                                <div className={`text-sm font-medium ${userParticipant.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                  Your share: ${userParticipant.shareAmount.toFixed(2)}
                                  <span className="ml-1">{userParticipant.isPaid ? '✓' : '⏳'}</span>
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
    </div>
  )
}