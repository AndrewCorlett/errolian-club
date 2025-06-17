import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MobileSelect from '@/components/ui/MobileSelect'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/lib/database'
import type { ItineraryItem, ItineraryType } from '@/types/events'

interface ItineraryBuilderProps {
  eventId: string
  initialItems?: ItineraryItem[]
  onItemsChange: (items: ItineraryItem[]) => void
  onAddExpense?: (expenseData: {
    title: string
    amount: number
    category: string
    description?: string
    participants?: string[]
    paidBy?: string
    splitMethod?: 'equal' | 'custom'
  }) => void
}

type ItineraryFormData = Partial<ItineraryItem> & {
  type: ItineraryType
  // Payment details
  createExpense?: boolean
  paidBy?: string
  splitMethod?: 'equal' | 'custom'
  participants?: string[]
}

const ITINERARY_TYPES: { value: ItineraryType; label: string; icon: React.ReactNode }[] = [
  { 
    value: 'travel', 
    label: 'Travel', 
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
  },
  { 
    value: 'accommodation', 
    label: 'Stay', 
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  },
  { 
    value: 'activity', 
    label: 'Activity', 
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  },
  { 
    value: 'meal', 
    label: 'Meal', 
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" /></svg>
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
  }
]


export default function ItineraryBuilder({ 
  eventId, 
  initialItems = [], 
  onItemsChange,
  onAddExpense 
}: ItineraryBuilderProps) {
  const { user } = useAuth()
  const [items, setItems] = useState<ItineraryItem[]>(initialItems)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [formData, setFormData] = useState<ItineraryFormData>({
    type: 'activity',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    cost: 0,
    notes: '',
    createExpense: false,
    paidBy: user?.id || '',
    splitMethod: 'equal',
    participants: []
  })

  // Load users from database
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await userService.getUsers()
        setUsers(usersData)
      } catch (error) {
        console.error('Failed to load users:', error)
        setUsers([])
      }
    }
    loadUsers()
  }, [])

  const handleAddItem = () => {
    setIsAddingItem(true)
    setFormData({
      type: 'activity',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      cost: 0,
      notes: '',
      createExpense: false,
      paidBy: user?.id || '',
      splitMethod: 'equal',
      participants: []
    })
  }

  const handleEditItem = (item: ItineraryItem) => {
    setEditingItemId(item.id)
    setFormData({
      ...item,
      createExpense: false,
      paidBy: user?.id || '',
      splitMethod: 'equal',
      participants: []
    })
    setIsAddingItem(true)
  }

  const handleSaveItem = () => {
    if (!formData.title?.trim()) return

    const newItem: ItineraryItem = {
      id: editingItemId || `itinerary_${Date.now()}`,
      eventId,
      type: formData.type,
      title: formData.title,
      description: formData.description || '',
      startTime: formData.startTime || '',
      endTime: formData.endTime || '',
      location: formData.location || '',
      cost: formData.cost || 0,
      notes: formData.notes || '',
      order: editingItemId ? 
        items.find(item => item.id === editingItemId)?.order || items.length :
        items.length,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Type-specific fields
      ...(formData.type === 'travel' && {
        travelMethod: formData.travelMethod,
        departureLocation: formData.departureLocation,
        arrivalLocation: formData.arrivalLocation,
        confirmation: formData.confirmation
      }),
      ...(formData.type === 'accommodation' && {
        accommodationType: formData.accommodationType,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        confirmation: formData.confirmation,
        address: formData.address
      }),
      ...(formData.type === 'activity' && {
        category: formData.category,
        duration: formData.duration,
        difficulty: formData.difficulty,
        requirements: formData.requirements
      }),
      ...(formData.type === 'meal' && {
        mealType: formData.mealType,
        cuisine: formData.cuisine,
        reservation: formData.reservation
      })
    }

    let updatedItems: ItineraryItem[]
    if (editingItemId) {
      updatedItems = items.map(item => 
        item.id === editingItemId ? newItem : item
      )
    } else {
      updatedItems = [...items, newItem]
    }

    setItems(updatedItems)
    onItemsChange(updatedItems)
    
    // Create expense if requested and cost > 0
    if (formData.createExpense && newItem.cost > 0 && onAddExpense) {
      onAddExpense({
        title: `${newItem.title} - ${ITINERARY_TYPES.find(t => t.value === newItem.type)?.label}`,
        amount: newItem.cost,
        category: newItem.type === 'accommodation' ? 'accommodation' : 
                 newItem.type === 'travel' ? 'transport' :
                 newItem.type === 'meal' ? 'food' : 'activities',
        description: newItem.description || `${newItem.type} expense from itinerary`,
        participants: formData.participants,
        paidBy: formData.paidBy,
        splitMethod: formData.splitMethod
      })
    }

    handleCancelEdit()
  }

  const handleCancelEdit = () => {
    setIsAddingItem(false)
    setEditingItemId(null)
    setFormData({
      type: 'activity',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      cost: 0,
      notes: '',
      createExpense: false,
      paidBy: user?.id || '',
      splitMethod: 'equal',
      participants: []
    })
  }

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this itinerary item?')) {
      const updatedItems = items.filter(item => item.id !== itemId)
      setItems(updatedItems)
      onItemsChange(updatedItems)
    }
  }

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const itemIndex = items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return

    const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const updatedItems = [...items]
    const [movedItem] = updatedItems.splice(itemIndex, 1)
    updatedItems.splice(newIndex, 0, movedItem)

    // Update order values
    updatedItems.forEach((item, index) => {
      item.order = index
    })

    setItems(updatedItems)
    onItemsChange(updatedItems)
  }

  const getTypeIcon = (type: ItineraryType) => {
    return ITINERARY_TYPES.find(t => t.value === type)?.icon || (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  }

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'travel':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Travel Method
              </label>
              <MobileSelect
                value={formData.travelMethod || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, travelMethod: value }))}
                options={[
                  { value: '', label: 'Select method' },
                  { value: 'Flight', label: 'Flight' },
                  { value: 'Train', label: 'Train' },
                  { value: 'Bus', label: 'Bus' },
                  { value: 'Car', label: 'Car' },
                  { value: 'Ferry', label: 'Ferry' },
                  { value: 'Taxi', label: 'Taxi' },
                  { value: 'Walking', label: 'Walking' },
                  { value: 'Other', label: 'Other' }
                ]}
                placeholder="Select travel method"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <Input
                type="text"
                value={formData.departureLocation || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, departureLocation: e.target.value }))}
                placeholder="Departure location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <Input
                type="text"
                value={formData.arrivalLocation || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, arrivalLocation: e.target.value }))}
                placeholder="Arrival location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmation Number
              </label>
              <Input
                type="text"
                value={formData.confirmation || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmation: e.target.value }))}
                placeholder="Booking confirmation"
              />
            </div>
          </>
        )

      case 'accommodation':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accommodation Type
              </label>
              <MobileSelect
                value={formData.accommodationType || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, accommodationType: value }))}
                options={[
                  { value: '', label: 'Select type' },
                  { value: 'Hotel', label: 'Hotel' },
                  { value: 'Hostel', label: 'Hostel' },
                  { value: 'Airbnb', label: 'Airbnb' },
                  { value: 'Camping', label: 'Camping' },
                  { value: 'Resort', label: 'Resort' },
                  { value: 'Guesthouse', label: 'Guesthouse' },
                  { value: 'Other', label: 'Other' }
                ]}
                placeholder="Select accommodation type"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <Input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in Date
              </label>
              <Input
                type="date"
                value={formData.checkIn || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out Date
              </label>
              <Input
                type="date"
                value={formData.checkOut || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmation Number
              </label>
              <Input
                type="text"
                value={formData.confirmation || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmation: e.target.value }))}
                placeholder="Booking confirmation"
              />
            </div>
          </>
        )

      case 'activity':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <MobileSelect
                value={formData.category || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                options={[
                  { value: '', label: 'Select category' },
                  { value: 'Sightseeing', label: 'Sightseeing' },
                  { value: 'Adventure', label: 'Adventure' },
                  { value: 'Cultural', label: 'Cultural' },
                  { value: 'Entertainment', label: 'Entertainment' },
                  { value: 'Sports', label: 'Sports' },
                  { value: 'Shopping', label: 'Shopping' },
                  { value: 'Other', label: 'Other' }
                ]}
                placeholder="Select activity category"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (hours)
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.duration || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) || 0 }))}
                placeholder="2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
              </label>
              <MobileSelect
                value={formData.difficulty || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as any }))}
                options={[
                  { value: '', label: 'Select difficulty' },
                  { value: 'easy', label: 'Easy' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'challenging', label: 'Challenging' },
                  { value: 'extreme', label: 'Extreme' }
                ]}
                placeholder="Select difficulty level"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements
              </label>
              <Textarea
                value={formData.requirements || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="Equipment, fitness level, special requirements..."
                rows={2}
              />
            </div>
          </>
        )

      case 'meal':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meal Type
              </label>
              <MobileSelect
                value={formData.mealType || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, mealType: value }))}
                options={[
                  { value: '', label: 'Select type' },
                  { value: 'breakfast', label: 'Breakfast' },
                  { value: 'lunch', label: 'Lunch' },
                  { value: 'dinner', label: 'Dinner' },
                  { value: 'snack', label: 'Snack' },
                  { value: 'drinks', label: 'Drinks' }
                ]}
                placeholder="Select meal type"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine Type
              </label>
              <Input
                type="text"
                value={formData.cuisine || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                placeholder="Italian, Japanese, Local..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reservation Details
              </label>
              <Input
                type="text"
                value={formData.reservation || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reservation: e.target.value }))}
                placeholder="Reservation name/number"
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Itinerary</h3>
          <p className="text-sm text-gray-600">Plan your event activities and logistics</p>
        </div>
        <Button onClick={handleAddItem} size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Item
        </Button>
      </div>

      {/* Itinerary Items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={item.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">{getTypeIcon(item.type)}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {ITINERARY_TYPES.find(t => t.value === item.type)?.label}
                      </p>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {item.cost > 0 && (
                        <span className="text-sm font-medium text-green-600">
                          ${item.cost.toFixed(2)}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveItem(item.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveItem(item.id, 'down')}
                          disabled={index === items.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                    {item.startTime && (
                      <div>
                        <span className="font-medium">Start:</span> {item.startTime}
                      </div>
                    )}
                    {item.endTime && (
                      <div>
                        <span className="font-medium">End:</span> {item.endTime}
                      </div>
                    )}
                    {item.location && (
                      <div>
                        <span className="font-medium">Location:</span> {item.location}
                      </div>
                    )}
                    {item.type === 'travel' && item.travelMethod && (
                      <div>
                        <span className="font-medium">Method:</span> {item.travelMethod}
                      </div>
                    )}
                    {item.type === 'accommodation' && item.accommodationType && (
                      <div>
                        <span className="font-medium">Type:</span> {item.accommodationType}
                      </div>
                    )}
                    {item.type === 'activity' && item.category && (
                      <div>
                        <span className="font-medium">Category:</span> {item.category}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && !isAddingItem && (
          <Card>
            <CardContent className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-600 mb-4">No itinerary items yet</p>
              <Button onClick={handleAddItem}>
                Add First Item
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAddingItem && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingItemId ? 'Edit' : 'Add'} Itinerary Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {ITINERARY_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="mb-1 flex justify-center text-blue-600">{type.icon}</div>
                      <div className="text-xs font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter item title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <Input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <Input
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost ($)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Type-specific Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderTypeSpecificFields()}
              </div>

              {/* Payment Details */}
              {formData.cost && formData.cost > 0 && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Create expense for Split-Pay
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, createExpense: !prev.createExpense }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.createExpense ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.createExpense ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {formData.createExpense && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Paid by
                          </label>
                          <MobileSelect
                            value={formData.paidBy || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, paidBy: value }))}
                            options={users.map(user => ({
                              value: user.id,
                              label: `${user.name}${user.id === user?.id ? ' (You)' : ''}`
                            }))}
                            placeholder="Who paid for this?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Split method
                          </label>
                          <MobileSelect
                            value={formData.splitMethod || 'equal'}
                            onChange={(value) => setFormData(prev => ({ ...prev, splitMethod: value as 'equal' | 'custom' }))}
                            options={[
                              { value: 'equal', label: 'Equal split' },
                              { value: 'custom', label: 'Custom amounts' }
                            ]}
                            placeholder="How to split this cost?"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Split between ({formData.participants?.length || 0} selected)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {users.map(user => {
                            const isSelected = formData.participants?.includes(user.id) || false
                            return (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  const currentParticipants = formData.participants || []
                                  const newParticipants = isSelected
                                    ? currentParticipants.filter(id => id !== user.id)
                                    : [...currentParticipants, user.id]
                                  setFormData(prev => ({ ...prev, participants: newParticipants }))
                                }}
                                className={`p-2 rounded-lg border-2 transition-colors text-left text-xs ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-600">
                                      {user.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <span className="truncate">
                                    {user.name.split(' ')[0]} {user.id === user?.id ? '(You)' : ''}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveItem} disabled={!formData.title?.trim()}>
                  {editingItemId ? 'Update' : 'Add'} Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}