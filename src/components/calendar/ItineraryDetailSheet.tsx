import { Card, CardContent } from '@/components/ui/card'
import type { ItineraryItem } from '@/types/events'
import { getPortugalTripColors } from '@/data/portugalGolfTrip'

interface ItineraryDetailSheetProps {
  item: ItineraryItem | null
  isOpen: boolean
  onClose: () => void
}

export default function ItineraryDetailSheet({ 
  item, 
  isOpen, 
  onClose 
}: ItineraryDetailSheetProps) {
  if (!isOpen || !item) return null

  const colors = getPortugalTripColors()
  const itemColor = colors[item.type] || '#d7c6ff'

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end"
      onClick={onClose}
      style={{ overscrollBehavior: 'contain' }}
    >
      <div 
        className="bg-white w-full h-4/5 rounded-t-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Pull Handle */}
        <div className="flex justify-center py-3 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-xs px-2 py-1 rounded-md text-gray-800"
                style={{ backgroundColor: itemColor }}
              >
                {item.type}
              </span>
              <span className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                {item.startTime} - {item.endTime}
              </span>
              {item.cost > 0 && (
                <span className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-800">
                  £{item.cost}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{item.title}</h2>
            <p className="text-gray-600 text-sm">
              {item.location}
            </p>
          </div>
          
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{item.description}</p>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Time</label>
                    <p className="text-gray-900">{item.startTime}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Time</label>
                    <p className="text-gray-900">{item.endTime}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{item.location}</p>
                </div>

                {item.cost > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cost</label>
                    <p className="text-gray-900 text-lg font-semibold">£{item.cost}</p>
                  </div>
                )}

                {item.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-gray-700">{item.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Travel Details (if applicable) */}
          {(item.travelMethod || item.departureLocation || item.arrivalLocation) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Travel Information</h3>
                <div className="space-y-3">
                  {item.travelMethod && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Travel Method</label>
                      <p className="text-gray-900">{item.travelMethod}</p>
                    </div>
                  )}
                  {item.departureLocation && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Departure</label>
                      <p className="text-gray-900">{item.departureLocation}</p>
                    </div>
                  )}
                  {item.arrivalLocation && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Arrival</label>
                      <p className="text-gray-900">{item.arrivalLocation}</p>
                    </div>
                  )}
                  {item.confirmation && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Confirmation</label>
                      <p className="text-gray-900 font-mono text-sm">{item.confirmation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accommodation Details (if applicable) */}
          {(item.accommodationType || item.address || item.checkIn) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Accommodation</h3>
                <div className="space-y-3">
                  {item.accommodationType && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <p className="text-gray-900">{item.accommodationType}</p>
                    </div>
                  )}
                  {item.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900">{item.address}</p>
                    </div>
                  )}
                  {item.checkIn && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Check-in</label>
                        <p className="text-gray-900">{item.checkIn}</p>
                      </div>
                      {item.checkOut && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Check-out</label>
                          <p className="text-gray-900">{item.checkOut}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Details (if applicable) */}
          {(item.category || item.duration || item.difficulty) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Activity Details</h3>
                <div className="space-y-3">
                  {item.category && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Category</label>
                      <p className="text-gray-900">{item.category}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {item.duration && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Duration</label>
                        <p className="text-gray-900">{item.duration} hours</p>
                      </div>
                    )}
                    {item.difficulty && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Difficulty</label>
                        <p className="text-gray-900 capitalize">{item.difficulty}</p>
                      </div>
                    )}
                  </div>
                  {item.requirements && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Requirements</label>
                      <p className="text-gray-900">{item.requirements}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meal Details (if applicable) */}
          {(item.mealType || item.cuisine || item.reservation) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Dining Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {item.mealType && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Meal Type</label>
                        <p className="text-gray-900 capitalize">{item.mealType}</p>
                      </div>
                    )}
                    {item.cuisine && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Cuisine</label>
                        <p className="text-gray-900">{item.cuisine}</p>
                      </div>
                    )}
                  </div>
                  {item.reservation && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reservation</label>
                      <p className="text-gray-900 font-mono text-sm">{item.reservation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Simple Map Placeholder */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
              <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-600 text-sm">{item.location}</p>
                  <p className="text-xs text-gray-500 mt-1">Map integration available with Google Maps API</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}