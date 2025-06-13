import { Button } from '@/components/ui/button'

interface CalendarFiltersProps {
  filters: {
    showEvents: boolean
    showAvailability: boolean
    showOfficerEvents: boolean
  }
  onFilterChange: (filters: CalendarFiltersProps['filters']) => void
}

export default function CalendarFilters({ filters, onFilterChange }: CalendarFiltersProps) {
  const toggleFilter = (key: keyof CalendarFiltersProps['filters']) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key]
    })
  }

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 mr-4">
        <span className="font-medium">Filters:</span>
      </div>
      
      <Button
        variant={filters.showEvents ? "default" : "outline"}
        size="sm"
        onClick={() => toggleFilter('showEvents')}
        className="text-xs"
      >
        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
        Events
      </Button>

      <Button
        variant={filters.showAvailability ? "default" : "outline"}
        size="sm"
        onClick={() => toggleFilter('showAvailability')}
        className="text-xs"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
        Availability
      </Button>

      <Button
        variant={filters.showOfficerEvents ? "default" : "outline"}
        size="sm"
        onClick={() => toggleFilter('showOfficerEvents')}
        className="text-xs"
      >
        <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
        Officer Events
      </Button>

      <div className="ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange({ showEvents: true, showAvailability: true, showOfficerEvents: true })}
          className="text-xs text-gray-500"
        >
          Show All
        </Button>
      </div>
    </div>
  )
}