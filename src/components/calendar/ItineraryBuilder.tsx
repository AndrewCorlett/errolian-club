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
  // Travel specific
  transportType?: string
  flightNumber?: string
  departureAirport?: string
  departureDate?: string
  departureTime?: string
  arrivalAirport?: string
  arrivalDate?: string
  arrivalTime?: string
  bookingMethod?: 'together' | 'individual'
  totalCost?: number
  individualCost?: number
  bookingLink?: string
  whoPaid?: string
  splitAmong?: string[]
  // Accommodation specific
  accommodationType?: string
  checkInDate?: string
  checkInTime?: string
  checkOutDate?: string
  checkOutTime?: string
  // Activity specific
  startDate?: string
  endDate?: string
  // Other specific
  additionalNotes?: string
}

const ITINERARY_TYPES: { value: ItineraryType; label: string; color: string }[] = [
  { value: 'travel', label: 'Travel', color: 'bg-blue-100 text-blue-800' },
  { value: 'accommodation', label: 'Accommodation', color: 'bg-green-100 text-green-800' },
  { value: 'activity', label: 'Activity', color: 'bg-purple-100 text-purple-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
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
    type: 'travel',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    cost: 0,
    notes: '',
    // Travel defaults
    transportType: '',
    flightNumber: '',
    departureAirport: '',
    departureDate: '',
    departureTime: '',
    arrivalAirport: '',
    arrivalDate: '',
    arrivalTime: '',
    bookingMethod: 'together',
    totalCost: 0,
    individualCost: 0,
    bookingLink: '',
    whoPaid: user?.id || '',
    splitAmong: []
  })

  // Load users from database
  // TODO: In the future, this should only show users invited to the event
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
      type: 'travel',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      cost: 0,
      notes: '',
      // Travel defaults
      transportType: '',
      flightNumber: '',
      departureAirport: '',
      departureDate: '',
      departureTime: '',
      arrivalAirport: '',
      arrivalDate: '',
      arrivalTime: '',
      bookingMethod: 'together',
      totalCost: 0,
      individualCost: 0,
      bookingLink: '',
      whoPaid: user?.id || '',
      splitAmong: []
    })
  }

  const handleEditItem = (item: ItineraryItem) => {
    setEditingItemId(item.id)
    setFormData({
      ...item,
      // Set booking method defaults based on item type
      bookingMethod: 'together',
      totalCost: item.cost || 0,
      individualCost: 0,
      whoPaid: user?.id || '',
      splitAmong: []
    })
    setIsAddingItem(true)
  }

  const handleSaveItem = () => {
    // Validate based on type
    if (formData.type === 'travel' && !formData.transportType?.trim()) {
      alert('Please select a transport type')
      return
    }
    if ((formData.type === 'activity' || formData.type === 'other') && !formData.title?.trim()) {
      alert('Please enter a title')
      return
    }
    if (formData.type === 'accommodation' && !formData.accommodationType?.trim()) {
      alert('Please select an accommodation type')
      return
    }

    // Generate title based on type
    let title = formData.title || ''
    if (formData.type === 'travel') {
      title = `${formData.transportType || 'Travel'} from ${formData.departureAirport || 'TBD'} to ${formData.arrivalAirport || 'TBD'}`
    } else if (formData.type === 'accommodation') {
      title = `${formData.accommodationType || 'Accommodation'} at ${formData.location || 'TBD'}`
    }

    // Map time fields based on itinerary type
    let startTime = ''
    let endTime = ''
    
    switch (formData.type) {
      case 'travel':
        startTime = formData.departureTime || ''
        endTime = formData.arrivalTime || ''
        break
      case 'accommodation':
        startTime = formData.checkInTime || ''
        endTime = formData.checkOutTime || ''
        break
      case 'activity':
      case 'other':
      default:
        startTime = formData.startTime || ''
        endTime = formData.endTime || ''
        break
    }

    const newItem: ItineraryItem = {
      id: editingItemId || `itinerary_${Date.now()}`,
      eventId,
      type: formData.type,
      title: title,
      description: formData.description || '',
      startTime: startTime,
      endTime: endTime,
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
        travelMethod: formData.transportType,
        departureLocation: formData.departureAirport,
        arrivalLocation: formData.arrivalAirport,
        confirmation: formData.flightNumber
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
    
    // Create expense if cost > 0 and split among people for "together" booking
    if (formData.bookingMethod === 'together' && formData.totalCost && formData.totalCost > 0 && formData.splitAmong && formData.splitAmong.length > 0 && onAddExpense) {
      onAddExpense({
        title: `${newItem.title} - ${ITINERARY_TYPES.find(t => t.value === newItem.type)?.label}`,
        amount: formData.totalCost,
        category: newItem.type === 'accommodation' ? 'accommodation' : 
                 newItem.type === 'travel' ? 'transport' :
                 newItem.type === 'activity' ? 'activities' : 'other',
        description: newItem.description || `${newItem.type} expense from itinerary`,
        participants: formData.splitAmong,
        paidBy: formData.whoPaid,
        splitMethod: 'equal'
      })
    }

    handleCancelEdit()
  }

  const handleCancelEdit = () => {
    setIsAddingItem(false)
    setEditingItemId(null)
    setFormData({
      type: 'travel',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      cost: 0,
      notes: '',
      // Travel defaults
      transportType: '',
      flightNumber: '',
      departureAirport: '',
      departureDate: '',
      departureTime: '',
      arrivalAirport: '',
      arrivalDate: '',
      arrivalTime: '',
      bookingMethod: 'together',
      totalCost: 0,
      individualCost: 0,
      bookingLink: '',
      whoPaid: user?.id || '',
      splitAmong: []
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


  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'travel':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Transport Type
              </label>
              <MobileSelect
                value={formData.transportType || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, transportType: value }))}
                options={[
                  { value: '', label: 'Select transport type' },
                  { value: 'flight', label: 'Flight' },
                  { value: 'train', label: 'Train' },
                  { value: 'car', label: 'Car' },
                  { value: 'public_transport', label: 'Public Transport' },
                  { value: 'taxi', label: 'Taxi' }
                ]}
                placeholder="Select transport type"
              />
            </div>

            {formData.transportType === 'flight' && (
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Flight Number
                </label>
                <Input
                  type="text"
                  value={formData.flightNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
                  placeholder="e.g. BA123"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Departure Airport
                </label>
                <Input
                  type="text"
                  value={formData.departureAirport || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureAirport: e.target.value }))}
                  placeholder="Departure airport"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Arrival Airport
                </label>
                <Input
                  type="text"
                  value={formData.arrivalAirport || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, arrivalAirport: e.target.value }))}
                  placeholder="Arrival airport"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Departure Date
                </label>
                <Input
                  type="date"
                  value={formData.departureDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Departure Time
                </label>
                <Input
                  type="time"
                  value={formData.departureTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Arrival Date
                </label>
                <Input
                  type="date"
                  value={formData.arrivalDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, arrivalDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Arrival Time
                </label>
                <Input
                  type="time"
                  value={formData.arrivalTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, arrivalTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Booking Method Toggle */}
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-primary-700">
                  Booking Method
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    bookingMethod: prev.bookingMethod === 'together' ? 'individual' : 'together' 
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.bookingMethod === 'together' ? 'bg-royal-600' : 'bg-primary-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.bookingMethod === 'together' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="text-sm text-primary-600 mb-3">
                {formData.bookingMethod === 'together' ? 'Book Together' : 'Book Individually'}
              </div>

              {formData.bookingMethod === 'together' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Total Cost ($)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.totalCost || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, totalCost: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Who Paid?
                      </label>
                      <MobileSelect
                        value={formData.whoPaid || ''}
                        onChange={(value) => setFormData(prev => ({ ...prev, whoPaid: value }))}
                        options={users.map(user => ({
                          value: user.id,
                          label: user.id === user?.id ? `${user.name} (You)` : user.name
                        }))}
                        placeholder="Select who paid"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      Split Cost Between ({formData.splitAmong?.length || 0} selected)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {users.map(user => {
                        const isSelected = formData.splitAmong?.includes(user.id) || false
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              const currentSplit = formData.splitAmong || []
                              const newSplit = isSelected
                                ? currentSplit.filter(id => id !== user.id)
                                : [...currentSplit, user.id]
                              setFormData(prev => ({ ...prev, splitAmong: newSplit }))
                            }}
                            className={`p-2 rounded-lg border-2 transition-colors text-left text-xs ${
                              isSelected 
                                ? 'border-royal-500 bg-royal-50' 
                                : 'border-primary-200 hover:border-primary-400'
                            }`}
                          >
                            {user.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Individual Cost ($)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.individualCost || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, individualCost: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Booking Link
                    </label>
                    <Input
                      type="url"
                      value={formData.bookingLink || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bookingLink: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )

      case 'accommodation':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Accommodation Type
              </label>
              <MobileSelect
                value={formData.accommodationType || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, accommodationType: value }))}
                options={[
                  { value: '', label: 'Select type' },
                  { value: 'hotel', label: 'Hotel' },
                  { value: 'airbnb', label: 'Airbnb' },
                  { value: 'other', label: 'Other' }
                ]}
                placeholder="Select accommodation type"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Location
              </label>
              <Input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Check-in Date
                </label>
                <Input
                  type="date"
                  value={formData.checkInDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Check-in Time
                </label>
                <Input
                  type="time"
                  value={formData.checkInTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Check-out Date
                </label>
                <Input
                  type="date"
                  value={formData.checkOutDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Check-out Time
                </label>
                <Input
                  type="time"
                  value={formData.checkOutTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Booking Link
              </label>
              <Input
                type="url"
                value={formData.bookingLink || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bookingLink: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {/* Same cost sharing logic as travel */}
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-primary-700">
                  Booking Method
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    bookingMethod: prev.bookingMethod === 'together' ? 'individual' : 'together' 
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.bookingMethod === 'together' ? 'bg-royal-600' : 'bg-primary-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.bookingMethod === 'together' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="text-sm text-primary-600 mb-3">
                {formData.bookingMethod === 'together' ? 'Book Together' : 'Book Individually'}
              </div>

              {formData.bookingMethod === 'together' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Total Cost ($)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.totalCost || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, totalCost: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Who Paid?
                      </label>
                      <MobileSelect
                        value={formData.whoPaid || ''}
                        onChange={(value) => setFormData(prev => ({ ...prev, whoPaid: value }))}
                        options={users.map(user => ({
                          value: user.id,
                          label: user.id === user?.id ? `${user.name} (You)` : user.name
                        }))}
                        placeholder="Select who paid"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      Split Cost Between ({formData.splitAmong?.length || 0} selected)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {users.map(user => {
                        const isSelected = formData.splitAmong?.includes(user.id) || false
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              const currentSplit = formData.splitAmong || []
                              const newSplit = isSelected
                                ? currentSplit.filter(id => id !== user.id)
                                : [...currentSplit, user.id]
                              setFormData(prev => ({ ...prev, splitAmong: newSplit }))
                            }}
                            className={`p-2 rounded-lg border-2 transition-colors text-left text-xs ${
                              isSelected 
                                ? 'border-royal-500 bg-royal-50' 
                                : 'border-primary-200 hover:border-primary-400'
                            }`}
                          >
                            {user.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Individual Cost ($)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.individualCost || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, individualCost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </>
        )

      case 'activity':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Title
              </label>
              <Input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Activity title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Location
              </label>
              <Input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Activity location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={formData.startTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  End Time
                </label>
                <Input
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Same cost sharing logic */}
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-primary-700">
                  Booking Method
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    bookingMethod: prev.bookingMethod === 'together' ? 'individual' : 'together' 
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.bookingMethod === 'together' ? 'bg-royal-600' : 'bg-primary-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.bookingMethod === 'together' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="text-sm text-primary-600 mb-3">
                {formData.bookingMethod === 'together' ? 'Book Together' : 'Book Individually'}
              </div>

              {formData.bookingMethod === 'together' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Total Cost ($)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.totalCost || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, totalCost: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Who Paid?
                      </label>
                      <MobileSelect
                        value={formData.whoPaid || ''}
                        onChange={(value) => setFormData(prev => ({ ...prev, whoPaid: value }))}
                        options={users.map(user => ({
                          value: user.id,
                          label: user.id === user?.id ? `${user.name} (You)` : user.name
                        }))}
                        placeholder="Select who paid"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      Split Cost Between ({formData.splitAmong?.length || 0} selected)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {users.map(user => {
                        const isSelected = formData.splitAmong?.includes(user.id) || false
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              const currentSplit = formData.splitAmong || []
                              const newSplit = isSelected
                                ? currentSplit.filter(id => id !== user.id)
                                : [...currentSplit, user.id]
                              setFormData(prev => ({ ...prev, splitAmong: newSplit }))
                            }}
                            className={`p-2 rounded-lg border-2 transition-colors text-left text-xs ${
                              isSelected 
                                ? 'border-royal-500 bg-royal-50' 
                                : 'border-primary-200 hover:border-primary-400'
                            }`}
                          >
                            {user.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Individual Cost ($)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.individualCost || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, individualCost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </>
        )

      case 'other':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Title
              </label>
              <Input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Item title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Location
              </label>
              <Input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={formData.startTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  End Time
                </label>
                <Input
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
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

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Additional Notes
              </label>
              <Textarea
                value={formData.additionalNotes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    ITINERARY_TYPES.find(t => t.value === item.type)?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.type.charAt(0).toUpperCase()}
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
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Item Type
                </label>
                <MobileSelect
                  value={formData.type}
                  onChange={(value) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      type: value as ItineraryType,
                      // Reset form when type changes
                      title: '',
                      location: '',
                      startTime: '',
                      endTime: '',
                      cost: 0
                    }))
                  }}
                  options={ITINERARY_TYPES.map(type => ({
                    value: type.value,
                    label: type.label
                  }))}
                  placeholder="Select itinerary type"
                />
              </div>

              {/* Type-specific Fields */}
              <div className="space-y-4">
                {renderTypeSpecificFields()}
              </div>


              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveItem} 
                  disabled={
                    (formData.type === 'travel' && !formData.transportType?.trim()) ||
                    ((formData.type === 'activity' || formData.type === 'other') && !formData.title?.trim()) ||
                    (formData.type === 'accommodation' && !formData.accommodationType?.trim())
                  }
                >
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