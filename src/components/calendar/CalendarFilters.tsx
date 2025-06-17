
interface CalendarFiltersProps {
  isOpen: boolean
  onClose: () => void
  activeFilters: {
    events: boolean
    availability: boolean
    officers: boolean
  }
  onFiltersChange: (filters: CalendarFiltersProps['activeFilters']) => void
}

export default function CalendarFilters({ isOpen, onClose, activeFilters, onFiltersChange }: CalendarFiltersProps) {
  if (!isOpen) return null

  const toggleFilter = (key: keyof CalendarFiltersProps['activeFilters']) => {
    onFiltersChange({
      ...activeFilters,
      [key]: !activeFilters[key]
    })
  }

  const resetFilters = () => {
    onFiltersChange({ events: true, availability: true, officers: true })
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      style={{ overscrollBehavior: 'contain' }}
    >
      <div 
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        
        {/* Handle bar */}
        <div className="flex justify-center py-3 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4">
          <button
            onClick={onClose}
            className="text-blue-600 font-medium"
          >
            Done
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          
          <button
            onClick={resetFilters}
            className="text-blue-600 font-medium"
          >
            Reset
          </button>
        </div>

        {/* Filter Options */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Show in Calendar</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">Events</p>
                    <p className="text-xs text-gray-500">Club events and activities</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFilter('events')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    activeFilters.events ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      activeFilters.events ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">Availability</p>
                    <p className="text-xs text-gray-500">Member availability windows</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFilter('availability')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    activeFilters.availability ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      activeFilters.availability ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">Officer Events</p>
                    <p className="text-xs text-gray-500">Officer-only meetings and tasks</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFilter('officers')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    activeFilters.officers ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      activeFilters.officers ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}