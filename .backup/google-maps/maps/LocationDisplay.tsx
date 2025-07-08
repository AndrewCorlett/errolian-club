import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface LocationData {
  address: string
  lat: number
  lng: number
  placeId?: string
}

interface LocationDisplayProps {
  location: LocationData
  height?: string
  zoom?: number
  showControls?: boolean
  className?: string
}

declare global {
  interface Window {
    google: any
  }
}

export default function LocationDisplay({ 
  location, 
  height = "200px",
  zoom = 15,
  showControls = true,
  className = ""
}: LocationDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!window.google || !window.google.maps || !mapRef.current) {
      return
    }

    // Initialize map
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: location.lat, lng: location.lng },
      zoom: zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: showControls,
      gestureHandling: 'cooperative'
    })

    // Add marker
    new window.google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: mapInstanceRef.current,
      title: location.address
    })

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; max-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #1f2937;">Location</div>
          <div style="font-size: 14px; color: #4b5563;">${location.address}</div>
        </div>
      `
    })

    // Show info window when marker is clicked
    const marker = new window.google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: mapInstanceRef.current,
      title: location.address
    })

    marker.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, marker)
    })

  }, [location, zoom, showControls])

  const openInGoogleMaps = () => {
    const url = `https://maps.google.com?q=${location.lat},${location.lng}`
    window.open(url, '_blank')
  }

  const openInAppleMaps = () => {
    const url = `https://maps.apple.com?q=${location.lat},${location.lng}`
    window.open(url, '_blank')
  }

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${location.lat}, ${location.lng}`)
    // You could show a toast notification here
  }

  if (!window.google || !window.google.maps) {
    return (
      <div className={`${className} border border-gray-300 rounded-xl overflow-hidden`}>
        <div 
          className="flex items-center justify-center bg-gray-50 text-gray-500"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Loading map...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} border border-gray-300 rounded-xl overflow-hidden`}>
      {/* Map */}
      <div 
        ref={mapRef} 
        style={{ height }}
        className="w-full"
      />
      
      {/* Controls */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {location.address}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
          
          <div className="flex gap-2 ml-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openInGoogleMaps}
              className="h-8 px-3 text-xs"
            >
              Google Maps
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openInAppleMaps}
              className="h-8 px-3 text-xs"
            >
              Apple Maps
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyCoordinates}
              className="h-8 px-2 text-xs"
              title="Copy coordinates"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}