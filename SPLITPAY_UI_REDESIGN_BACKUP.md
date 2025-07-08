# SplitPay UI Redesign - Complete Code Backup

This file contains all the updated SplitPay UI components and styling that represent the latest design iteration. This includes the main page, modals, and supporting components.

## 🎯 Main SplitPay Page Component

### SplitPayRedesigned.tsx (`src/pages/SplitPayRedesigned.tsx`)

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import { expenseService, userService, expenseEventService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import type { ExpenseWithDetails } from '@/types/supabase'
import type { ExpenseEvent as ExpenseEventType } from '@/types/expenses'

interface ExpenseEvent {
  id: string
  title: string
  icon: string
  flagIcon: string
  totalAmount: number
  myExpenses: number
  status: 'active' | 'settled' | 'pending'
  participantCount: number
}

export default function SplitPayRedesigned() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [expenseEvents, setExpenseEvents] = useState<ExpenseEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)

  useEffect(() => {
    const fetchExpenses = async () => {
      // Wait for auth to complete before attempting to fetch
      if (authLoading) {
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        
        if (!user) {
          setExpenseEvents([])
          setLoading(false)
          return
        }
        
        // Fetch both regular expenses and expense events from Supabase
        const [expenseResponse, expenseEventResponse] = await Promise.all([
          expenseService.getExpenses(1, 50),
          expenseEventService.getExpenseEvents(1, 50)
        ])
        
        // Transform both types into our display format
        const expenseBasedEvents = transformExpensesToEvents(expenseResponse.data, user.id)
        const expenseEventBasedEvents = transformExpenseEventsToEvents(expenseEventResponse.data, user.id)
        
        setExpenseEvents([...expenseEventBasedEvents, ...expenseBasedEvents])
        
      } catch (err) {
        console.error('Failed to fetch expenses:', err)
        setError(`Failed to load expenses: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [user, authLoading])

  const transformExpensesToEvents = (expenses: ExpenseWithDetails[], userId: string): ExpenseEvent[] => {
    // Group expenses by event (if they have one) or treat as standalone
    const eventGroups = new Map<string, ExpenseWithDetails[]>()
    const standaloneExpenses: ExpenseWithDetails[] = []

    expenses.forEach(expense => {
      if (expense.event_id && expense.event) {
        if (!eventGroups.has(expense.event_id)) {
          eventGroups.set(expense.event_id, [])
        }
        eventGroups.get(expense.event_id)!.push(expense)
      } else {
        standaloneExpenses.push(expense)
      }
    })

    const events: ExpenseEvent[] = []

    // Process event groups
    eventGroups.forEach((groupExpenses, eventId) => {
      const event = groupExpenses[0].event!
      const totalAmount = groupExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
      const myExpenses = groupExpenses.reduce((sum, exp) => {
        const myParticipation = exp.participants?.find((p: any) => p.user_id === userId)
        return sum + (myParticipation ? Number(myParticipation.share_amount) : 0)
      }, 0)
      
      const allParticipants = new Set<string>()
      groupExpenses.forEach(exp => 
        exp.participants?.forEach((p: any) => allParticipants.add(p.user_id))
      )

      events.push({
        id: eventId,
        title: event.title,
        icon: getCategoryIcon(groupExpenses[0].category),
        flagIcon: getLocationFlag(event.location || ''),
        totalAmount,
        myExpenses,
        status: determineEventStatus(groupExpenses),
        participantCount: allParticipants.size
      })
    })

    // Process standalone expenses
    standaloneExpenses.forEach(expense => {
      const myParticipation = expense.participants?.find(p => p.user_id === userId)
      const myShare = myParticipation ? Number(myParticipation.share_amount) : 0

      events.push({
        id: expense.id,
        title: expense.title,
        icon: getCategoryIcon(expense.category),
        flagIcon: '📝', // Generic icon for standalone expenses
        totalAmount: Number(expense.amount),
        myExpenses: myShare,
        status: mapExpenseStatus(expense.status),
        participantCount: expense.participants?.length || 1
      })
    })

    return events.sort((a, b) => {
      // Sort by status priority: active > pending > settled
      const statusPriority = { active: 3, pending: 2, settled: 1 }
      if (statusPriority[a.status] !== statusPriority[b.status]) {
        return statusPriority[b.status] - statusPriority[a.status]
      }
      // Then by total amount descending
      return b.totalAmount - a.totalAmount
    })
  }

  const transformExpenseEventsToEvents = (expenseEvents: ExpenseEventType[], userId: string): ExpenseEvent[] => {
    return expenseEvents.map(expenseEvent => {
      const totalAmount = expenseEvent.expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
      const myExpenses = expenseEvent.expenses?.reduce((sum, exp) => {
        // Handle inconsistent database field naming for expense participants
        const myParticipation = exp.participants?.find((p: any) => p.user_id === userId)
        if (myParticipation) {
          // Try different property names due to potential type inconsistencies
          const shareAmount = myParticipation.share_amount || myParticipation.shareAmount || 0
          return sum + Number(shareAmount)
        }
        return sum
      }, 0) || 0

      return {
        id: expenseEvent.id,
        title: expenseEvent.title,
        icon: '🎯', // Default icon for expense events
        flagIcon: getLocationFlag(expenseEvent.location || ''),
        totalAmount,
        myExpenses,
        status: expenseEvent.status as 'active' | 'settled' | 'pending',
        participantCount: expenseEvent.participantCount
      }
    })
  }

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      accommodation: '🏨',
      food: '🍽️',
      transport: '🚗',
      activities: '🎯',
      equipment: '🎒',
      other: '💳'
    }
    return icons[category] || '💳'
  }

  const getLocationFlag = (location?: string): string => {
    if (!location) return '📍'
    
    const locationFlags: Record<string, string> = {
      'spain': '🇪🇸',
      'barcelona': '🇪🇸', 
      'alicante': '🇪🇸',
      'poland': '🇵🇱',
      'uk': '🇬🇧',
      'united kingdom': '🇬🇧',
      'england': '🇬🇧',
      'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
      'ireland': '🇮🇪',
      'france': '🇫🇷',
      'germany': '🇩🇪',
      'italy': '🇮🇹'
    }
    
    const normalizedLocation = location.toLowerCase()
    for (const [country, flag] of Object.entries(locationFlags)) {
      if (normalizedLocation.includes(country)) {
        return flag
      }
    }
    
    return '📍'
  }

  const determineEventStatus = (expenses: ExpenseWithDetails[]): 'active' | 'settled' | 'pending' => {
    const statuses = expenses.map(exp => exp.status)
    
    if (statuses.every(status => status === 'settled')) return 'settled'
    if (statuses.some(status => status === 'approved')) return 'active'
    return 'pending'
  }

  const mapExpenseStatus = (status: string): 'active' | 'settled' | 'pending' => {
    switch (status) {
      case 'settled': return 'settled'
      case 'approved': return 'active'
      default: return 'pending'
    }
  }

  const handleAddExpense = () => {
    setShowCreateEventModal(true)
  }

  const handleEventClick = (eventId: string) => {
    navigate(`/split-pay/event/${eventId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-royal-100 text-royal-700 border-royal-200'
      case 'settled': return 'bg-accent-100 text-accent-700 border-accent-200'
      case 'pending': return 'bg-primary-100 text-primary-700 border-primary-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Create Expense Event Modal Component
  const CreateExpenseEventModal = () => {
    const [eventName, setEventName] = useState('')
    const [location, setLocation] = useState('')
    const [currency, setCurrency] = useState('GBP')
    const [participants, setParticipants] = useState<{id: string, name: string, selected: boolean}[]>([])

    useEffect(() => {
      if (showCreateEventModal && user) {
        // Fetch all users and initialize participants
        userService.getUsers().then(users => {
          const allParticipants = users.map(u => ({
            id: u.id,
            name: u.id === user?.id ? `${u.name} (Me)` : u.name,
            selected: u.id === user?.id // Only current user selected by default
          }))
          setParticipants(allParticipants)
        }).catch(error => {
          console.error('Failed to fetch users:', error)
          // Fallback to just current user
          if (user && profile) {
            setParticipants([{
              id: user.id,
              name: `${profile.name} (Me)`,
              selected: true
            }])
          }
        })
      }
    }, [showCreateEventModal, user, profile])

    const handleCreate = async () => {
      try {
        // Basic validation
        if (!eventName.trim()) {
          alert('Please enter an event name')
          return
        }

        if (participants.filter(p => p.selected).length === 0) {
          alert('Please select at least one participant')
          return
        }

        console.log('Creating expense event:', {
          eventName,
          location,
          currency,
          participants: participants.filter(p => p.selected)
        })

        // Create event in Supabase
        const newEvent = await expenseEventService.createExpenseEvent({
          title: eventName,
          description: '',
          location,
          currency,
          createdBy: user!.id,
          participants: participants.filter(p => p.selected).map(p => p.id)
        })

        console.log('Created expense event:', newEvent)
        setShowCreateEventModal(false)
        
        // Refresh the events list
        const response = await expenseEventService.getExpenseEvents(1, 50)
        const transformedEvents = transformExpenseEventsToEvents(response.data, user!.id)
        setExpenseEvents(transformedEvents)
      } catch (error) {
        console.error('Failed to create event:', error)
        alert('Failed to create event. Please try again.')
      }
    }

    const toggleParticipant = (participantId: string) => {
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, selected: !p.selected } : p
      ))
    }

    if (!showCreateEventModal) return null

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button
              onClick={() => setShowCreateEventModal(false)}
              className="text-blue-600 font-medium"
            >
              Cancel
            </button>
            <h2 className="text-lg font-semibold text-gray-900">New Expense Event</h2>
            <button
              onClick={handleCreate}
              className="text-blue-600 font-medium"
            >
              Create
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="E.g. Dinner in Glasgow"
                className="w-full px-3 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="E.g. Glasgow, Scotland"
                className="w-full px-3 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              >
                <option value="GBP">£ GBP - British Pound</option>
                <option value="EUR">€ EUR - Euro</option>
                <option value="USD">$ USD - US Dollar</option>
                <option value="PLN">zł PLN - Polish Złoty</option>
                <option value="AUD">$ AUD - Australian Dollar</option>
                <option value="CAD">$ CAD - Canadian Dollar</option>
              </select>
            </div>

            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Participants</label>
              
              {/* Participants List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {participants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => toggleParticipant(participant.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          participant.selected 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {participant.selected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-900 select-none">{participant.name}</span>
                    </div>
                    {participant.id === user?.id && (
                      <span className="text-xs text-gray-500">You</span>
                    )}
                  </div>
                ))}
              </div>
              
              {participants.filter(p => p.selected).length === 0 && (
                <p className="text-sm text-red-600 mt-2">At least one participant must be selected</p>
              )}
            </div>

            {/* Event Type */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-4 border border-primary-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💡</span>
                <span className="text-sm font-medium text-royal-700">Quick Tip</span>
              </div>
              <p className="text-sm text-primary-600">
                This creates a standalone expense event. To link expenses to calendar events, create them from the Calendar section instead.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-royal-50">
      {/* iOS Header with app theming */}
      <IOSHeader 
        title="Split Pay"
        className="[&_.ios-header-title]:text-royal-700 [&_.ios-header-title]:font-semibold bg-white/80 backdrop-blur-md"
        rightActions={[
          <IOSActionButton 
            key="add-expense"
            onClick={handleAddExpense}
            aria-label="Add expense"
            data-testid="add-expense-button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </IOSActionButton>
        ]}
      />

      {/* Main Content */}
      <div className="px-4 pt-24 pb-24 max-w-md mx-auto">
        {(loading || authLoading) && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-royal-200 border-t-royal-600 rounded-full"></div>
            <p className="text-sm text-gray-500 mt-4">
              {authLoading ? 'Authenticating...' : 'Loading expenses...'}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-lg">⚠️</span>
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && expenseEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-royal-900 mb-2">No Expense Events Yet</h3>
            <p className="text-accent-600 mb-6">
              Create an expense event to start tracking shared costs with friends.
            </p>
            <Button
              onClick={handleAddExpense}
              className="bg-royal-600 hover:bg-royal-700 text-white px-6 py-3"
            >
              Create Expense Event
            </Button>
          </div>
        )}

        {!loading && !error && expenseEvents.length > 0 && (
          <div className="space-y-3">
            {expenseEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                data-testid="expense-event"
                className="bg-white rounded-2xl p-4 shadow-sm border border-primary-100 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  {/* Icon Container */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-primary-100 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-xl">{event.icon}</span>
                    </div>
                    {/* Flag overlay */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100">
                      <span className="text-xs">{event.flagIcon}</span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-royal-900 truncate">
                        {event.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-accent-600">
                        {event.participantCount} {event.participantCount === 1 ? 'person' : 'people'}
                      </span>
                      <div className="text-right">
                        <div className="text-royal-900 font-medium">
                          £{event.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-accent-500 text-xs">
                          Your share: £{event.myExpenses.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-primary-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation Space */}
      <div className="h-20" />
      
      {/* Create Expense Event Modal */}
      <CreateExpenseEventModal />
    </div>
  )
}
```

## 🎯 Modal Components

### 1. AddExpenseModalRedesigned.tsx (`src/components/splitpay/AddExpenseModalRedesigned.tsx`)

```tsx
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
```

### 2. PaymentFlowModal.tsx (`src/components/splitpay/PaymentFlowModal.tsx`)

```tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PaymentFlowModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentConfirmed: (paymentData: any) => void
  participant?: {
    id: string
    name: string
    initials: string
    amount: number
  }
}

type PaymentStep = 'details' | 'confirmation' | 'success'

interface PaymentMethod {
  id: string
  name: string
  icon: string
  type: 'bank' | 'digital' | 'cash'
}

const paymentMethods: PaymentMethod[] = [
  { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦', type: 'bank' },
  { id: 'paypal', name: 'PayPal', icon: '💙', type: 'digital' },
  { id: 'venmo', name: 'Venmo', icon: '💸', type: 'digital' },
  { id: 'cash', name: 'Cash', icon: '💵', type: 'cash' },
  { id: 'revolut', name: 'Revolut', icon: '🔄', type: 'digital' },
  { id: 'other', name: 'Other', icon: '💳', type: 'digital' }
]

export default function PaymentFlowModal({ isOpen, onClose, onPaymentConfirmed, participant }: PaymentFlowModalProps) {
  const [currentStep, setCurrentStep] = useState<PaymentStep>('details')
  const [paymentData, setPaymentData] = useState({
    amount: participant?.amount || 0,
    method: '',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  if (!isOpen || !participant) return null

  const handlePaymentMethodSelect = (methodId: string) => {
    setPaymentData(prev => ({ ...prev, method: methodId }))
  }

  const handleContinue = () => {
    if (currentStep === 'details' && paymentData.method && paymentData.amount > 0) {
      setCurrentStep('confirmation')
    } else if (currentStep === 'confirmation') {
      setCurrentStep('success')
      // Simulate payment processing
      setTimeout(() => {
        onPaymentConfirmed({
          ...paymentData,
          participantId: participant.id,
          timestamp: new Date().toISOString()
        })
        handleClose()
      }, 2000)
    }
  }

  const handleClose = () => {
    setCurrentStep('details')
    setPaymentData({
      amount: participant?.amount || 0,
      method: '',
      reference: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    })
    onClose()
  }

  const selectedMethod = paymentMethods.find(m => m.id === paymentData.method)
  const isDetailsValid = paymentData.method && paymentData.amount > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-royal-700">
                {participant.initials}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-royal-900">Pay {participant.name}</h2>
              <p className="text-sm text-accent-600">£{Math.abs(participant.amount).toFixed(2)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors text-primary-600 hover:text-primary-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-primary-100">
          <div className="flex items-center gap-2">
            {['details', 'confirmation', 'success'].map((step, index) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === step 
                    ? 'bg-royal-600 text-white' 
                    : index < ['details', 'confirmation', 'success'].indexOf(currentStep)
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-200 text-primary-600'
                }`}>
                  {index < ['details', 'confirmation', 'success'].indexOf(currentStep) ? '✓' : index + 1}
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1 rounded-full transition-colors ${
                    index < ['details', 'confirmation', 'success'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-primary-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-primary-600">
            <span>Details</span>
            <span>Confirm</span>
            <span>Done</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'details' && (
            <div className="space-y-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-royal-700 mb-2">
                  Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-600 font-medium">
                    £
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="pl-8 border-primary-200 focus:border-royal-500 focus:ring-royal-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-royal-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handlePaymentMethodSelect(method.id)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        paymentData.method === method.id
                          ? 'border-royal-500 bg-royal-50'
                          : 'border-primary-200 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-xs font-medium text-royal-900">{method.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-royal-700 mb-2">
                  Reference (Optional)
                </label>
                <Input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Payment reference"
                  className="border-primary-200 focus:border-royal-500 focus:ring-royal-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-royal-700 mb-2">
                  Payment Date
                </label>
                <Input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, date: e.target.value }))}
                  className="border-primary-200 focus:border-royal-500 focus:ring-royal-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-royal-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this payment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:border-royal-500 focus:ring-royal-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === 'confirmation' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="text-4xl mb-2">💳</div>
                <h3 className="text-xl font-bold text-royal-900 mb-2">Confirm Payment</h3>
                <p className="text-accent-600">Review your payment details</p>
              </div>

              <div className="bg-primary-50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-primary-700">Amount:</span>
                  <span className="font-semibold text-royal-900">£{paymentData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-700">Method:</span>
                  <span className="font-semibold text-royal-900">
                    {selectedMethod?.icon} {selectedMethod?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-700">Date:</span>
                  <span className="font-semibold text-royal-900">
                    {new Date(paymentData.date).toLocaleDateString()}
                  </span>
                </div>
                {paymentData.reference && (
                  <div className="flex justify-between">
                    <span className="text-primary-700">Reference:</span>
                    <span className="font-semibold text-royal-900">{paymentData.reference}</span>
                  </div>
                )}
                {paymentData.notes && (
                  <div>
                    <span className="text-primary-700">Notes:</span>
                    <p className="text-royal-900 mt-1">{paymentData.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-royal-900">Payment Recorded!</h3>
              <p className="text-accent-600">
                Your payment of £{paymentData.amount.toFixed(2)} to {participant.name} has been recorded.
              </p>
              <div className="animate-spin w-6 h-6 border-2 border-royal-200 border-t-royal-600 rounded-full mx-auto"></div>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep !== 'success' && (
          <div className="border-t border-primary-100 p-6 flex items-center justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="border-primary-300 text-primary-700 hover:bg-primary-50"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleContinue}
              disabled={!isDetailsValid}
              className="bg-royal-600 hover:bg-royal-700 text-white"
            >
              {currentStep === 'details' ? 'Continue' : 'Confirm Payment'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
```

## 🎨 Design System & Theming

### Color Palette Used:
- **Primary Colors**: Light blues and grays for backgrounds and borders
- **Royal Colors**: Deep blues (`royal-600`, `royal-700`, `royal-900`) for headers and primary actions
- **Accent Colors**: Complementary colors for secondary elements
- **Status Colors**: 
  - Active: Royal blue theme
  - Settled: Accent/green theme
  - Pending: Primary/yellow theme

### Key Design Features:
1. **iOS-style Headers**: Clean navigation with backdrop blur
2. **Rounded Cards**: Modern 2xl border radius for main content
3. **Gradient Backgrounds**: Subtle gradients from accent to primary to royal
4. **Interactive Elements**: Hover effects, active scales, smooth transitions
5. **Icon Integration**: Emoji-based icons with flag overlays for locations
6. **Progressive Disclosure**: Step-by-step forms in modals
7. **Validation States**: Real-time feedback for form validation

### Layout Patterns:
- **Card-based List**: Primary interaction pattern for expense events
- **Modal Overlays**: Full-screen modals with proper z-indexing
- **Form Sections**: Well-organized form groups with clear labeling
- **Progress Indicators**: Step-based progress for complex flows

## 📱 Mobile-First Responsive Design:
- **Max Width**: 448px (`max-w-md`) for optimal mobile experience
- **Touch Targets**: Appropriate sizes for finger interaction
- **Scroll Handling**: Max height constraints with overflow handling
- **Safe Areas**: Proper padding for iOS notches and navigation

This redesigned UI represents a modern, user-friendly approach to expense tracking with clean iOS-inspired design patterns and comprehensive functionality.