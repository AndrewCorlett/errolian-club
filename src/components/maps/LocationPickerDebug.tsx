import { useState, useEffect } from 'react'
import { googleMapsLoader } from '@/lib/googleMaps'

export function LocationPickerDebug() {
  const [debugInfo, setDebugInfo] = useState({
    googleLoaded: false,
    placesLoaded: false,
    autocompleteAvailable: false,
    loaderReady: false,
    currentTime: new Date().toLocaleTimeString()
  })

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        googleLoaded: !!(window as any).google?.maps,
        placesLoaded: !!(window as any).google?.maps?.places,
        autocompleteAvailable: !!(window as any).google?.maps?.places?.Autocomplete,
        loaderReady: googleMapsLoader.isReady(),
        currentTime: new Date().toLocaleTimeString()
      })
    }

    // Update immediately
    updateDebugInfo()

    // Update every second
    const interval = setInterval(updateDebugInfo, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 text-sm">
      <h3 className="font-bold text-gray-800 mb-2">Google Maps Debug Info</h3>
      <div className="space-y-1">
        <div className={`flex items-center gap-2 ${debugInfo.googleLoaded ? 'text-green-600' : 'text-red-600'}`}>
          <span>{debugInfo.googleLoaded ? '✅' : '❌'}</span>
          <span>Google Maps API</span>
        </div>
        <div className={`flex items-center gap-2 ${debugInfo.placesLoaded ? 'text-green-600' : 'text-red-600'}`}>
          <span>{debugInfo.placesLoaded ? '✅' : '❌'}</span>
          <span>Places API</span>
        </div>
        <div className={`flex items-center gap-2 ${debugInfo.autocompleteAvailable ? 'text-green-600' : 'text-red-600'}`}>
          <span>{debugInfo.autocompleteAvailable ? '✅' : '❌'}</span>
          <span>Autocomplete Class</span>
        </div>
        <div className={`flex items-center gap-2 ${debugInfo.loaderReady ? 'text-green-600' : 'text-red-600'}`}>
          <span>{debugInfo.loaderReady ? '✅' : '❌'}</span>
          <span>Loader Ready</span>
        </div>
        <div className="text-gray-500 text-xs mt-2">
          Last update: {debugInfo.currentTime}
        </div>
      </div>
    </div>
  )
}