import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/lib/database'
import type { UserProfile } from '@/types/supabase'

interface EditExpenseEventModalProps {
  isOpen: boolean
  onClose: () => void
  expenseEvent: any
  onEventUpdate: (updatedEvent: any) => void
}

export default function EditExpenseEventModal({ 
  isOpen, 
  onClose, 
  expenseEvent, 
  onEventUpdate 
}: EditExpenseEventModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    currency: 'GBP',
    status: 'active'
  })
  
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [originalParticipants, setOriginalParticipants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Load available users and initialize form data
  useEffect(() => {
    if (isOpen && expenseEvent) {
      // Initialize form data
      setFormData({
        title: expenseEvent.title || '',
        description: expenseEvent.description || '',
        location: expenseEvent.location || '',
        currency: expenseEvent.currency || 'GBP',
        status: expenseEvent.status || 'active'
      })

      // Load users and set participants
      const loadData = async () => {
        try {
          setLoadingUsers(true)
          const users = await userService.getUsers()
          setAvailableUsers(users)
          
          // Set current participants
          const currentParticipants = expenseEvent.participants?.map((p: any) => p.user_id || p.id) || []
          setSelectedParticipants(currentParticipants)
          setOriginalParticipants(currentParticipants)
        } catch (error) {
          console.error('Failed to load users:', error)
        } finally {
          setLoadingUsers(false)
        }
      }

      loadData()
    }
  }, [isOpen, expenseEvent])

  if (!isOpen) return null

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(userId)) {
        // Don't allow removing the creator
        if (userId === expenseEvent.createdBy) return prev
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Please enter a title for the expense event')
      return
    }

    if (selectedParticipants.length === 0) {
      alert('Please select at least one participant')
      return
    }

    try {
      setLoading(true)
      
      const updatedData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        currency: formData.currency,
        status: formData.status,
        participant_count: selectedParticipants.length,
        participants: selectedParticipants
      }

      console.log('Updating expense event with data:', updatedData)
      
      // Call the update function passed from parent
      await onEventUpdate(updatedData)
      
      onClose()
    } catch (error) {
      console.error('Failed to update expense event:', error)
      alert('Failed to update expense event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data
    setFormData({
      title: expenseEvent.title || '',
      description: expenseEvent.description || '',
      location: expenseEvent.location || '',
      currency: expenseEvent.currency || 'GBP',
      status: expenseEvent.status || 'active'
    })
    setSelectedParticipants(originalParticipants)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Expense Event</h2>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Event title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Event description (optional)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Event location (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <Select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="settled">Settled</option>
                  <option value="archived">Archived</option>
                </Select>
              </div>
            </div>

            {/* Participant Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Participants</h3>
              
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-base">Select Participants</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {loadingUsers ? (
                    <div className="text-center py-4 text-gray-500">Loading users...</div>
                  ) : (
                    <div className="space-y-2">
                      {availableUsers.map(userProfile => {
                        const isSelected = selectedParticipants.includes(userProfile.id)
                        const isCreator = userProfile.id === expenseEvent.createdBy
                        
                        return (
                          <div
                            key={userProfile.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              isCreator 
                                ? 'bg-blue-50 border border-blue-200' 
                                : isSelected
                                  ? 'bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100'
                                  : 'bg-white border border-gray-200 cursor-pointer hover:bg-gray-50'
                            }`}
                            onClick={() => !isCreator && toggleParticipant(userProfile.id)}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{userProfile.name}</div>
                              <div className="text-sm text-gray-500">{userProfile.email}</div>
                            </div>
                            {isCreator && (
                              <div className="text-xs text-blue-600 font-medium">Creator</div>
                            )}
                            {userProfile.id === user?.id && !isCreator && (
                              <div className="text-xs text-gray-600 font-medium">You</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="mt-3 text-sm text-gray-500">
                    {selectedParticipants.length} participant{selectedParticipants.length !== 1 ? 's' : ''} selected
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}