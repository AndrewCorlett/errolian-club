import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { availabilityService } from '@/lib/database'

interface AvailabilitySheetProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date
  onAvailabilitySubmit?: (availability: AvailabilityData) => void
}

interface AvailabilityData {
  startDate: string
  endDate?: string
  availability_type: 'available' | 'busy' | 'tentative'
  notes?: string
}

const statusOptions = [
  { value: 'available', label: 'Available', color: 'bg-forest-600 hover:bg-forest-700' },
  { value: 'busy', label: 'Busy', color: 'bg-burgundy-600 hover:bg-burgundy-700' },
  { value: 'tentative', label: 'Tentative', color: 'bg-accent-600 hover:bg-accent-700' }
]

export default function AvailabilitySheet({ 
  isOpen, 
  onClose, 
  selectedDate = new Date(),
  onAvailabilitySubmit 
}: AvailabilitySheetProps) {
  const [startDate, setStartDate] = useState(selectedDate.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [isDateRange, setIsDateRange] = useState(false)
  const [status, setStatus] = useState<'available' | 'busy' | 'tentative'>('available')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const availabilityData = {
        startDate,
        endDate: isDateRange ? endDate : undefined,
        availability_type: status,
        notes: notes.trim() || undefined
      }
      
      // Save to database
      await availabilityService.createAvailability(availabilityData)
      
      // Also call the callback for any parent component handling
      if (onAvailabilitySubmit) {
        onAvailabilitySubmit(availabilityData)
      }

      const dateRange = isDateRange && endDate ? `${startDate} to ${endDate}` : startDate
      alert(`Availability marked as "${status}" for ${dateRange}`)
      
      // Reset form and close
      setNotes('')
      setStatus('available')
      setIsDateRange(false)
      setEndDate('')
      onClose()
    } catch (error) {
      console.error('Error submitting availability:', error)
      alert(`Error submitting availability: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setNotes('')
    setStatus('available')
    setIsDateRange(false)
    setEndDate('')
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader className="text-left">
          <SheetTitle>Mark Availability</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full pt-6">
          <div className="flex-1 space-y-6">
            {/* Date Range Toggle */}
            <div className="space-y-3">
              <Label>Date Selection</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDateRange(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !isDateRange 
                      ? 'bg-royal-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Single Day
                </button>
                <button
                  type="button"
                  onClick={() => setIsDateRange(true)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDateRange 
                      ? 'bg-royal-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Date Range
                </button>
              </div>
            </div>

            {/* Date Picker(s) */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">{isDateRange ? 'Start Date' : 'Date'}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              
              {isDateRange && (
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full"
                    required
                  />
                </div>
              )}
              
              {/* Quick Selection Buttons */}
              {isDateRange && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const start = new Date(startDate)
                      const end = new Date(start)
                      end.setDate(start.getDate() + 6) // Add 6 days for a full week
                      setEndDate(end.toISOString().split('T')[0])
                    }}
                    className="px-3 py-2 text-sm bg-accent-100 text-accent-700 rounded-lg hover:bg-accent-200 transition-colors"
                  >
                    Whole Week
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const start = new Date(startDate)
                      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0) // Last day of month
                      setEndDate(end.toISOString().split('T')[0])
                    }}
                    className="px-3 py-2 text-sm bg-accent-100 text-accent-700 rounded-lg hover:bg-accent-200 transition-colors"
                  >
                    Whole Month
                  </button>
                </div>
              )}
            </div>

            {/* Status Buttons */}
            <div className="space-y-3">
              <Label>Availability Status</Label>
              <div className="grid grid-cols-1 gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value as any)}
                    className={`p-3 rounded-lg text-white font-medium transition-colors ${
                      status === option.value
                        ? option.color
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about your availability..."
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-royal-600 hover:bg-royal-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Mark Availability'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}