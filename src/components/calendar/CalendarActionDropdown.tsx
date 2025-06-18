import { useState, useRef, useEffect } from 'react'

interface CalendarActionDropdownProps {
  onCreateEvent: () => void
  onMarkAvailability: () => void
}

export default function CalendarActionDropdown({ 
  onCreateEvent, 
  onMarkAvailability 
}: CalendarActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreateEvent = () => {
    onCreateEvent()
    setIsOpen(false)
  }

  const handleMarkAvailability = () => {
    onMarkAvailability()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 bg-royal-600 hover:bg-royal-700 rounded-full text-white transition-colors"
        aria-label="Calendar actions"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-primary-200 z-50">
          <div className="py-1">
            <button
              onClick={handleCreateEvent}
              className="flex items-center w-full px-4 py-2 text-sm text-primary-700 hover:bg-primary-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Create event
            </button>
            <button
              onClick={handleMarkAvailability}
              className="flex items-center w-full px-4 py-2 text-sm text-primary-700 hover:bg-primary-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark availability
            </button>
          </div>
        </div>
      )}
    </div>
  )
}