import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { expenseService, userService } from '@/lib/database'
import { getSettlementSuggestions, expensesToDebts } from '@/lib/cashFlow'
import type { OptimizedTransfer } from '@/lib/cashFlow'
import type { UserProfile } from '@/types/supabase'

interface SettleUpModalProps {
  isOpen: boolean
  onClose: () => void
  onSettlement?: (settlementData: {
    from_user_id: string
    to_user_id: string
    amount: number
    expense_ids: string[]
  }) => void
}

export default function SettleUpModal({ isOpen, onClose, onSettlement }: SettleUpModalProps) {
  const { user } = useAuth()
  const [selectedTransfer, setSelectedTransfer] = useState<OptimizedTransfer | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [customRecipient, setCustomRecipient] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [notes, setNotes] = useState('')
  const [settlementSuggestions, setSettlementSuggestions] = useState<OptimizedTransfer[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)

  // Load settlement suggestions when modal opens
  useEffect(() => {
    const loadSettlementData = async () => {
      if (!isOpen || !user) return

      try {
        setLoading(true)
        
        // Load expenses and users
        const [expensesResponse, usersResponse] = await Promise.all([
          expenseService.getExpenses(1, 100),
          userService.getUsers()
        ])

        // Filter for unsettled expenses involving current user
        const userExpenses = expensesResponse.data.filter(expense => {
          const userInvolved = expense.paid_by === user.id || 
                              expense.participants.some(p => p.user_id === user.id)
          return userInvolved && expense.status !== 'settled'
        })

        // Convert expenses to debt relationships
        const debts = expensesToDebts(userExpenses.map(expense => ({
          id: expense.id,
          amount: expense.amount,
          paid_by: expense.paid_by,
          participants: expense.participants.map(p => ({
            user_id: p.user_id,
            share_amount: p.share_amount,
            is_paid: p.is_paid
          }))
        })))

        // Create user name map
        const userNameMap = new Map(usersResponse.map(u => [u.id, u.name]))

        // Get optimized settlement suggestions for current user
        const suggestions = getSettlementSuggestions(user.id, debts, userNameMap)
        
        setSettlementSuggestions(suggestions)
        setUsers(usersResponse)
      } catch (err) {
        console.error('Failed to load settlement data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSettlementData()
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTransfer && (!customAmount || !customRecipient)) {
      alert('Please select a settlement suggestion or enter custom amount and recipient')
      return
    }

    const amount = selectedTransfer ? selectedTransfer.amount : parseFloat(customAmount) || 0
    const fromUserId = selectedTransfer ? selectedTransfer.fromUserId : user.id
    const toUserId = selectedTransfer ? selectedTransfer.toUserId : customRecipient
    
    if (amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!toUserId) {
      alert('Please select a recipient')
      return
    }
    
    const settlementData = {
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount,
      expense_ids: [] // This would need to be calculated based on which expenses are being settled
    }
    
    onSettlement?.(settlementData)
    
    // Reset form
    setSelectedTransfer(null)
    setCustomAmount('')
    setCustomRecipient('')
    setPaymentMethod('bank_transfer')
    setNotes('')
    
    const recipientName = users.find(u => u.id === toUserId)?.name || 'Unknown User'
    const message = selectedTransfer 
      ? `Optimized settlement of £${amount.toFixed(2)} to ${recipientName} recorded!`
      : `Custom settlement of £${amount.toFixed(2)} to ${recipientName} recorded!`
    
    alert(message)
    onClose()
  }

  return (
    <div className="fixed inset-0 modal-backdrop z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-fade-in-scale max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Settle Up</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading && (
            <div className="text-center py-4">
              <div className="text-gray-500">Loading settlement suggestions...</div>
            </div>
          )}

          {/* Optimized Settlement Suggestions */}
          {!loading && settlementSuggestions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optimized Settlement Suggestions
              </label>
              <div className="space-y-1.5">
                {settlementSuggestions.map((transfer, index) => {
                  const isSelected = selectedTransfer === transfer
                  const isPayment = transfer.fromUserId === user.id
                  
                  return (
                    <button
                      key={`${transfer.fromUserId}-${transfer.toUserId}-${index}`}
                      type="button"
                      onClick={() => {
                        setSelectedTransfer(transfer)
                        setCustomAmount('')
                        setCustomRecipient('')
                      }}
                      className={`w-full p-3 text-left border-2 rounded-lg transition-all ${ 
                        isSelected
                          ? 'border-accent-500 bg-accent-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={`text-base font-semibold ${isPayment ? 'text-red-700' : 'text-green-700'}`}>
                              £{transfer.amount.toFixed(2)}
                            </div>
                            <div className={`text-xs px-2 py-0.5 rounded-full ${isPayment ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {isPayment ? 'You pay' : 'You receive'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 truncate mt-1">
                            {transfer.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isPayment ? (
                            <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                              <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                              </svg>
                            </div>
                          )}
                          {isSelected && (
                            <svg className="w-4 h-4 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {!loading && settlementSuggestions.length === 0 && (
            <div className="text-center py-4">
              <div className="text-gray-500 mb-1">No optimized settlements available</div>
              <div className="text-sm text-gray-400">All balances are already settled or you can create a custom transfer below</div>
            </div>
          )}

          {/* Custom Settlement */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Custom Settlement
            </label>
            
            {/* Recipient Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Pay to
              </label>
              <Select
                value={customRecipient}
                onChange={(e) => {
                  setCustomRecipient(e.target.value)
                  setSelectedTransfer(null)
                }}
              >
                <option value="">Select recipient...</option>
                {users
                  .filter(u => u.id !== user.id)
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
              </Select>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                <Input
                  type="number"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setSelectedTransfer(null)
                  }}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="venmo">Venmo</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all-smooth hover:border-gray-400"
              rows={3}
            />
          </div>
        </form>

        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="settle-form"
              disabled={!selectedTransfer && (!customAmount || !customRecipient)}
              className="bg-accent-600 hover:bg-accent-700 text-white"
              onClick={handleSubmit}
            >
              {selectedTransfer 
                ? `${selectedTransfer.fromUserId === user.id ? 'Record Payment' : 'Request Payment'}`
                : 'Record Settlement'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}