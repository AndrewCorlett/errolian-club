import { useState } from 'react'
import { format, addMonths, subMonths } from 'date-fns'

interface CalendarHeaderProps {
  displayedMonth: Date
  onMonthChange: (date: Date) => void
  onFilterToggle: () => void
}

export default function CalendarHeader({ 
  displayedMonth, 
  onMonthChange, 
  onFilterToggle 
}: CalendarHeaderProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handlePreviousMonth = () => {
    if (isAnimating) return
    setIsAnimating(true)
    onMonthChange(subMonths(displayedMonth, 1))
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleNextMonth = () => {
    if (isAnimating) return
    setIsAnimating(true)
    onMonthChange(addMonths(displayedMonth, 1))
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 h-14">
        {/* Month Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            disabled={isAnimating}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 hover:bg-primary-200 active:bg-primary-300 transition-all duration-200 disabled:opacity-50"
            aria-label="Previous month"
          >
            <svg 
              className="w-5 h-5 text-primary-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
          </button>

          <div className="min-w-[120px] text-center">
            <h1 className={`text-lg font-semibold text-gray-900 transition-all duration-300 ${
              isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
            }`}>
              {format(displayedMonth, 'MMMM yyyy')}
            </h1>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={isAnimating}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 hover:bg-primary-200 active:bg-primary-300 transition-all duration-200 disabled:opacity-50"
            aria-label="Next month"
          >
            <svg 
              className="w-5 h-5 text-primary-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
            <button className="px-3 py-1.5 text-sm font-medium bg-white text-gray-900 rounded-md shadow-sm transition-all duration-200">
              Calendar
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md transition-all duration-200">
              Upcoming
            </button>
          </div>

          {/* Filter Button */}
          <button
            onClick={onFilterToggle}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-royal-50 hover:bg-royal-100 active:bg-royal-200 transition-all duration-200"
            aria-label="Open filters"
          >
            <svg 
              className="w-5 h-5 text-royal-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0111 21v-6.586a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}