import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { userService, eventService } from '@/lib/database'
import type { ExpenseCategory, ExpenseWithDetails } from '@/types/supabase'
import type { UserProfile, EventWithDetails as EventType } from '@/types/supabase'

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expense: ExpenseWithDetails | null
  onExpenseUpdate: (expenseId: string, expense: {
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
  }) => void
}

type SplitMethod = 'equal' | 'custom' | 'percentage' | null

interface ParticipantShare {
  userId: string
  shareAmount: number
  isSelected: boolean
  customAmount?: number
  percentage?: number
}

export default function EditExpenseModal({ isOpen, onClose, expense, onExpenseUpdate }: EditExpenseModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other' as ExpenseCategory,
    event_id: '',
  })

  const [splitMethod, setSplitMethod] = useState<SplitMethod>(null)
  const [participants, setParticipants] = useState<ParticipantShare[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [events, setEvents] = useState<EventType[]>([])
  const [loading, setLoading] = useState(false)

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && expense) {
      const loadData = async () => {
        try {
          setLoading(true)
          const [usersResponse, eventsResponse] = await Promise.all([
            userService.getUsers(),
            eventService.getEvents(1, 50)
          ])
          setUsers(usersResponse)
          setEvents(eventsResponse.data)
          
          // Populate form with expense data
          setFormData({
            title: expense.title,
            description: expense.description || '',
            amount: expense.amount.toString(),
            category: expense.category,
            event_id: expense.event_id || '',
          })

          // Set up participants
          const allParticipants = usersResponse.map(user => {
            const existingParticipant = expense.participants.find(p => p.user_id === user.id)
            return {
              userId: user.id,
              shareAmount: existingParticipant ? Number(existingParticipant.share_amount) : 0,
              isSelected: !!existingParticipant,
              customAmount: existingParticipant ? Number(existingParticipant.share_amount) : 0,
              percentage: 0
            }
          })
          setParticipants(allParticipants)

          // Determine split method based on current data
          const selectedParticipants = allParticipants.filter(p => p.isSelected)
          if (selectedParticipants.length > 0) {
            const totalAmount = Number(expense.amount)
            const equalShare = totalAmount / selectedParticipants.length
            const isEqualSplit = selectedParticipants.every(p => 
              Math.abs(p.shareAmount - equalShare) < 0.01
            )
            setSplitMethod(isEqualSplit ? 'equal' : 'custom')
          }
        } catch (err) {
          console.error('Failed to load edit expense data:', err)
        } finally {
          setLoading(false)
        }
      }

      loadData()
    }
  }, [isOpen, expense])

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
  }, [splitMethod, formData.amount])

  if (!isOpen || !expense || !user) return null

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
  const totalShares = selectedParticipants.reduce((sum: number, p) => sum + p.shareAmount, 0)
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
      user_id: p.userId,
      share_amount: p.shareAmount,
      is_paid: expense.participants.find(ep => ep.user_id === p.userId)?.is_paid || false,
      paid_at: expense.participants.find(ep => ep.user_id === p.userId)?.paid_at || null
    }))

    const updatedExpense = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      amount: totalAmount,
      category: formData.category,
      event_id: formData.event_id || undefined,
      participants: expenseParticipants
    }

    onExpenseUpdate(expense.id, updatedExpense)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-primary-200 shadow-xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-200">
            <h2 className="text-xl font-semibold text-primary-900">Edit Expense</h2>
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

          {loading && (
            <div className="p-6 text-center">
              <div className="text-gray-500">Loading expense data...</div>
            </div>
          )}

          {!loading && (
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
                    placeholder="Enter expense title"
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
                    placeholder="Optional description"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all-smooth hover:border-gray-400"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (£) *
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
                      <option value="food">Food & Drinks</option>
                      <option value="transport">Transport</option>
                      <option value="activities">Activities</option>
                      <option value="equipment">Equipment</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event (Optional)
                  </label>
                  <Select
                    value={formData.event_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, event_id: e.target.value }))}
                  >
                    <option value="">No specific event</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Participant Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Split Between</h3>
                
                <div className="space-y-2">
                  {users.map(userData => {
                    const participant = participants.find(p => p.userId === userData.id)
                    const isSelected = participant?.isSelected || false
                    
                    return (
                      <div key={userData.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`user-${userData.id}`}
                          checked={isSelected}
                          onChange={() => toggleParticipant(userData.id)}
                          className="mr-3 h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`user-${userData.id}`} className="text-sm font-medium text-gray-900">
                          {userData.name}
                          {userData.id === user.id && ' (You)'}
                        </label>
                      </div>
                    )
                  })}
                </div>

                {/* Split Method Selection */}
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
                          const userData = users.find(u => u.id === participant.userId)
                          
                          return (
                            <div key={participant.userId} className="flex items-center justify-between">
                              <span className="font-medium">
                                {userData?.name}
                                {participant.userId === user.id && ' (You)'}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                {splitMethod === 'equal' && (
                                  <>
                                    <span className="text-sm">£{participant.shareAmount.toFixed(2)}</span>
                                  </>
                                )}
                                
                                {splitMethod === 'custom' && (
                                  <>
                                    <span className="text-sm">£</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={participant.customAmount || ''}
                                      onChange={(e) => updateParticipantAmount(participant.userId, parseFloat(e.target.value) || 0)}
                                      className="w-20 text-right"
                                      placeholder="0.00"
                                    />
                                  </>
                                )}
                                
                                {splitMethod === 'percentage' && (
                                  <>
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
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        
                        <div className="border-t pt-3 flex justify-between font-semibold">
                          <span>Total:</span>
                          <span className={`${isValidSplit ? 'text-green-600' : 'text-red-600'}`}>
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

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!isValidSplit || selectedParticipants.length === 0}
                  className="bg-accent-600 hover:bg-accent-700 text-white"
                >
                  Update Expense
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}