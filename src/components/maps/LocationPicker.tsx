import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { googleMapsLoader } from '@/lib/googleMaps'

interface LocationData {
  address: string
  lat: number
  lng: number
  placeId?: string
  viewport?: {
    northeast: { lat: number; lng: number }
    southwest: { lat: number; lng: number }
  }
}

interface LocationPickerProps {
  value?: LocationData | null
  onChange: (location: LocationData | null) => void
  placeholder?: string
  className?: string
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
  const [autocompleteStatus, setAutocompleteStatus] = useState<'loading' | 'ready' | 'error' | 'not-available'>('loading')
  const [geolocationStatus, setGeolocationStatus] = useState<'loading' | 'granted' | 'denied' | 'timeout' | 'error'>('loading')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const infoWindowRef = useRef<any>(null)
  const autocompleteRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<number | null>(null)

  // Helper function to manage single marker
  const updateMarker = (position: { lat: number; lng: number }, title?: string) => {
    if (!mapInstanceRef.current) {
      console.warn('[LocationPicker] Cannot update marker - no map instance')
      return
    }

    try {
      // If marker exists, just update its position
      if (markerRef.current) {
        markerRef.current.setPosition(position)
        if (title) {
          markerRef.current.setTitle(title)
        }
      } else {
        // Create new marker
        markerRef.current = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          draggable: true,
          title: title || 'Selected location'
        })

        // Add drag listener only once when marker is created
        markerRef.current.addListener('dragend', (event: any) => {
          const lat = event.latLng.lat()
          const lng = event.latLng.lng()
          debouncedGeocode({ lat, lng })
        })

        // Add click listener for InfoWindow
        markerRef.current.addListener('click', () => {
          const markerPosition = markerRef.current.getPosition()
          const pos = {
            lat: markerPosition.lat(),
            lng: markerPosition.lng()
          }
          showInfoWindow(markerRef.current, title || 'Selected location', pos)
        })
      }
    } catch (error) {
      console.error('[LocationPicker] Failed to update marker:', error)
    }
  }

  // Debounced geocoding function to improve performance during rapid marker movements
  const debouncedGeocode = (position: { lat: number; lng: number }) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout using requestAnimationFrame for smooth performance
    debounceTimeoutRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: position }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const newLocation = {
              address: results[0].formatted_address,
              lat: position.lat,
              lng: position.lng,
              placeId: results[0].place_id
            }
            onChange(newLocation)
            setSearchValue(results[0].formatted_address)
          }
        })
      })
    }, 300) // 300ms debounce delay
  }

  // Helper function to clear marker
  const clearMarker = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }
  }

  // Helper function to manage user location marker (blue dot)
  const updateUserLocationMarker = (position: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) {
      return
    }

    try {
      // If user marker exists, just update its position
      if (userMarkerRef.current) {
        userMarkerRef.current.setPosition(position)
      } else {
        // Create new user location marker with blue dot style
        userMarkerRef.current = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: 'Your location',
          draggable: false,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285f4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          zIndex: 1000 // Higher z-index to show above other markers
        })

        // Add click listener for user location InfoWindow
        userMarkerRef.current.addListener('click', () => {
          showInfoWindow(userMarkerRef.current, 'Your location', position)
        })
      }
    } catch (error) {
      console.error('[LocationPicker] Failed to update user location marker:', error)
    }
  }


  // Helper function to show toast
  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 5000)
  }

  // Helper function to show InfoWindow
  const showInfoWindow = (marker: any, title: string, position: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) return

    // Close existing InfoWindow
    if (infoWindowRef.current) {
      infoWindowRef.current.close()
    }

    // Create new InfoWindow
    const content = `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${title}</h3>
        <p style="margin: 0; font-size: 12px; color: #666;">
          Lat: ${position.lat.toFixed(6)}<br>
          Lng: ${position.lng.toFixed(6)}
        </p>
      </div>
    `

    infoWindowRef.current = new window.google.maps.InfoWindow({
      content,
      position
    })

    infoWindowRef.current.open(mapInstanceRef.current, marker)
  }

  // Geolocation service with timeout and error handling
  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setGeolocationStatus('error')
        reject(new Error('Geolocation not supported'))
        return
      }

      const timeoutId = setTimeout(() => {
        setGeolocationStatus('timeout')
        showToast('Location request timed out. Using default location.')
        reject(new Error('Geolocation timeout'))
      }, 8000)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId)
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setGeolocationStatus('granted')
          resolve(coords)
        },
        (error: GeolocationPositionError) => {
          clearTimeout(timeoutId)
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setGeolocationStatus('denied')
              showToast('Location access denied. Using default location.')
              reject(new Error('Geolocation permission denied'))
              break
            case error.POSITION_UNAVAILABLE:
              setGeolocationStatus('error')
              showToast('Location unavailable. Using default location.')
              reject(new Error('Geolocation position unavailable'))
              break
            case error.TIMEOUT:
              setGeolocationStatus('timeout')
              showToast('Location request timed out. Using default location.')
              reject(new Error('Geolocation timeout'))
              break
            default:
              setGeolocationStatus('error')
              showToast('Could not get location. Using default location.')
              reject(new Error('Unknown geolocation error'))
              break
          }
        },
        {
          timeout: 8000,
          maximumAge: 600000, // 10 minutes cache
          enableHighAccuracy: false
        }
      )
    })
  }

  // Load Google Maps API
  useEffect(() => {
    const loadMaps = async () => {
      try {
        await googleMapsLoader.load()
        setIsMapLoaded(true)
      } catch (error) {
        console.error('Failed to load Google Maps:', error)
      }
    }

    if (googleMapsLoader.isReady()) {
      setIsMapLoaded(true)
    } else {
      loadMaps()
    }
  }, [])

  // Initialize map when map is shown and Google Maps is loaded
  useEffect(() => {
    if (!isMapLoaded || !showMap || !mapRef.current) return
    
    // Only initialize map if it doesn't exist yet
    if (!mapInstanceRef.current) {
      const initializeMap = async () => {
        let initialLocation = { lat: -33.8688, lng: 151.2093 } // Sydney fallback
        let initialZoom = 11
        
        // Try to get user location first
        let hasUserLocation = false
        try {
          const userCoords = await getUserLocation()
          initialLocation = userCoords
          initialZoom = 12
          hasUserLocation = true
        } catch (error) {
          // Fall back to Sydney default
        }
        
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: initialLocation,
          zoom: initialZoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        
        // Add user location marker if we got user location
        if (hasUserLocation) {
          updateUserLocationMarker(initialLocation)
        }
      }
      
      initializeMap()
    }

  }, [isMapLoaded, showMap])

  // Update map when location value changes
  useEffect(() => {
    // Multiple safety checks before proceeding
    if (!mapInstanceRef.current) {
      return
    }
    
    if (!value) {
      return
    }
    
    if (typeof value.lat !== 'number' || typeof value.lng !== 'number') {
      return
    }
    
    if (isNaN(value.lat) || isNaN(value.lng)) {
      return
    }
    
    // Additional check to ensure map instance has required methods
    if (!mapInstanceRef.current.setCenter || !mapInstanceRef.current.setZoom) {
      return
    }
    
    try {
      // Use viewport bounds if available, otherwise center point
      if (value.viewport) {
        const bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(value.viewport.southwest.lat, value.viewport.southwest.lng),
          new window.google.maps.LatLng(value.viewport.northeast.lat, value.viewport.northeast.lng)
        )
        
        // Use panToBounds for smooth animation
        mapInstanceRef.current.panToBounds(bounds)
      } else {
        // Fallback to smooth center point animation
        const newCenter = { lat: value.lat, lng: value.lng }
        
        // First pan to the location smoothly
        mapInstanceRef.current.panTo(newCenter)
        
        // Then adjust zoom if necessary (smooth zoom)
        const currentZoom = mapInstanceRef.current.getZoom()
        if (currentZoom < 14) {
          setTimeout(() => {
            mapInstanceRef.current.setZoom(14)
          }, 500) // Delay zoom change to let pan complete
        }
      }
    } catch (error) {
      console.error('[LocationPicker] Failed to center map:', error)
      return
    }
    
    // Update marker using helper function
    const newCenter = { lat: value.lat, lng: value.lng }
    updateMarker(newCenter, value.address)
  }, [value, onChange])

  // Setup map click handlers (only once)
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const handleMapClick = (event: any) => {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()

      // Update marker using helper function
      updateMarker({ lat, lng }, 'Clicked location')

      // Use debounced geocoding for map clicks as well
      debouncedGeocode({ lat, lng })
    }

    mapInstanceRef.current.addListener('click', handleMapClick)
  }, [isMapLoaded, showMap, onChange])

  // Initialize autocomplete
  useEffect(() => {
    if (!isMapLoaded || !searchInputRef.current) {
      setAutocompleteStatus('loading')
      return
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      setAutocompleteStatus('not-available')
      return
    }

    try {
      
      // Clear any existing autocomplete
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }

      // Try the new PlaceAutocompleteElement first, fallback to old Autocomplete
      if (window.google.maps.places.PlaceAutocompleteElement) {
        // Create the new element (minimal configuration - some properties not supported)
        const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement()
        
        // Only set supported properties
        try {
          autocompleteElement.fields = ['formatted_address', 'geometry', 'place_id', 'name']
        } catch (e) {
          // Fields property not supported on new element
        }
        
        // Replace the input with the autocomplete element
        if (searchInputRef.current && searchInputRef.current.parentNode) {
          // Copy styles and attributes
          autocompleteElement.className = searchInputRef.current.className
          autocompleteElement.placeholder = searchInputRef.current.placeholder
          
          // Replace the input
          searchInputRef.current.parentNode.replaceChild(autocompleteElement, searchInputRef.current)
          autocompleteRef.current = autocompleteElement
          
          // Update ref to point to the new element
          searchInputRef.current = autocompleteElement as any
        }
        
        const handlePlaceChanged = (event: any) => {
          const place = event.place
          
          if (place?.geometry?.location) {
            // Ensure we have valid coordinates
            const rawLat = typeof place.geometry.location.lat === 'function' 
              ? place.geometry.location.lat() 
              : place.geometry.location.lat
            const rawLng = typeof place.geometry.location.lng === 'function' 
              ? place.geometry.location.lng() 
              : place.geometry.location.lng
            
            // Validate coordinates are numbers
            const lat = parseFloat(rawLat)
            const lng = parseFloat(rawLng)
            
            if (isNaN(lat) || isNaN(lng)) {
              console.error('[LocationPicker] Invalid coordinates received:', { rawLat, rawLng, lat, lng })
              return
            }
            
            // Extract viewport information if available
            let viewport = undefined
            if (place.geometry?.viewport) {
              const vp = place.geometry.viewport
              if (vp.getNorthEast && vp.getSouthWest) {
                // Legacy viewport object with methods
                const ne = vp.getNorthEast()
                const sw = vp.getSouthWest()
                viewport = {
                  northeast: { 
                    lat: typeof ne.lat === 'function' ? ne.lat() : ne.lat, 
                    lng: typeof ne.lng === 'function' ? ne.lng() : ne.lng 
                  },
                  southwest: { 
                    lat: typeof sw.lat === 'function' ? sw.lat() : sw.lat, 
                    lng: typeof sw.lng === 'function' ? sw.lng() : sw.lng 
                  }
                }
              } else if (vp.northeast && vp.southwest) {
                // Direct viewport object
                viewport = {
                  northeast: { 
                    lat: typeof vp.northeast.lat === 'function' ? vp.northeast.lat() : vp.northeast.lat,
                    lng: typeof vp.northeast.lng === 'function' ? vp.northeast.lng() : vp.northeast.lng
                  },
                  southwest: { 
                    lat: typeof vp.southwest.lat === 'function' ? vp.southwest.lat() : vp.southwest.lat,
                    lng: typeof vp.southwest.lng === 'function' ? vp.southwest.lng() : vp.southwest.lng
                  }
                }
              }
            }
            
              
            const location = {
              address: place.formatted_address || place.name || '',
              lat,
              lng,
              placeId: place.place_id,
              viewport
            }
            
            onChange(location)
            setSearchValue(location.address)
            
            // Always show map when location is selected
            setShowMap(true)
          } else {
            console.warn('[LocationPicker] No valid geometry in selected place (new element)')
          }
        }

        autocompleteElement.addEventListener('gmp-placeselect', handlePlaceChanged)
        
      } else {
        
        autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ['formatted_address', 'geometry', 'place_id', 'name'],
          types: ['establishment', 'geocode']
        })

        const handlePlaceChanged = () => {
          const place = autocompleteRef.current?.getPlace()
          
          if (place?.geometry?.location) {
            // Get coordinates and validate
            const rawLat = place.geometry.location.lat()
            const rawLng = place.geometry.location.lng()
            const lat = parseFloat(rawLat)
            const lng = parseFloat(rawLng)
            
            if (isNaN(lat) || isNaN(lng)) {
              console.error('[LocationPicker] Invalid coordinates received (legacy):', { rawLat, rawLng, lat, lng })
              return
            }
            
            // Extract viewport information if available
            let viewport = undefined
            if (place.geometry?.viewport) {
              const vp = place.geometry.viewport
              if (vp.getNorthEast && vp.getSouthWest) {
                // Legacy viewport object with methods
                const ne = vp.getNorthEast()
                const sw = vp.getSouthWest()
                viewport = {
                  northeast: { 
                    lat: typeof ne.lat === 'function' ? ne.lat() : ne.lat, 
                    lng: typeof ne.lng === 'function' ? ne.lng() : ne.lng 
                  },
                  southwest: { 
                    lat: typeof sw.lat === 'function' ? sw.lat() : sw.lat, 
                    lng: typeof sw.lng === 'function' ? sw.lng() : sw.lng 
                  }
                }
              } else if (vp.northeast && vp.southwest) {
                // Direct viewport object
                viewport = {
                  northeast: { 
                    lat: typeof vp.northeast.lat === 'function' ? vp.northeast.lat() : vp.northeast.lat,
                    lng: typeof vp.northeast.lng === 'function' ? vp.northeast.lng() : vp.northeast.lng
                  },
                  southwest: { 
                    lat: typeof vp.southwest.lat === 'function' ? vp.southwest.lat() : vp.southwest.lat,
                    lng: typeof vp.southwest.lng === 'function' ? vp.southwest.lng() : vp.southwest.lng
                  }
                }
              }
            }
            
            
            const location = {
              address: place.formatted_address || place.name || '',
              lat,
              lng,
              placeId: place.place_id,
              viewport
            }
            
            onChange(location)
            setSearchValue(location.address)
            
            // Always show map when location is selected
            setShowMap(true)
          } else {
            console.warn('[LocationPicker] No valid geometry in selected place (legacy)')
          }
        }

        autocompleteRef.current.addListener('place_changed', handlePlaceChanged)
      }
      
      setAutocompleteStatus('ready')

      return () => {
        if (autocompleteRef.current) {
          if (window.google?.maps?.event?.clearInstanceListeners) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
          }
          if (autocompleteRef.current.removeEventListener) {
            autocompleteRef.current.removeEventListener('gmp-placeselect', () => {})
          }
        }
      }
    } catch (error) {
      console.error('[LocationPicker] Failed to initialize autocomplete:', error)
      setAutocompleteStatus('error')
    }
  }, [isMapLoaded])

  const handleClearLocation = () => {
    onChange(null)
    setSearchValue('')
    setShowMap(false)
    clearMarker()
  }

  const toggleMap = () => {
    setShowMap(!showMap)
  }

  if (!isMapLoaded || geolocationStatus === 'loading') {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl bg-gray-50">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-600">
            {!isMapLoaded ? 'Loading maps...' : 'Getting your location...'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">{toastMessage}</p>
          </div>
        )}
        
        {/* Autocomplete Status */}
        <div className="flex items-center gap-2 text-xs">
          {autocompleteStatus === 'loading' && (
            <>
              <div className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-gray-600">Loading autocomplete...</span>
            </>
          )}
          {autocompleteStatus === 'ready' && (
            <>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-green-600">Search ready</span>
            </>
          )}
          {autocompleteStatus === 'error' && (
            <>
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="text-red-600">Search error</span>
            </>
          )}
          {autocompleteStatus === 'not-available' && (
            <>
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="text-yellow-600">Search not available</span>
            </>
          )}
        </div>
        
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