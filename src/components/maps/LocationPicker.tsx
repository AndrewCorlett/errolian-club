import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface LocationData {
  address: string
  lat: number
  lng: number
  placeId?: string
}

interface LocationPickerProps {
  value?: LocationData | null
  onChange: (location: LocationData | null) => void
  placeholder?: string
  className?: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function LocationPicker({ 
  value, 
  onChange, 
  placeholder = "Search for a location...",
  className = ""
}: LocationPickerProps) {
  const [searchValue, setSearchValue] = useState(value?.address || '')
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const autocompleteRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsMapLoaded(true)
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps) {
          setIsMapLoaded(true)
        } else {
          setTimeout(checkGoogleMaps, 100)
        }
      }
      checkGoogleMaps()
      return
    }

    const script = document.createElement('script')
    // TODO: Replace 'YOUR_API_KEY' with your actual Google Maps API key
    // Get your API key from: https://console.cloud.google.com/google/maps-apis/
    // Make sure to enable the "Maps JavaScript API" and "Places API"
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initMap`
    script.async = true
    script.defer = true
    
    window.initMap = () => {
      setIsMapLoaded(true)
    }
    
    document.head.appendChild(script)

    return () => {
      // Cleanup - remove script if component unmounts
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript)
      }
    }
  }, [])

  // Initialize map when map is shown and Google Maps is loaded
  useEffect(() => {
    if (!isMapLoaded || !showMap || !mapRef.current) return

    // Initialize map
    const defaultLocation = value ? { lat: value.lat, lng: value.lng } : { lat: -33.8688, lng: 151.2093 } // Sydney default
    
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: value ? 15 : 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    // Add marker if we have a location
    if (value) {
      markerRef.current = new window.google.maps.Marker({
        position: { lat: value.lat, lng: value.lng },
        map: mapInstanceRef.current,
        draggable: true,
      })

      // Handle marker drag
      markerRef.current.addListener('dragend', (event: any) => {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            onChange({
              address: results[0].formatted_address,
              lat,
              lng,
              placeId: results[0].place_id
            })
            setSearchValue(results[0].formatted_address)
          }
        })
      })
    }

    // Handle map clicks
    mapInstanceRef.current.addListener('click', (event: any) => {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()

      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }

      // Add new marker
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        draggable: true,
      })

      // Handle marker drag
      markerRef.current.addListener('dragend', (dragEvent: any) => {
        const dragLat = dragEvent.latLng.lat()
        const dragLng = dragEvent.latLng.lng()
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: { lat: dragLat, lng: dragLng } }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            onChange({
              address: results[0].formatted_address,
              lat: dragLat,
              lng: dragLng,
              placeId: results[0].place_id
            })
            setSearchValue(results[0].formatted_address)
          }
        })
      })

      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          onChange({
            address: results[0].formatted_address,
            lat,
            lng,
            placeId: results[0].place_id
          })
          setSearchValue(results[0].formatted_address)
        }
      })
    })
  }, [isMapLoaded, showMap, value, onChange])

  // Initialize autocomplete
  useEffect(() => {
    if (!isMapLoaded || !searchInputRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      fields: ['formatted_address', 'geometry', 'place_id'],
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      
      if (place.geometry && place.geometry.location) {
        const location = {
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id
        }
        
        onChange(location)
        setSearchValue(place.formatted_address)
        setShowMap(true)

        // Update map if it's visible
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat: location.lat, lng: location.lng })
          mapInstanceRef.current.setZoom(15)
          
          // Remove existing marker
          if (markerRef.current) {
            markerRef.current.setMap(null)
          }

          // Add new marker
          markerRef.current = new window.google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: mapInstanceRef.current,
            draggable: true,
          })
        }
      }
    })
  }, [isMapLoaded, onChange])

  const handleClearLocation = () => {
    onChange(null)
    setSearchValue('')
    setShowMap(false)
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }
  }

  const toggleMap = () => {
    setShowMap(!showMap)
  }

  if (!isMapLoaded) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl bg-gray-50">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-600">Loading maps...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={placeholder}
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearLocation}
                className="h-7 px-2 text-xs"
              >
                Clear
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleMap}
              className="h-7 px-2 text-xs"
            >
              {showMap ? 'Hide' : 'Map'}
            </Button>
          </div>
        </div>

        {/* Map Container */}
        {showMap && (
          <div className="border border-gray-300 rounded-xl overflow-hidden">
            <div 
              ref={mapRef} 
              className="w-full h-64"
              style={{ minHeight: '256px' }}
            />
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Click on the map to set location or drag the marker to adjust
              </p>
            </div>
          </div>
        )}

        {/* Selected Location Display */}
        {value && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Selected Location</p>
                <p className="text-xs text-blue-700 mt-1">{value.address}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://maps.google.com?q=${value.lat},${value.lng}`, '_blank')}
                  className="h-7 px-2 text-xs text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Google Maps
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://maps.apple.com?q=${value.lat},${value.lng}`, '_blank')}
                  className="h-7 px-2 text-xs text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Apple Maps
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}