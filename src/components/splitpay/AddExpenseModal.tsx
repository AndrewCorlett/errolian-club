import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/lib/database'
import type { ExpenseCategory } from '@/types/supabase'
import type { UserProfile } from '@/types/supabase'
import type { Expense } from '@/types/expenses'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onExpenseCreate: (expense: Partial<Expense>) => void
  expenseEventParticipants?: UserProfile[] // Optional: restrict to specific participants
}

type SplitMethod = 'equal' | 'custom' | 'percentage' | null

interface ParticipantShare {
  userId: string
  shareAmount: number
  isSelected: boolean
  customAmount?: number
  percentage?: number
}

export default function AddExpenseModal({ isOpen, onClose, onExpenseCreate, expenseEventParticipants }: AddExpenseModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other' as ExpenseCategory,
    paid_by: ''
  })

  // Update paid_by when user is available
  React.useEffect(() => {
    if (user && !formData.paid_by) {
      setFormData(prev => ({ ...prev, paid_by: user.id }))
    }
  }, [user, formData.paid_by])
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(null)
  const [participants, setParticipants] = useState<ParticipantShare[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [, setLoading] = useState(false)

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          setLoading(true)
          
          // Use expense event participants if provided, otherwise load all users
          const usersToUse = expenseEventParticipants || await userService.getUsers()
          setUsers(usersToUse)
          
          // Initialize participants with available users
          const initialParticipants = usersToUse.map(user => ({
            userId: user.id,
            shareAmount: 0,
            isSelected: false
          }))
          setParticipants(initialParticipants)
        } catch (error) {
          console.error('Failed to load data:', error)
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [isOpen, expenseEventParticipants])

  // Calculate equal split when amount changes and method is equal
  React.useEffect(() => {
    if (splitMethod === 'equal') {
      const selectedParticipants = participants.filter(p => p.isSelected)
      const totalAmount = parseFloat(formData.amount) || 0
      const shareAmount = selectedParticipants.length > 0 ? totalAmount / selectedParticipants.length : 0
      
      setParticipants(prev => 
        prev.map(p => ({ ...p, shareAmount: p.isSelected ? shareAmount : 0 }))
      )
    }
  }, [splitMethod, formData.amount]) // Removed participants dependency to avoid circular updates

  // Early return after all hooks are declared
  if (!isOpen || !user) return null

  // Use the loaded data instead of mock functions

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


  const selectedParticipants = participants.filter(p => p.isSelected)
  const totalShares = selectedParticipants.reduce((sum: number, p: ParticipantShare) => sum + p.shareAmount, 0)
  const totalAmount = parseFloat(formData.amount) || 0
  const isValidSplit = Math.abs(totalShares - totalAmount) < 0.01

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.amount || selectedParticipants.length === 0) {
      alert('Please fill in all required fields and select participants')
      return
    }

    // Check if participants are selected but no split method is chosen
    if (selectedParticipants.length > 0 && !splitMethod) {
      alert('Please select a split method: Equal Split, Custom Amounts, or Percentage')
      return
    }

    if (!isValidSplit) {
      alert('Participant shares must equal the total amount')
      return
    }

    const expenseParticipants = selectedParticipants.map(p => ({
      userId: p.userId,
      shareAmount: p.shareAmount,
      isPaid: p.userId === formData.paid_by, // Mark as paid if they're the one who paid
      paidAt: p.userId === formData.paid_by ? new Date() : undefined
    }))

    const newExpense = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      amount: totalAmount,
      currency: 'GBP',
      category: formData.category,
      status: 'pending' as const,
      paidBy: formData.paid_by,
      participants: expenseParticipants
    }

    onExpenseCreate(newExpense)
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: 'other',
      paid_by: user.id
    })
    setParticipants([])
    setSplitMethod(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-primary-200 shadow-xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-200">
            <h2 className="text-xl font-semibold text-primary-900">Add New Expense</h2>
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
                    Amount (GBP) *
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
                    value={formData.paid_by}
                    onChange={(e) => setFormData(prev => ({ ...prev, paid_by: e.target.value }))}
                    required
                  >
                    {users.map(userOption => (
                      <option key={userOption.id} value={userOption.id}>
                        {userOption.name} {userOption.id === user.id ? '(You)' : ''}
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
                {users.map(userOption => {
                  const participant = participants.find(p => p.userId === userOption.id)
                  const isSelected = participant?.isSelected || false
                  
                  return (
                    <button
                      key={userOption.id}
                      type="button"
                      onClick={() => toggleParticipant(userOption.id)}
                      className={`p-3 rounded-lg border-2 transition-colors text-left ${
                        isSelected 
                          ? 'border-royal-500 bg-royal-50' 
                          : 'border-primary-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-royal-100 rounded-full flex items-center justify-center">
                          {userOption.avatar_url ? (
                            <img src={userOption.avatar_url} alt={userOption.name} className="w-8 h-8 rounded-full" />
                          ) : (
                            <span className="text-sm font-medium text-royal-600">
                              {userOption.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {userOption.name} {userOption.id === user.id ? '(You)' : ''}
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
                        const participantUser = users.find(u => u.id === participant.userId)
                        return (
                          <div key={participant.userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-royal-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-royal-600">
                                  {participantUser?.name.split(' ').map((n: string) => n[0]).join('')}
                                </span>
                              </div>
                              <span className="text-sm font-medium">
                                {participantUser?.name} {participantUser?.id === user.id ? '(You)' : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {splitMethod === 'equal' && (
                                <span className="text-sm font-medium">
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
                                    £{participant.shareAmount.toFixed(2)}
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
                          £{totalShares.toFixed(2)} / £{totalAmount.toFixed(2)}
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