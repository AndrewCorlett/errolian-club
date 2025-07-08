import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddExpenseModalRedesignedProps {
  isOpen: boolean
  onClose: () => void
  onExpenseCreate: (expense: any) => void
}

type SplitMethod = 'equal' | 'custom'

interface ParticipantShare {
  userId: string
  name: string
  shareAmount: number
  isSelected: boolean
  customAmount?: number
}

const mockUsers = [
  { id: '1', name: 'Andrew (Me)', initials: 'AM' },
  { id: '2', name: 'Callum', initials: 'C' },
  { id: '3', name: 'Dan', initials: 'D' }
]

export default function AddExpenseModalRedesigned({ isOpen, onClose, onExpenseCreate }: AddExpenseModalRedesignedProps) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    paidBy: '1', // Default to "Andrew (Me)"
    when: new Date().toISOString().split('T')[0], // Today's date
    currency: 'GBP'
  })

  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [participants, setParticipants] = useState<ParticipantShare[]>([
    { userId: '1', name: 'Andrew (Me)', shareAmount: 0, isSelected: true },
    { userId: '2', name: 'Callum', shareAmount: 0, isSelected: true },
    { userId: '3', name: 'Dan', shareAmount: 0, isSelected: true }
  ])

  React.useEffect(() => {
    if (splitMethod === 'equal') {
      const selectedParticipants = participants.filter(p => p.isSelected)
      const totalAmount = parseFloat(formData.amount) || 0
      const shareAmount = selectedParticipants.length > 0 ? totalAmount / selectedParticipants.length : 0
      
      setParticipants(prev => 
        prev.map(p => ({ ...p, shareAmount: p.isSelected ? shareAmount : 0 }))
      )
    }
  }, [splitMethod, formData.amount, participants.filter(p => p.isSelected).length])

  if (!isOpen) return null

  const toggleParticipant = (userId: string) => {
    setParticipants(prev => 
      prev.map(p => 
        p.userId === userId ? { ...p, isSelected: !p.isSelected } : p
      )
    )
  }

  const updateParticipantAmount = (userId: string, amount: number) => {
    setParticipants(prev => 
      prev.map(p => 
        p.userId === userId 
          ? { ...p, customAmount: amount, shareAmount: amount }
          : p
      )
    )
  }

  const selectedParticipants = participants.filter(p => p.isSelected)
  const totalShares = selectedParticipants.reduce((sum, p) => sum + p.shareAmount, 0)
  const totalAmount = parseFloat(formData.amount) || 0
  const isValidSplit = Math.abs(totalShares - totalAmount) < 0.01

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.amount || selectedParticipants.length === 0) {
      alert('Please fill in all required fields and select participants')
      return
    }

    if (!isValidSplit) {
      alert('Participant shares must equal the total amount')
      return
    }

    const expenseParticipants = selectedParticipants.map(p => ({
      user_id: p.userId,
      share_amount: p.shareAmount,
      is_paid: p.userId === formData.paidBy,
      paid_at: p.userId === formData.paidBy ? new Date().toISOString() : null
    }))

    const newExpense = {
      title: formData.title.trim(),
      amount: totalAmount,
      currency: formData.currency,
      paid_by: formData.paidBy,
      when: formData.when,
      participants: expenseParticipants
    }

    onExpenseCreate(newExpense)
    
    // Reset form
    setFormData({
      title: '',
      amount: '',
      paidBy: '1',
      when: new Date().toISOString().split('T')[0],
      currency: 'GBP'
    })
    setParticipants([
      { userId: '1', name: 'Andrew (Me)', shareAmount: 0, isSelected: true },
      { userId: '2', name: 'Callum', shareAmount: 0, isSelected: true },
      { userId: '3', name: 'Dan', shareAmount: 0, isSelected: true }
    ])
    setSplitMethod('equal')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-100">
            <h2 className="text-xl font-semibold text-royal-900">Add Expense</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors text-primary-600 hover:text-primary-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-royal-700 mb-2">
                Title
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="E.g. Drinks"
                className="border-primary-200 focus:border-royal-500 focus:ring-royal-500"
                required
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="p-2 text-primary-400 hover:text-royal-600 transition-colors"
                  aria-label="Add photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-royal-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-600 font-medium">
                  £
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="pl-8 border-primary-200 focus:border-royal-500 focus:ring-royal-500"
                  required
                />
              </div>
            </div>

            {/* Paid By */}
            <div>
              <label className="block text-sm font-medium text-royal-700 mb-2">
                Paid By
              </label>
              <select
                value={formData.paidBy}
                onChange={(e) => setFormData(prev => ({ ...prev, paidBy: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:border-royal-500 focus:ring-royal-500 focus:outline-none"
                required
              >
                {mockUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* When */}
            <div>
              <label className="block text-sm font-medium text-royal-700 mb-2">
                When
              </label>
              <Input
                type="date"
                value={formData.when}
                onChange={(e) => setFormData(prev => ({ ...prev, when: e.target.value }))}
                className="border-primary-200 focus:border-royal-500 focus:ring-royal-500"
                required
              />
            </div>

            {/* Split */}
            <div>
              <label className="block text-sm font-medium text-royal-700 mb-3">
                Split
              </label>
              
              {/* Split Method Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSplitMethod('equal')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    splitMethod === 'equal'
                      ? 'bg-royal-600 text-white'
                      : 'bg-primary-100 text-royal-600 hover:bg-primary-200'
                  }`}
                >
                  Equally
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMethod('custom')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    splitMethod === 'custom'
                      ? 'bg-royal-600 text-white'
                      : 'bg-primary-100 text-royal-600 hover:bg-primary-200'
                  }`}
                >
                  As amounts
                </button>
              </div>

              {/* Participants */}
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.userId} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleParticipant(participant.userId)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                        participant.isSelected
                          ? 'bg-royal-600 border-royal-600'
                          : 'border-primary-300 hover:border-royal-400'
                      }`}
                    >
                      {participant.isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium text-royal-900">
                        {participant.name}
                      </span>
                      
                      {participant.isSelected && (
                        <div className="flex items-center gap-2">
                          {splitMethod === 'equal' && (
                            <span className="text-royal-700 font-medium">
                              £{participant.shareAmount.toFixed(2)}
                            </span>
                          )}
                          
                          {splitMethod === 'custom' && (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={participant.customAmount || ''}
                              onChange={(e) => updateParticipantAmount(participant.userId, parseFloat(e.target.value) || 0)}
                              className="w-20 text-right border-primary-200 focus:border-royal-500"
                              placeholder="0.00"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total validation */}
              {selectedParticipants.length > 0 && (
                <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary-700">Total:</span>
                    <span className={`font-medium ${isValidSplit ? 'text-green-600' : 'text-red-600'}`}>
                      £{totalShares.toFixed(2)} / £{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  {!isValidSplit && (
                    <p className="text-xs text-red-600 mt-1">
                      Shares must equal the total amount
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-primary-100 p-6 flex items-center justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-primary-300 text-primary-700 hover:bg-primary-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title.trim() || !formData.amount || selectedParticipants.length === 0 || !isValidSplit}
              className="bg-royal-600 hover:bg-royal-700 text-white"
            >
              Add
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}