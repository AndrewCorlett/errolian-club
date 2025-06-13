import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { getActiveUsers, getUserById } from '@/data/mockUsers'
import { getUpcomingEvents, getUserEvents, getEventById } from '@/data/mockEvents'
import { validateExpenseIntegrity } from '@/data/mockExpenses'
import { useUserStore } from '@/store/userStore'
import type { ExpenseCategory, Expense, ExpenseParticipant } from '@/types/expenses'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onExpenseCreate: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void
}

type SplitMethod = 'equal' | 'custom' | 'percentage'

interface ParticipantShare {
  userId: string
  shareAmount: number
  isSelected: boolean
  customAmount?: number
  percentage?: number
}

export default function AddExpenseModal({ isOpen, onClose, onExpenseCreate }: AddExpenseModalProps) {
  const { currentUser } = useUserStore()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other' as ExpenseCategory,
    eventId: '',
    paidBy: currentUser?.id || ''
  })
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [participants, setParticipants] = useState<ParticipantShare[]>([])

  if (!isOpen || !currentUser) return null

  const activeUsers = getActiveUsers()
  const userEvents = getUserEvents(currentUser.id)
  const upcomingEvents = getUpcomingEvents()
  const availableEvents = [...userEvents, ...upcomingEvents.filter(e => !userEvents.some(ue => ue.id === e.id))]

  const handleEventChange = (eventId: string) => {
    setFormData(prev => ({ ...prev, eventId }))
    
    if (eventId) {
      const event = getEventById(eventId)
      if (event) {
        // Auto-select event participants
        const eventParticipants = event.currentParticipants.map(userId => ({
          userId,
          shareAmount: 0,
          isSelected: true,
          customAmount: 0,
          percentage: 0
        }))
        setParticipants(eventParticipants)
      }
    } else {
      // Reset participants
      setParticipants([])
    }
  }

  const toggleParticipant = (userId: string) => {
    setParticipants(prev => {
      const existing = prev.find(p => p.userId === userId)
      if (existing) {
        return prev.map(p => 
          p.userId === userId ? { ...p, isSelected: !p.isSelected } : p
        )
      } else {
        return [...prev, {
          userId,
          shareAmount: 0,
          isSelected: true,
          customAmount: 0,
          percentage: 0
        }]
      }
    })
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

  const updateParticipantPercentage = (userId: string, percentage: number) => {
    const totalAmount = parseFloat(formData.amount) || 0
    const shareAmount = (totalAmount * percentage) / 100
    
    setParticipants(prev => 
      prev.map(p => 
        p.userId === userId 
          ? { ...p, percentage, shareAmount }
          : p
      )
    )
  }

  const calculateEqualSplit = () => {
    const totalAmount = parseFloat(formData.amount) || 0
    const selectedParticipants = participants.filter(p => p.isSelected)
    const shareAmount = selectedParticipants.length > 0 ? totalAmount / selectedParticipants.length : 0
    
    setParticipants(prev => 
      prev.map(p => ({ ...p, shareAmount: p.isSelected ? shareAmount : 0 }))
    )
  }

  // Calculate equal split when amount changes and method is equal
  React.useEffect(() => {
    if (splitMethod === 'equal') {
      calculateEqualSplit()
    }
  }, [formData.amount, splitMethod, participants.length])

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

    const expenseParticipants: ExpenseParticipant[] = selectedParticipants.map(p => ({
      userId: p.userId,
      shareAmount: p.shareAmount,
      isPaid: p.userId === formData.paidBy, // Mark as paid if they're the one who paid
      paidAt: p.userId === formData.paidBy ? new Date() : undefined
    }))

    const newExpense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      amount: totalAmount,
      currency: 'AUD',
      category: formData.category,
      status: 'pending',
      eventId: formData.eventId || undefined,
      paidBy: formData.paidBy,
      participants: expenseParticipants,
      settledAt: undefined
    }

    // Validate expense integrity before creating
    const validation = validateExpenseIntegrity(newExpense as Expense)
    if (!validation.isValid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`)
      return
    }

    onExpenseCreate(newExpense)
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: 'other',
      eventId: '',
      paidBy: currentUser.id
    })
    setParticipants([])
    setSplitMethod('equal')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Add New Expense</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Expense Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What was this expense for?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (AUD) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                    required
                  >
                    <option value="accommodation">Accommodation</option>
                    <option value="food">Food</option>
                    <option value="transport">Transport</option>
                    <option value="activities">Activities</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paid by *
                  </label>
                  <Select
                    value={formData.paidBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, paidBy: e.target.value }))}
                    required
                  >
                    {activeUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.id === currentUser.id ? '(You)' : ''}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event (Optional)
                  </label>
                  <Select
                    value={formData.eventId}
                    onChange={(e) => handleEventChange(e.target.value)}
                  >
                    <option value="">No event (standalone)</option>
                    {availableEvents.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Participant Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Split Between</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {activeUsers.map(user => {
                  const participant = participants.find(p => p.userId === user.id)
                  const isSelected = participant?.isSelected || false
                  
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleParticipant(user.id)}
                      className={`p-3 rounded-lg border-2 transition-colors text-left ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                          ) : (
                            <span className="text-sm font-medium text-blue-600">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.name} {user.id === currentUser.id ? '(You)' : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedParticipants.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Split Method
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={splitMethod === 'equal' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSplitMethod('equal')}
                      >
                        Equal Split
                      </Button>
                      <Button
                        type="button"
                        variant={splitMethod === 'custom' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSplitMethod('custom')}
                      >
                        Custom Amounts
                      </Button>
                      <Button
                        type="button"
                        variant={splitMethod === 'percentage' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSplitMethod('percentage')}
                      >
                        Percentage
                      </Button>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Share Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedParticipants.map(participant => {
                        const user = getUserById(participant.userId)
                        return (
                          <div key={participant.userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {user?.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="text-sm font-medium">
                                {user?.name} {user?.id === currentUser.id ? '(You)' : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {splitMethod === 'equal' && (
                                <span className="text-sm font-medium">
                                  ${participant.shareAmount.toFixed(2)}
                                </span>
                              )}
                              
                              {splitMethod === 'custom' && (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={participant.customAmount || ''}
                                  onChange={(e) => updateParticipantAmount(participant.userId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right"
                                  placeholder="0.00"
                                />
                              )}
                              
                              {splitMethod === 'percentage' && (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={participant.percentage || ''}
                                    onChange={(e) => updateParticipantPercentage(participant.userId, parseFloat(e.target.value) || 0)}
                                    className="w-16 text-right"
                                    placeholder="0"
                                  />
                                  <span className="text-sm">%</span>
                                  <span className="text-sm font-medium w-16 text-right">
                                    ${participant.shareAmount.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      
                      <div className="border-t pt-2 flex items-center justify-between font-medium">
                        <span>Total:</span>
                        <span className={isValidSplit ? 'text-green-600' : 'text-red-600'}>
                          ${totalShares.toFixed(2)} / ${totalAmount.toFixed(2)}
                        </span>
                      </div>
                      
                      {!isValidSplit && (
                        <p className="text-sm text-red-600">
                          Shares must equal the total amount
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title.trim() || !formData.amount || selectedParticipants.length === 0 || !isValidSplit}
            >
              Create Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}