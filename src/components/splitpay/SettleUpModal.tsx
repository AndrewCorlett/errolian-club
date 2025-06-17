import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { processSettlement, getSettlementSuggestions } from '@/data/mockExpenses'
import { useUserStore } from '@/store/userStore'

interface SettleUpModalProps {
  isOpen: boolean
  onClose: () => void
  onSettlement?: (settlementData: any) => void
}

export default function SettleUpModal({ isOpen, onClose, onSettlement }: SettleUpModalProps) {
  const { currentUser } = useUserStore()
  const [selectedSettlement, setSelectedSettlement] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [notes, setNotes] = useState('')

  if (!isOpen || !currentUser) return null

  const settlementSuggestions = getSettlementSuggestions(currentUser.id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSettlement && !customAmount) {
      alert('Please select a settlement or enter a custom amount')
      return
    }

    const settlement = settlementSuggestions.find(s => s.id === selectedSettlement)
    
    const settlementData = {
      id: selectedSettlement || `settlement_${Date.now()}`,
      amount: selectedSettlement ? settlement?.amount || 0 : parseFloat(customAmount) || 0,
      fromUserId: settlement?.fromUserId || currentUser.id,
      toUserId: settlement?.toUserId || '',
      expenseIds: settlement?.expenseIds || [],
      paymentMethod,
      notes,
      createdAt: new Date(),
      isSettled: true,
      settledAt: new Date()
    }
    
    // Process the settlement using the enhanced function
    if (selectedSettlement && settlement) {
      const success = processSettlement(settlement)
      if (!success) {
        alert('Error processing settlement. Please try again.')
        return
      }
    }
    
    onSettlement?.(settlementData)
    
    // Reset form
    setSelectedSettlement('')
    setCustomAmount('')
    setPaymentMethod('bank_transfer')
    setNotes('')
    
    const message = selectedSettlement && settlement 
      ? `Settlement processed! ${settlement.affectedExpenses.length} expense(s) updated.`
      : 'Settlement recorded! The other party will be notified.'
    
    alert(message)
    onClose()
  }

  return (
    <div className="fixed inset-0 modal-backdrop z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-fade-in-scale">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Suggested Settlements */}
          {settlementSuggestions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Suggested Settlements
              </label>
              <div className="space-y-2">
                {settlementSuggestions.map(settlement => {
                  return (
                    <button
                      key={settlement.id}
                      type="button"
                      onClick={() => {
                        setSelectedSettlement(settlement.id)
                        setCustomAmount('')
                      }}
                      className={`w-full p-3 text-left border-2 rounded-xl transition-all ${ 
                        selectedSettlement === settlement.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium mb-1">
                            {settlement.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            Optimized settlement • {settlement.affectedExpenses.length} expense(s)
                          </div>
                          {settlement.affectedExpenses.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              {settlement.affectedExpenses.slice(0, 2).join(', ')}
                              {settlement.affectedExpenses.length > 2 && ` +${settlement.affectedExpenses.length - 2} more`}
                            </div>
                          )}
                        </div>
                        <div className="w-4 h-4 ml-2">
                          {selectedSettlement === settlement.id && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
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

          {/* Custom Settlement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Or enter custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value)
                  setSelectedSettlement('')
                }}
                placeholder="0.00"
                className="pl-8"
              />
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedSettlement && !customAmount}
            >
              Record Settlement
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}