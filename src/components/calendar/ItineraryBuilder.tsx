import { useState } from 'react'
import { format, parse } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { createPortal } from 'react-dom'
import { Trash2, Plus, MapPin, Clock, DollarSign, Edit3, X } from 'lucide-react'
import { AutocompleteInput } from '@/components/places/AutocompleteInput'
import { MapPreview } from '@/components/places/MapPreview'
import { useAuth } from '@/hooks/useAuth'
import type { ItineraryItem, ItineraryType } from '@/types/events'
import type { Place } from '@/types/places'
import type { UserProfile } from '@/types/supabase'
interface ItineraryBuilderProps {
  items: ItineraryItem[]
  onItemsChange: (items: ItineraryItem[]) => void
  eventDate?: Date
  eventParticipants?: UserProfile[]
}

interface ItemFormData {
  type: ItineraryType
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  locationPlace: Place | null
  cost: number
  notes: string
  paid_by: string
  split_between: string[]
}

const ITINERARY_TYPES: Array<{ value: ItineraryType; label: string; icon: string }> = [
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'activity', label: 'Activity', icon: '🎯' },
  { value: 'meal', label: 'Meal', icon: '🍽️' },
  { value: 'other', label: 'Other', icon: '📝' }
]

export default function ItineraryBuilder({
  items,
  onItemsChange,
  eventDate = new Date(),
  eventParticipants = []
}: ItineraryBuilderProps) {
  const { user } = useAuth()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null)
  const [formData, setFormData] = useState<ItemFormData>({
    type: 'activity',
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    locationPlace: null,
    cost: 0,
    notes: '',
    paid_by: user?.id || '',
    split_between: []
  })

  const resetForm = () => {
    setFormData({
      type: 'activity',
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      locationPlace: null,
      cost: 0,
      notes: '',
      paid_by: user?.id || '',
      split_between: []
    })
  }

  const handleAddItem = () => {
    setEditingItem(null)
    resetForm()
    setShowAddDialog(true)
  }

  const handleEditItem = (item: ItineraryItem) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      title: item.title,
      description: item.description,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      locationPlace: null, // We don't store place data in itinerary items yet
      cost: item.cost,
      notes: item.notes,
      paid_by: item.paid_by || user?.id || '',
      split_between: item.split_between || []
    })
    setShowAddDialog(true)
  }

  const handleSaveItem = () => {
    if (!formData.title.trim()) return

    const newItem: ItineraryItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      eventId: editingItem?.eventId || '',
      universal_id: editingItem?.universal_id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: formData.type,
      title: formData.title,
      description: formData.description,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      cost: formData.cost,
      notes: formData.notes,
      paid_by: formData.paid_by,
      split_between: formData.split_between,
      order: editingItem?.order || items.length,
      createdAt: editingItem?.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (editingItem) {
      // Update existing item without using map
      const updatedItems: ItineraryItem[] = []
      for (const item of items) {
        if (item.id === editingItem.id) {
          updatedItems.push(newItem)
        } else {
          updatedItems.push(item)
        }
      }
      onItemsChange(updatedItems)
    } else {
      // Add new item
      onItemsChange([...items, newItem])
    }

    setShowAddDialog(false)
    resetForm()
    setEditingItem(null)
  }

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this itinerary item?')) {
      onItemsChange(items.filter(item => item.id !== itemId))
    }
  }

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const itemIndex = items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return

    const newItems = [...items]
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1

    if (targetIndex >= 0 && targetIndex < items.length) {
      // Swap items
      const temp = newItems[itemIndex]
      newItems[itemIndex] = newItems[targetIndex]
      newItems[targetIndex] = temp
      
      // Update order indices
      for (let i = 0; i < newItems.length; i++) {
        newItems[i] = { ...newItems[i], order: i }
      }
      
      onItemsChange(newItems)
    }
  }

  const getTypeIcon = (type: ItineraryType) => {
    const typeInfo = ITINERARY_TYPES.find(t => t.value === type)
    return typeInfo?.icon || '📝'
  }

  const getTypeLabel = (type: ItineraryType) => {
    const typeInfo = ITINERARY_TYPES.find(t => t.value === type)
    return typeInfo?.label || 'Other'
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    try {
      const parsed = parse(time, 'HH:mm', new Date())
      return format(parsed, 'h:mm a')
    } catch {
      return time
    }
  }

  const calculateTotalCost = () => {
    let total = 0
    for (const item of items) {
      total += item.cost || 0
    }
    return total
  }

  const handlePlaceSelected = (place: Place) => {
    setFormData(prev => ({
      ...prev,
      location: place.address,
      locationPlace: place
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Event Itinerary</h3>
          <p className="text-sm text-gray-600">
            Plan activities, accommodation, and transport for {format(eventDate, 'MMMM d, yyyy')}
          </p>
        </div>
        <Button onClick={handleAddItem} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Cost Summary */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Estimated Cost</span>
              <span className="text-lg font-bold text-green-600">${calculateTotalCost().toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itinerary Items */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No itinerary items yet</h4>
                <p className="text-gray-600 mb-4">
                  Start building your event itinerary by adding activities, accommodation, transport, and more.
                </p>
                <Button onClick={handleAddItem} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Render items without using map
          <>
            {items.length >= 1 && (
              <Card key={items[0].id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getTypeIcon(items[0].type)}</div>
                      <div>
                        <CardTitle className="text-lg">{items[0].title}</CardTitle>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full mt-1">
                          {getTypeLabel(items[0].type)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItem(items[0].id, 'up')}
                        disabled={0 === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItem(items[0].id, 'down')}
                        disabled={0 === items.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(items[0])}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(items[0].id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {items[0].description && (
                    <p className="text-gray-600 mb-4">{items[0].description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {(items[0].startTime || items[0].endTime) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {items[0].startTime && formatTime(items[0].startTime)}
                          {items[0].startTime && items[0].endTime && ' - '}
                          {items[0].endTime && formatTime(items[0].endTime)}
                        </span>
                      </div>
                    )}
                    
                    {items[0].location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{items[0].location}</span>
                      </div>
                    )}
                    
                    {items[0].cost > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>${items[0].cost.toFixed(2)}</span>
                        {items[0].paid_by && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Paid by {eventParticipants.find(p => p.id === items[0].paid_by)?.name || 'Unknown'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {items[0].notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{items[0].notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show message for additional items */}
            {items.length > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-4 text-gray-600">
                    <p>And {items.length - 1} more itinerary item{items.length > 2 ? 's' : ''}</p>
                    <p className="text-sm mt-1">Full itinerary display will be rebuilt without map functions</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Dialog - Rendered to body to avoid z-index conflicts */}
      {showAddDialog && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddDialog(false)}
          />
          
          {/* Dialog content */}
          <div className="relative z-[100000] w-full max-w-2xl mx-4 bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button 
              onClick={() => setShowAddDialog(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            
            {/* Header */}
            <div className="p-6 pb-4">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {editingItem ? 'Edit Itinerary Item' : 'Add Itinerary Item'}
              </h2>
            </div>

            {/* Form content */}
            <div className="px-6 pb-6 space-y-6">
              {/* Type Selection */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ItineraryType }))}
                >
                  {/* Render options without using map */}
                  <option value="accommodation">🏨 Accommodation</option>
                  <option value="activity">🎯 Activity</option>
                  <option value="meal">🍽️ Meal</option>
                  <option value="other">📝 Other</option>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter item title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this itinerary item..."
                  rows={3}
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>Location</Label>
                <AutocompleteInput
                  key={`itinerary-location-${editingItem?.id || 'new'}`}
                  onPlaceSelected={handlePlaceSelected}
                  placeholder="Search for a location..."
                />
                {formData.locationPlace && (
                  <>
                    <div className="text-sm text-primary-600 mt-1">
                      Selected: {formData.locationPlace.name} - {formData.locationPlace.address}
                    </div>
                    <div className="mt-4">
                      <MapPreview
                        latitude={formData.locationPlace.coordinates.latitude}
                        longitude={formData.locationPlace.coordinates.longitude}
                        name={formData.locationPlace.name}
                        address={formData.locationPlace.address}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <Label>Cost ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              {/* Expense Fields - only show if cost > 0 */}
              {formData.cost > 0 && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <DollarSign className="w-4 h-4" />
                    <span>Expense Details</span>
                  </div>
                  
                  {/* Paid By */}
                  <div className="space-y-2">
                    <Label>Paid By</Label>
                    <Select
                      value={formData.paid_by}
                      onChange={(e) => setFormData(prev => ({ ...prev, paid_by: e.target.value }))}
                    >
                      <option value="">Select who paid</option>
                      {eventParticipants.map(participant => (
                        <option key={participant.id} value={participant.id}>
                          {participant.name} {participant.id === user?.id ? '(You)' : ''}
                        </option>
                      ))}
                    </Select>
                  </div>
                  
                  {/* Split Between */}
                  <div className="space-y-2">
                    <Label>Split Between</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {eventParticipants.map(participant => (
                        <div
                          key={participant.id}
                          className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                            formData.split_between.includes(participant.id)
                              ? 'bg-blue-50 border border-blue-200'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              split_between: prev.split_between.includes(participant.id)
                                ? prev.split_between.filter(id => id !== participant.id)
                                : [...prev.split_between, participant.id]
                            }))
                          }}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            formData.split_between.includes(participant.id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          }`}>
                            {formData.split_between.includes(participant.id) && (
                              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {participant.name} {participant.id === user?.id ? '(You)' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formData.split_between.length > 0 && (
                        <span>
                          Split ${formData.cost.toFixed(2)} between {formData.split_between.length} people 
                          (${(formData.cost / formData.split_between.length).toFixed(2)} each)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false)
                    resetForm()
                    setEditingItem(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveItem} disabled={!formData.title.trim()}>
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}