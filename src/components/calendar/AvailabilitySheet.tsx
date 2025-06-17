import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitAvailability } from '@/lib/api/availability'
import { type AvailabilityRecord } from '@/schemas/availability'

interface AvailabilitySheetProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date
  onAvailabilitySubmit?: (availability: AvailabilityData) => void
}

interface AvailabilityData {
  date: string
  status: 'available' | 'unavailable' | 'maybe'
  notes?: string
}

const statusOptions = [
  { value: 'available', label: 'Available', color: 'bg-green-500 hover:bg-green-600' },
  { value: 'unavailable', label: 'Unavailable', color: 'bg-red-500 hover:bg-red-600' },
  { value: 'maybe', label: 'Maybe', color: 'bg-yellow-500 hover:bg-yellow-600' }
]

export default function AvailabilitySheet({ 
  isOpen, 
  onClose, 
  selectedDate = new Date(),
  onAvailabilitySubmit 
}: AvailabilitySheetProps) {
  const [date, setDate] = useState(selectedDate.toISOString().split('T')[0])
  const [status, setStatus] = useState<'available' | 'unavailable' | 'maybe'>('available')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const availabilityRecord: Omit<AvailabilityRecord, 'user_id'> = {
        date,
        status,
        notes: notes.trim()
      }

      const result = await submitAvailability(availabilityRecord)

      if (result.success) {
        // Call parent callback if provided
        if (onAvailabilitySubmit) {
          onAvailabilitySubmit({
            date,
            status,
            notes: notes.trim() || undefined
          })
        }

        alert(`Availability marked as "${status}" for ${new Date(date).toLocaleDateString()}`)
        
        // Reset form and close
        setNotes('')
        setStatus('available')
        onClose()
      } else {
        throw new Error(result.message || 'Failed to submit availability')
      }
    } catch (error) {
      alert(`Error submitting availability: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setNotes('')
    setStatus('available')
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
            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
                required
              />
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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