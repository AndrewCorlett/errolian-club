import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FixedHeader from '@/components/layout/FixedHeader'
import { format } from 'date-fns'
import { mockExpenses, getUserBalance } from '@/data/mockExpenses'
import { getExpenseStatusColor, getExpenseCategoryColor } from '@/types/expenses'
import { getUserById } from '@/data/mockUsers'
import { getEventById } from '@/data/mockEvents'
import { useUserStore } from '@/store/userStore'
import type { Expense } from '@/types/expenses'

export default function SplitPayEventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { currentUser } = useUserStore()
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showExpenseDetail, setShowExpenseDetail] = useState(false)

  if (!currentUser || !eventId) {
    return <div>Loading...</div>
  }

  const event = getEventById(eventId)
  const eventExpenses = mockExpenses.filter(expense => expense.eventId === eventId)
  
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
          <Button onClick={() => navigate('/split-pay')}>
            Back to Split-Pay
          </Button>
        </div>
      </div>
    )
  }

  const totalEventAmount = eventExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const userEventBalance = getUserBalance(currentUser.id, eventId)

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowExpenseDetail(true)
  }

  const handleBack = () => {
    navigate('/split-pay')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Fixed Header */}
      <FixedHeader 
        title={event.title}
        subtitle={`${eventExpenses.length} expenses • $${totalEventAmount.toFixed(2)} total`}
      >
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
        >
          ← Back
        </Button>
      </FixedHeader>

      <div className="px-4 pt-24 pb-6 max-w-6xl mx-auto">
        {/* Event Summary Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  ${totalEventAmount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Event Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {eventExpenses.length}
                </div>
                <div className="text-sm text-gray-600">Total Expenses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  ${userEventBalance.totalOwedTo.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">You're Owed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  ${userEventBalance.totalOwed.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">You Owe</div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Event Date</div>
                  <div className="font-medium">{format(event.startDate, 'EEEE, MMMM d, yyyy')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Your Net Balance</div>
                  <div className={`font-bold text-lg ${
                    userEventBalance.netBalance > 0 ? 'text-green-600' : 
                    userEventBalance.netBalance < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    ${Math.abs(userEventBalance.netBalance).toFixed(2)}
                    <span className="text-sm font-normal text-gray-600 ml-1">
                      {userEventBalance.netBalance > 0 ? 'owed to you' : 
                       userEventBalance.netBalance < 0 ? 'you owe' : 'settled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Expenses</h2>
          
          {eventExpenses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="text-gray-600">No expenses found for this event</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {eventExpenses.map(expense => {
                const paidByUser = getUserById(expense.paidBy)
                const userParticipant = expense.participants.find(p => p.userId === currentUser.id)
                const userAmount = userParticipant?.shareAmount || 0
                const isPaidByUser = expense.paidBy === currentUser.id
                const paidParticipants = expense.participants.filter(p => p.isPaid || p.userId === expense.paidBy)
                
                return (
                  <Card 
                    key={expense.id} 
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => handleExpenseClick(expense)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{expense.title}</CardTitle>
                          <div className="flex items-center gap-2 mb-2">
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
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-gray-900">${expense.amount.toFixed(2)}</div>
                          {userParticipant && (
                            <div className="text-sm text-gray-600">
                              Your share: <span className="font-medium">${userAmount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Payment Info */}
                      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {paidByUser?.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Paid by {paidByUser?.name}</div>
                            <div className="text-xs text-gray-500">{format(expense.createdAt, 'MMM d, yyyy')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {paidParticipants.length}/{expense.participants.length} paid
                          </div>
                          <div className="text-xs text-gray-500">
                            {((paidParticipants.length / expense.participants.length) * 100).toFixed(0)}% complete
                          </div>
                        </div>
                      </div>

                      {/* Your Status */}
                      {userParticipant && (
                        <div className={`p-3 rounded-lg text-sm ${
                          isPaidByUser ? 'bg-blue-50 text-blue-800' :
                          userParticipant.isPaid ? 'bg-green-50 text-green-800' :
                          'bg-red-50 text-red-800'
                        }`}>
                          {isPaidByUser ? (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              You paid this expense
                            </div>
                          ) : userParticipant.isPaid ? (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              You've paid your share (${userAmount.toFixed(2)})
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              You owe ${userAmount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quick Participants Preview */}
                      <div className="mt-4">
                        <div className="text-xs text-gray-600 mb-2">Participants ({expense.participants.length})</div>
                        <div className="flex flex-wrap gap-1">
                          {expense.participants.slice(0, 6).map(participant => {
                            const user = getUserById(participant.userId)
                            const isPaid = participant.isPaid || participant.userId === expense.paidBy
                            
                            return (
                              <div
                                key={participant.userId}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                                title={`${user?.name}: $${participant.shareAmount.toFixed(2)} ${isPaid ? '(Paid)' : '(Owes)'}`}
                              >
                                {user?.name.split(' ')[0]}
                              </div>
                            )
                          })}
                          {expense.participants.length > 6 && (
                            <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              +{expense.participants.length - 6} more
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Click hint */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="text-xs text-blue-600 flex items-center gap-1">
                          Click for full details
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expense Detail Modal/Sheet - TODO: Implement detailed view */}
      {showExpenseDetail && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Expense Details</h2>
                <button
                  onClick={() => setShowExpenseDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600">Full expense detail view coming soon...</p>
              <p className="text-sm text-gray-500 mt-2">
                This will show complete participant breakdown, payment history, and management options.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}