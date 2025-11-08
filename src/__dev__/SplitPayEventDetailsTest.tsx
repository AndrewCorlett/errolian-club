import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventService, expenseService, userService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import type { EventWithDetails, ExpenseWithDetails } from '@/types/supabase'

interface EventExpense {
  id: string
  title: string
  paidBy: string
  amount: number
  date: string
  icon: string
  myShare: number
  isPaid: boolean
}

interface UserBalance {
  id: string
  name: string
  initials: string
  amount: number
  status: 'owes' | 'owed'
}

interface EventData {
  title: string
  icon: string
  flagIcon: string
  totalExpenses: number
  myExpenses: number
  participantCount: number
  expenses: EventExpense[]
  balances: UserBalance[]
}

type ViewMode = 'expenses' | 'balances'

export default function SplitPayEventDetailsTest() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('expenses')
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [showEventSettings, setShowEventSettings] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<EventExpense | null>(null)
  const [showExpenseDetails, setShowExpenseDetails] = useState(false)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!user || !eventId) {
          setError('User not authenticated or event ID missing')
          return
        }

        // First try to get the event from events table
        let event: EventWithDetails | null = null
        let expenses: ExpenseWithDetails[] = []

        try {
          event = await eventService.getEvent(eventId)
        } catch (eventError) {
          console.log('Event not found in events table, checking expenses for standalone expense')
        }

        if (event) {
          // This is an actual event, get expenses for this event
          const expensesResponse = await expenseService.getExpenses(1, 100)
          expenses = expensesResponse.data.filter(exp => exp.event_id === eventId)
        } else {
          // This might be a standalone expense (using expense ID as eventId)
          try {
            const expense = await expenseService.getExpense(eventId)
            if (expense) {
              expenses = [expense]
            }
          } catch (expenseError) {
            setError('Event or expense not found')
            return
          }
        }

        if (expenses.length === 0) {
          setError('No expenses found for this event')
          return
        }

        // Transform the data
        const transformedData = await transformEventData(event, expenses, user.id)
        setEventData(transformedData)

      } catch (err) {
        console.error('Failed to fetch event data:', err)
        setError('Failed to load event data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [eventId, user])

  const transformEventData = async (
    event: EventWithDetails | null, 
    expenses: ExpenseWithDetails[], 
    userId: string
  ): Promise<EventData> => {
    // Get all unique user IDs involved in expenses
    const userIds = new Set<string>()
    expenses.forEach(expense => {
      userIds.add(expense.paid_by)
      expense.participants?.forEach(p => userIds.add(p.user_id))
    })

    // Fetch user profiles
    const users = await userService.getUsers()
    const userMap = new Map(users.map(user => [user.id, user]))

    // Transform expenses
    const transformedExpenses: EventExpense[] = expenses.map(expense => {
      const paidByUser = userMap.get(expense.paid_by)
      const myParticipation = expense.participants?.find(p => p.user_id === userId)
      
      return {
        id: expense.id,
        title: expense.title,
        paidBy: paidByUser ? (paidByUser.id === userId ? `${paidByUser.name} (me)` : paidByUser.name) : 'Unknown',
        amount: Number(expense.amount),
        date: new Date(expense.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        icon: getCategoryIcon(expense.category),
        myShare: myParticipation ? Number(myParticipation.share_amount) : 0,
        isPaid: myParticipation ? myParticipation.is_paid : false
      }
    })

    // Calculate balances
    const balanceMap = new Map<string, number>()
    
    expenses.forEach(expense => {
      const expenseAmount = Number(expense.amount)
      const paidById = expense.paid_by
      
      // Initialize if not exists
      if (!balanceMap.has(paidById)) {
        balanceMap.set(paidById, 0)
      }
      
      expense.participants?.forEach(participant => {
        const participantId = participant.user_id
        const shareAmount = Number(participant.share_amount)
        
        if (!balanceMap.has(participantId)) {
          balanceMap.set(participantId, 0)
        }
        
        if (participantId === paidById) {
          // Person who paid: they are owed money from others
          balanceMap.set(paidById, balanceMap.get(paidById)! + (expenseAmount - shareAmount))
        } else {
          // Person who didn't pay: they owe money
          balanceMap.set(participantId, balanceMap.get(participantId)! - shareAmount)
        }
      })
    })

    // Transform balances
    const transformedBalances: UserBalance[] = Array.from(balanceMap.entries()).map(([userId, amount]) => {
      const user = userMap.get(userId)
      return {
        id: userId,
        name: user?.name || 'Unknown',
        initials: user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'UK',
        amount: Math.abs(amount),
        status: (amount >= 0 ? 'owed' : 'owes') as 'owed' | 'owes'
      }
    }).filter(balance => balance.amount > 0.01) // Filter out tiny amounts

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const myExpenses = transformedExpenses.reduce((sum, exp) => sum + exp.myShare, 0)

    return {
      title: event ? event.title : transformedExpenses[0]?.title || 'Standalone Expense',
      icon: event ? getEventIcon(event.type) : getCategoryIcon(expenses[0]?.category),
      flagIcon: event ? getLocationFlag(event.location || '') : '📍',
      totalExpenses,
      myExpenses,
      participantCount: userIds.size,
      expenses: transformedExpenses,
      balances: transformedBalances
    }
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

  const getEventIcon = (eventType: string): string => {
    const icons: Record<string, string> = {
      adventure: '🏔️',
      meeting: '👥',
      social: '🎉',
      training: '📚',
      other: '📅'
    }
    return icons[eventType] || '📅'
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

  const handleBack = () => {
    navigate(-1)
  }

  const handleAddExpense = () => {
    setShowAddExpenseModal(true)
  }

  const handleViewReimbursements = () => {
    console.log('View reimbursements')
  }

  const handleExpenseClick = (expense: EventExpense) => {
    setSelectedExpense(expense)
    setShowExpenseDetails(true)
  }

  // Add Expense Modal Component
  const AddExpenseModal = () => {
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const [paidBy, setPaidBy] = useState(user?.id || '')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [participants, setParticipants] = useState<{id: string, name: string, selected: boolean, amount: number}[]>([])
    const [splitMethod] = useState<'equally' | 'custom'>('equally')
    const [showPaidByDropdown, setShowPaidByDropdown] = useState(false)

    useEffect(() => {
      if (showAddExpenseModal && eventData && user) {
        // Get all participants from the event
        userService.getUsers().then(users => {
          const eventParticipantIds = new Set(eventData.balances.map(b => b.id))
          const eventParticipants = users
            .filter(u => eventParticipantIds.has(u.id))
            .map(u => ({
              id: u.id,
              name: u.id === user.id ? `${u.name} (Me)` : u.name,
              selected: true,
              amount: 0
            }))
          
          setParticipants(eventParticipants)
          setPaidBy(user.id)
        })
      }
    }, [showAddExpenseModal, eventData, user])

    useEffect(() => {
      // Calculate split amounts
      if (amount && participants.length > 0) {
        const numericAmount = parseFloat(amount) || 0
        const selectedParticipants = participants.filter(p => p.selected)
        
        if (splitMethod === 'equally' && selectedParticipants.length > 0) {
          const splitAmount = numericAmount / selectedParticipants.length
          setParticipants(prev => prev.map(p => ({
            ...p,
            amount: p.selected ? splitAmount : 0
          })))
        }
      }
    }, [amount, splitMethod, participants.map(p => p.selected).join(',')])

    const handleSubmit = async () => {
      try {
        if (!title || !amount || participants.filter(p => p.selected).length === 0) {
          alert('Please fill in all required fields')
          return
        }

        // Create expense data
        const expenseData = {
          title,
          amount: parseFloat(amount),
          currency: 'GBP',
          category: 'other',
          event_id: eventId,
          paid_by: paidBy,
          status: 'approved',
          date: selectedDate
        }

        console.log('Creating expense:', expenseData)
        const newExpense = await expenseService.createExpense(expenseData)
        
        // Add participants
        if (newExpense) {
          const participantPromises = participants
            .filter(p => p.selected)
            .map(p => expenseService.addParticipant(newExpense.id, p.id, p.amount))
          
          await Promise.all(participantPromises)
        }
        
        // Close modal and refresh data
        setShowAddExpenseModal(false)
        window.location.reload()
        
      } catch (error) {
        console.error('Failed to create expense:', error)
        alert('Failed to create expense. Please try again.')
      }
    }

    const toggleParticipant = (participantId: string) => {
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, selected: !p.selected } : p
      ))
    }

    if (!showAddExpenseModal) return null

    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => setShowPaidByDropdown(false)}>
        <div className="bg-white rounded-t-3xl w-full max-w-md overflow-y-auto" style={{ maxHeight: '95vh' }} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button
              onClick={() => setShowAddExpenseModal(false)}
              className="text-blue-600 font-medium"
            >
              Cancel
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Add Expense</h2>
            <div className="w-12"></div>
          </div>

          <div className="p-4 space-y-6" onClick={() => setShowPaidByDropdown(false)}>
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Drinks"
                  className="w-full px-3 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <div className="flex">
                <div className="flex items-center px-3 py-3 bg-gray-100 rounded-l-xl border-r border-gray-200">
                  <span className="text-gray-700 font-medium">£</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-3 bg-gray-100 border-0 rounded-r-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Paid By */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paid By</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPaidByDropdown(!showPaidByDropdown)}
                    className="w-full px-3 py-3 pr-8 bg-gray-100 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                  >
                    {participants.find(p => p.id === paidBy)?.name || 'Select person'}
                  </button>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Custom Dropdown */}
                  {showPaidByDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-48 overflow-y-auto">
                      {participants.map(participant => (
                        <button
                          key={participant.id}
                          type="button"
                          onClick={() => {
                            setPaidBy(participant.id)
                            setShowPaidByDropdown(false)
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span className="text-gray-900">{participant.name}</span>
                          {participant.id === paidBy && (
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* When */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Split */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Split</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Equally</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="space-y-3">
                {participants.map(participant => (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleParticipant(participant.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          participant.selected 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300'
                        }`}
                      >
                        {participant.selected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className="text-gray-900">{participant.name}</span>
                    </div>
                    <span className="text-gray-900 font-medium">
                      £{participant.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleSubmit}
              disabled={!title || !amount || participants.filter(p => p.selected).length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-4 rounded-xl transition-colors"
            >
              Add
            </button>
          </div>
          
          {/* Extra padding at bottom for iOS */}
          <div className="h-8"></div>
        </div>
      </div>
    )
  }

  // Event Settings Modal Component
  const EventSettingsModal = () => {
    const [eventName, setEventName] = useState(eventData?.title || '')
    const [currency, setCurrency] = useState('GBP')
    const [participants, setParticipants] = useState<{id: string, name: string, selected: boolean}[]>([])
    // const [availableUsers] = useState<{id: string, name: string}[]>([])
    const [saving, setSaving] = useState(false)
    const [isCalendarEvent, setIsCalendarEvent] = useState(false)

    useEffect(() => {
      // const fetchUsers = async () => {
      //   try {
      //     const users = await userService.getUsers()
      //     // setAvailableUsers(users.map(u => ({ id: u.id, name: u.name })))
      //   } catch (error) {
      //     console.error('Failed to fetch users:', error)
      //   }
      // }

      if (showEventSettings && eventData) {
        setEventName(eventData.title)
        // fetchUsers()
        
        console.log('Event Settings Modal - eventId:', eventId)
        console.log('Event Settings Modal - eventData:', eventData)
        
        // Check if this is a calendar event
        eventService.getEvent(eventId!).then(event => {
          if (event) {
            setIsCalendarEvent(true)
            console.log('This is a calendar event')
          }
        }).catch(() => {
          setIsCalendarEvent(false)
          console.log('This is a standalone expense event')
        })
        
        // Initialize participants from event data
        const currentParticipantIds = new Set(eventData.balances.map(b => b.id))
        console.log('Current participant IDs:', Array.from(currentParticipantIds))
        
        // Wait for available users to be loaded
        userService.getUsers().then(users => {
          console.log('All available users:', users)
          const allParticipants = users.map(u => ({
            id: u.id,
            name: u.id === user?.id ? `${u.name} (Me)` : u.name,
            selected: currentParticipantIds.has(u.id)
          }))
          console.log('Initialized participants:', allParticipants)
          setParticipants(allParticipants)
        }).catch(err => {
          console.error('Failed to load users:', err)
        })
      }
    }, [showEventSettings, eventData])

    const handleSave = async () => {
      try {
        setSaving(true)
        
        const selectedParticipants = participants.filter(p => p.selected)
        if (selectedParticipants.length === 0) {
          alert('Please select at least one participant')
          return
        }

        // Check if this is a calendar event or standalone expense event
        let isCalendarEvent = false
        try {
          const event = await eventService.getEvent(eventId!)
          if (event) {
            isCalendarEvent = true
          }
        } catch {
          // Not a calendar event, it's a standalone expense event
        }

        if (isCalendarEvent) {
          // Update the calendar event
          await eventService.updateEvent(eventId!, {
            title: eventName,
            // Add other fields as needed
          })
          
          // TODO: Update event participants
          console.log('Updated calendar event:', {
            eventName,
            currency,
            participants: selectedParticipants
          })
        } else {
          // For standalone expense events, we need to update each expense
          // Since there's no central "event" record, we update the title on all expenses
          const expensesResponse = await expenseService.getExpenses(1, 100)
          const eventExpenses = expensesResponse.data.filter(exp => {
            // Find expenses that belong to this "event" (grouped by some criteria)
            return exp.id === eventId || exp.event_id === eventId
          })
          
          // Update each expense with new title
          for (const expense of eventExpenses) {
            // Update expense title if needed
            console.log('Would update expense:', expense.id, 'with new event name:', eventName)
            // Note: We might need to store event metadata elsewhere for standalone events
          }
          
          // Update participants by modifying expense participants
          // This is complex because we need to update all expense participants
          console.log('Standalone expense event - participant update logic needed')
        }
        
        alert('Changes saved successfully!')
        
        // Refresh the page data to show updates
        setTimeout(() => {
          window.location.reload()
        }, 500)
        
        setShowEventSettings(false)
      } catch (error) {
        console.error('Failed to save settings:', error)
        alert('Failed to save changes. Please try again.')
      } finally {
        setSaving(false)
      }
    }

    const toggleParticipant = (participantId: string) => {
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, selected: !p.selected } : p
      ))
    }

    if (!showEventSettings) return null

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-visible m-4 relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button
              onClick={() => setShowEventSettings(false)}
              className="text-blue-600 font-medium"
            >
              Cancel
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Event Settings</h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-blue-600 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
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
              
              {!isCalendarEvent && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                  <p className="text-sm text-amber-700">
                    <strong>Note:</strong> Participant management for standalone expense events is coming soon. 
                    For now, add participants when creating individual expenses.
                  </p>
                </div>
              )}
              
              {/* Participants List */}
              <div className={`space-y-2 max-h-60 overflow-y-auto ${!isCalendarEvent ? 'opacity-50 pointer-events-none' : ''}`}>
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

            {/* Delete Event Button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                    console.log('Delete event')
                    // TODO: Implement delete functionality
                  }
                }}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Expense Details Modal Component
  const ExpenseDetailsModal = () => {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(selectedExpense?.title || '')
    const [editAmount, setEditAmount] = useState(selectedExpense?.amount.toString() || '')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
      if (selectedExpense) {
        setEditTitle(selectedExpense.title)
        setEditAmount(selectedExpense.amount.toString())
      }
    }, [selectedExpense])

    const handleSave = async () => {
      try {
        setSaving(true)
        
        // Update expense in Supabase
        await expenseService.updateExpense(selectedExpense!.id, {
          title: editTitle,
          amount: parseFloat(editAmount)
        })
        
        // Refresh the page to show updates
        window.location.reload()
      } catch (error) {
        console.error('Failed to update expense:', error)
        alert('Failed to update expense. Please try again.')
      } finally {
        setSaving(false)
      }
    }

    const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this expense?')) return
      
      try {
        await expenseService.deleteExpense(selectedExpense!.id)
        window.location.reload()
      } catch (error) {
        console.error('Failed to delete expense:', error)
        alert('Failed to delete expense. Please try again.')
      }
    }

    if (!showExpenseDetails || !selectedExpense) return null

    const isCreator = selectedExpense.paidBy === user?.id || selectedExpense.paidBy === 'You'

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button
              onClick={() => {
                setShowExpenseDetails(false)
                setIsEditing(false)
              }}
              className="text-blue-600 font-medium"
            >
              {isEditing ? 'Cancel' : 'Close'}
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Expense Details</h2>
            {isCreator && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 font-medium"
              >
                Edit
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-blue-600 font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>

          <div className="p-4 space-y-6">
            {/* Icon and Basic Info */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-accent-100 to-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">{selectedExpense.icon}</span>
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <div className="flex">
                      <div className="flex items-center px-3 py-3 bg-gray-100 rounded-l-xl border-r border-gray-200">
                        <span className="text-gray-700 font-medium">£</span>
                      </div>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="flex-1 px-3 py-3 bg-gray-100 border-0 rounded-r-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-royal-900 mb-2">{selectedExpense.title}</h3>
                  <div className="text-3xl font-bold text-royal-700">£{selectedExpense.amount.toFixed(2)}</div>
                </>
              )}
            </div>

            {/* Details */}
            {!isEditing && (
              <>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Paid by</span>
                    <span className="font-medium text-gray-900">{selectedExpense.paidBy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="font-medium text-gray-900">{selectedExpense.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Your share</span>
                    <span className={`font-medium ${selectedExpense.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                      £{selectedExpense.myShare.toFixed(2)}
                      <span className="ml-1">{selectedExpense.isPaid ? '✓ Paid' : '⏳ Pending'}</span>
                    </span>
                  </div>
                </div>

                {/* Status Actions */}
                {!selectedExpense.isPaid && (
                  <div className="bg-blue-50 rounded-2xl p-4">
                    <p className="text-sm text-blue-700 mb-3">You owe £{selectedExpense.myShare.toFixed(2)} to {selectedExpense.paidBy}</p>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl">
                      Mark as Paid
                    </button>
                  </div>
                )}

                {/* Delete Button for Creator */}
                {isCreator && (
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={handleDelete}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 px-4 rounded-xl transition-colors"
                    >
                      Delete Expense
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-royal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-royal-200 border-t-royal-600 rounded-full mx-auto mb-4"></div>
          <div className="text-accent-600">Loading event details...</div>
        </div>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-royal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-200 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-900 mb-2">Error</h3>
          <p className="text-red-600 mb-6">{error || 'Event data not found'}</p>
          <button
            onClick={handleBack}
            className="bg-royal-600 hover:bg-royal-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-royal-50">
      {/* Fixed/Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-primary-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={handleBack}
            className="text-royal-600 hover:text-royal-700"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">{eventData.icon}</span>
            <h1 className="text-xl font-semibold text-royal-700">{eventData.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddExpense}
              data-testid="add-expense-button"
              aria-label="Add expense"
              className="bg-royal-600 hover:bg-royal-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            
            {/* Three dot menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-royal-600 hover:text-royal-700 p-1.5 rounded-lg hover:bg-royal-50"
                aria-label="Event menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-primary-100 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowEventSettings(true)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-royal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-royal-900">Event Settings</span>
                  </button>
                  
                  <div className="border-t border-primary-100"></div>
                  
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      console.log('Export data')
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-royal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-royal-900">Export Expenses</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      console.log('Share event')
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-royal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.316C18.114 15.938 18 15.482 18 15c0-.482.114-.938.316-1.342m0 2.684a3 3 0 110-2.684M6.684 8.658C6.886 9.062 7 9.518 7 10c0 .482-.114.938-.316 1.342m0-2.684a3 3 0 110 2.684M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-royal-900">Share Event</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Toggle Tabs */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-1 shadow-sm border border-primary-100">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setViewMode('expenses')}
              data-testid="expenses-tab"
              className={`py-2 px-4 rounded-xl font-medium transition-all duration-200 ${
                viewMode === 'expenses'
                  ? 'bg-royal-600 text-white shadow-sm'
                  : 'text-royal-600 hover:bg-royal-50'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setViewMode('balances')}
              data-testid="balances-tab"
              className={`py-2 px-4 rounded-xl font-medium transition-all duration-200 ${
                viewMode === 'balances'
                  ? 'bg-royal-600 text-white shadow-sm'
                  : 'text-royal-600 hover:bg-royal-50'
              }`}
            >
              Balances
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-24 max-w-md mx-auto">
        {viewMode === 'expenses' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-accent-600">My Expenses</div>
                  <div className="text-xl font-bold text-royal-900">£{eventData.myExpenses.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-accent-600">Total Expenses</div>
                  <div className="text-xl font-bold text-royal-900">£{eventData.totalExpenses.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Expenses List - Grouped by Date */}
            <div className="space-y-4">
              {(() => {
                // Group expenses by date
                const expensesByDate = new Map<string, typeof eventData.expenses>()
                
                eventData.expenses.forEach(expense => {
                  if (!expensesByDate.has(expense.date)) {
                    expensesByDate.set(expense.date, [])
                  }
                  expensesByDate.get(expense.date)!.push(expense)
                })
                
                // Sort dates in descending order (most recent first)
                const sortedDates = Array.from(expensesByDate.keys()).sort((a, b) => {
                  // Convert back to proper date for sorting
                  const dateA = new Date(a.split(' ').reverse().join('-'))
                  const dateB = new Date(b.split(' ').reverse().join('-'))
                  return dateB.getTime() - dateA.getTime()
                })
                
                return sortedDates.map(date => (
                  <div key={date} className="space-y-3">
                    {/* Date Header */}
                    <div className="flex items-center gap-3">
                      <div className="h-px bg-primary-200 flex-1"></div>
                      <div className="bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
                        <span className="text-sm font-medium text-primary-700">{date}</span>
                      </div>
                      <div className="h-px bg-primary-200 flex-1"></div>
                    </div>
                    
                    {/* Expenses for this date */}
                    <div className="space-y-3">
                      {expensesByDate.get(date)!.map((expense) => (
                        <div
                          key={expense.id}
                          data-testid="expense-item"
                          onClick={() => handleExpenseClick(expense)}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-primary-100 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-accent-100 to-primary-100 rounded-xl flex items-center justify-center">
                              <span className="text-lg">{expense.icon}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-royal-900 truncate">
                                  {expense.title}
                                </h3>
                                <span className="text-lg font-bold text-royal-900">
                                  £{expense.amount.toFixed(2)}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-accent-600">
                                  Paid by {expense.paidBy}
                                </span>
                                <div className="text-right">
                                  <div className={`font-medium ${expense.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                    Your share: £{expense.myShare.toFixed(2)}
                                    <span className="ml-1">{expense.isPaid ? '✓' : '⏳'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {viewMode === 'balances' && (
          <div className="space-y-4">
            {/* Balance Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100">
              {(() => {
                const myBalance = eventData.balances.find(b => b.id === user?.id)
                const myNet = myBalance ? (myBalance.status === 'owes' ? -myBalance.amount : myBalance.amount) : 0
                // const totalOwe = eventData.balances.filter(b => b.id !== user?.id && b.status === 'owes').reduce((sum, b) => sum + b.amount, 0)
                // const totalOwed = eventData.balances.filter(b => b.id !== user?.id && b.status === 'owed').reduce((sum, b) => sum + b.amount, 0)
                
                return (
                  <div className="text-center">
                    <div className="text-sm text-accent-600 mb-2">Your Balance</div>
                    <div className={`text-3xl font-bold mb-1 ${myNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {myNet >= 0 ? '+' : '-'}£{Math.abs(myNet).toFixed(2)}
                    </div>
                    <div className="text-sm text-accent-500">
                      {myNet > 0 ? 'You are owed money' : myNet < 0 ? 'You owe money' : 'All settled'}
                    </div>
                    
                    {/* Balance breakdown */}
                    <div className="mt-4 pt-4 border-t border-primary-100">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-accent-600">You Owe</div>
                          <div className="text-lg font-bold text-red-600">£{myNet < 0 ? Math.abs(myNet).toFixed(2) : '0.00'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-accent-600">Owed to You</div>
                          <div className="text-lg font-bold text-green-600">£{myNet > 0 ? myNet.toFixed(2) : '0.00'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => console.log('Record payment')}
                className="bg-green-100 hover:bg-green-200 text-green-700 font-medium py-3 px-4 rounded-2xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span className="text-lg">💳</span>
                Record Payment
              </button>
              <button
                onClick={() => console.log('Send reminder')}
                className="bg-accent-100 hover:bg-accent-200 text-accent-700 font-medium py-3 px-4 rounded-2xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span className="text-lg">📱</span>
                Send Reminder
              </button>
            </div>

            {/* View Reimbursements Button */}
            <button
              onClick={handleViewReimbursements}
              className="w-full bg-royal-100 hover:bg-royal-200 text-royal-700 font-medium py-3 px-4 rounded-2xl transition-colors duration-200"
            >
              View All Suggested Reimbursements
            </button>

            {/* Balances List */}
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
              <div className="p-4 border-b border-primary-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-royal-900">Individual Balances</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-primary-500">Owes</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full ml-2"></div>
                    <span className="text-xs text-primary-500">Owed</span>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-primary-100">
                {eventData.balances.map((balance) => (
                  <div
                    key={balance.id}
                    data-testid="balance-item"
                    className="p-4 flex items-center justify-between hover:bg-primary-25 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-royal-700">
                            {balance.initials}
                          </span>
                        </div>
                        {/* Status indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          balance.amount < 0 ? 'bg-red-500' : 'bg-green-500'
                        }`}></div>
                      </div>
                      <div>
                        <div className="font-medium text-royal-900">
                          {balance.name}
                        </div>
                        <div className="text-xs text-primary-500">
                          {balance.name === 'Andrew Corlett' ? 'Me' : balance.amount < 0 ? 'Owes money' : 'Owed money'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        balance.amount < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {balance.amount < 0 ? '-' : '+'}£{Math.abs(balance.amount).toFixed(2)}
                      </div>
                      <div className="text-xs text-primary-500">
                        {balance.amount < 0 ? 'owes' : 'owed'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Balance Info */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-4 border border-primary-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💡</span>
                <span className="text-sm font-medium text-royal-700">Balance Tip</span>
              </div>
              <p className="text-sm text-primary-600">
                Your net balance is calculated from all expenses. Use "Record Payment" to update when you pay someone or receive money.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal />
      
      {/* Event Settings Modal */}
      <EventSettingsModal />
      
      {/* Expense Details Modal */}
      <ExpenseDetailsModal />
    </div>
  )
}