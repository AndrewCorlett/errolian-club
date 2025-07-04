import { useState } from 'react'
import { format, addHours } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AutocompleteInput } from '@/components/places/AutocompleteInput'
import type { EventType, EventStatus } from '@/types/events'
import type { Place } from '@/types/places'
import { useUserStore } from '@/store/userStore'
import { hasPermission } from '@/types/user'

interface EventCreateModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date
  onEventCreate: (eventData: EventFormData) => void
}

export interface EventFormData {
  title: string
  description: string
  type: EventType
  status: EventStatus
  startDate: Date
  endDate: Date
  location: string
  locationPlace: Place | null
  maxParticipants: number | null
  isPublic: boolean
  estimatedCost: number | null
}


export default function EventCreateModal({ 
  isOpen, 
  onClose, 
  selectedDate = new Date(),
  onEventCreate 
}: EventCreateModalProps) {
  const { currentUser } = useUserStore()
  
  // Check if user can create events
  const canCreateEvents = currentUser ? hasPermission(currentUser.role, 'canCreateEvents') : false
  const canPublishEvents = currentUser ? hasPermission(currentUser.role, 'canApproveEvents') : false

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'adventure',
    status: canPublishEvents ? 'published' : 'draft',
    startDate: selectedDate,
    endDate: addHours(selectedDate, 2),
    location: '',
    locationPlace: null,
    maxParticipants: null,
    isPublic: true,
    estimatedCost: null
  })

  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({})

  if (!isOpen) return null

  if (!canCreateEvents) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Permission Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You don't have permission to create events. Please contact an officer or commodore.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handlePlaceSelected = (place: Place) => {
    setFormData(prev => ({
      ...prev,
      location: place.address,
      locationPlace: place
    }))
    // Clear location error if any
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (formData.maxParticipants !== null && formData.maxParticipants < 1) {
      newErrors.maxParticipants = 'Max participants must be at least 1'
    }

    if (formData.estimatedCost !== null && formData.estimatedCost < 0) {
      newErrors.estimatedCost = 'Cost cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onEventCreate(formData)
      onClose()
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'adventure',
        status: canPublishEvents ? 'published' : 'draft',
        startDate: selectedDate,
        endDate: addHours(selectedDate, 2),
        location: '',
        locationPlace: null,
        maxParticipants: null,
        isPublic: true,
        estimatedCost: null
      })
    }
  }

  const formatDateTimeLocal = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Event</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the event..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as EventType)}
              >
                <option value="adventure">Adventure</option>
                <option value="meeting">Meeting</option>
                <option value="social">Social</option>
                <option value="training">Training</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as EventStatus)}
                disabled={!canPublishEvents && formData.status === 'published'}
              >
                <option value="draft">Draft</option>
                <option 
                  value="published"
                  disabled={!canPublishEvents}
                >
                  Published
                </option>
              </Select>
              {!canPublishEvents && (
                <p className="text-xs text-gray-500">Events require approval before publishing</p>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formatDateTimeLocal(formData.startDate)}
                onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formatDateTimeLocal(formData.endDate)}
                onChange={(e) => handleInputChange('endDate', new Date(e.target.value))}
                className={errors.endDate ? 'border-red-500' : ''}
              />
              {errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <AutocompleteInput
              onPlaceSelected={handlePlaceSelected}
              placeholder="Search for event location..."
            />
            {formData.locationPlace && (
              <div className="text-sm text-gray-600 mt-1">
                Selected: {formData.locationPlace.name} - {formData.locationPlace.address}
              </div>
            )}
          </div>

          {/* Max Participants and Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={formData.maxParticipants?.toString() || ''}
                onChange={(e) => handleInputChange('maxParticipants', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Unlimited"
                className={errors.maxParticipants ? 'border-red-500' : ''}
              />
              {errors.maxParticipants && <p className="text-sm text-red-600">{errors.maxParticipants}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
              <Input
                id="estimatedCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimatedCost?.toString() || ''}
                onChange={(e) => handleInputChange('estimatedCost', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
                className={errors.estimatedCost ? 'border-red-500' : ''}
              />
              {errors.estimatedCost && <p className="text-sm text-red-600">{errors.estimatedCost}</p>}
            </div>
          </div>

          {/* Public Event Toggle */}
          <div className="flex items-center space-x-2">
            <input
              id="isPublic"
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="isPublic">Make this event public</Label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Event
          </Button>
        </div>
      </div>
    </div>
  )
}