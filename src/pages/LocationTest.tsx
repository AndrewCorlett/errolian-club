import { useState } from 'react'
import { AutocompleteInput } from '@/components/places/AutocompleteInput'
import { MapPreview } from '@/components/places/MapPreview'
import type { Place } from '@/types/places'

export default function LocationTest() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [consoleLog, setConsoleLog] = useState<string[]>([])

  const handlePlaceSelected = (place: Place) => {
    console.log('[LocationTest] Place selected:', place)
    setSelectedPlace(place)
    setConsoleLog(prev => [...prev, `Place selected: ${place.name} - ${place.address}`])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Location Search Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Search for a location (try "Glasgow")
            </h2>
            <AutocompleteInput
              onPlaceSelected={handlePlaceSelected}
              placeholder="Search for a location..."
            />
          </div>

          {selectedPlace && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Selected Location:</h3>
                <p className="text-blue-700">{selectedPlace.name}</p>
                <p className="text-blue-600 text-sm">{selectedPlace.address}</p>
                {selectedPlace.coordinates && (
                  <p className="text-blue-600 text-xs mt-1">
                    Coordinates: {selectedPlace.coordinates.latitude.toFixed(6)}, {selectedPlace.coordinates.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              <MapPreview
                latitude={selectedPlace.coordinates.latitude}
                longitude={selectedPlace.coordinates.longitude}
                name={selectedPlace.name}
                address={selectedPlace.address}
              />
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">Console Output:</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-40 overflow-y-auto">
              {consoleLog.length === 0 ? (
                <p className="text-gray-500">No console output yet...</p>
              ) : (
                consoleLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}