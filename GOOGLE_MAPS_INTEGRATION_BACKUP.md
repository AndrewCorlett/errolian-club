# Google Maps API Integration - Complete Code Backup

This file contains all the Google Maps integration code that has been implemented in the Errolian Club application. This includes the API loader, types, components, and utilities.

## 🔧 Core Infrastructure

### 1. Google Maps API Loader (`src/lib/googleMaps.ts`)

```typescript
// Google Maps API loader service
// Ensures the API is only loaded once across the entire app

declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader
  private isLoaded = false
  private isLoading = false
  private loadPromise: Promise<void> | null = null
  private callbacks: (() => void)[] = []

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader()
    }
    return GoogleMapsLoader.instance
  }

  async load(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded && window.google && window.google.maps) {
      return Promise.resolve()
    }

    // If currently loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript && window.google && window.google.maps) {
      this.isLoaded = true
      return Promise.resolve()
    }

    // Start loading
    this.isLoading = true
    this.loadPromise = this.loadGoogleMaps()
    
    try {
      await this.loadPromise
      this.isLoaded = true
      this.isLoading = false
      
      // Execute any queued callbacks
      this.callbacks.forEach(callback => callback())
      this.callbacks = []
      
    } catch (error) {
      this.isLoading = false
      this.loadPromise = null
      throw error
    }
  }

  private loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      
      console.log('[GoogleMapsLoader] Checking API key availability...')
      
      if (!apiKey) {
        console.error('[GoogleMapsLoader] No API key found in environment variables')
        reject(new Error('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file'))
        return
      }

      console.log('[GoogleMapsLoader] API key found, proceeding with script loading...')

      // Clean up any existing scripts that might have failed to load
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
      console.log(`[GoogleMapsLoader] Found ${existingScripts.length} existing Google Maps scripts, cleaning up...`)
      existingScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      })

      const script = document.createElement('script')
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`
      script.src = scriptUrl
      script.async = true
      script.defer = true

      console.log('[GoogleMapsLoader] Creating script element with URL:', scriptUrl)

      // Set up callback
      window.initGoogleMaps = () => {
        console.log('[GoogleMapsLoader] initGoogleMaps callback triggered')
        console.log('[GoogleMapsLoader] window.google available:', !!window.google)
        console.log('[GoogleMapsLoader] window.google.maps available:', !!window.google?.maps)
        console.log('[GoogleMapsLoader] window.google.maps.places available:', !!window.google?.maps?.places)
        
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('[GoogleMapsLoader] Google Maps API loaded successfully with Places library')
          resolve()
        } else {
          console.error('[GoogleMapsLoader] Google Maps API loaded but missing required components')
          reject(new Error('Google Maps API failed to load completely'))
        }
      }

      script.onerror = (error) => {
        console.error('[GoogleMapsLoader] Script loading error:', error)
        reject(new Error('Failed to load Google Maps API script'))
      }

      console.log('[GoogleMapsLoader] Appending script to document head...')
      document.head.appendChild(script)
    })
  }

  isReady(): boolean {
    const ready = this.isLoaded && window.google && window.google.maps && window.google.maps.places
    console.log('[GoogleMapsLoader] isReady() check:', {
      isLoaded: this.isLoaded,
      hasGoogle: !!window.google,
      hasMaps: !!window.google?.maps,
      hasPlaces: !!window.google?.maps?.places,
      ready
    })
    return ready
  }

  onReady(callback: () => void): void {
    if (this.isReady()) {
      callback()
    } else {
      this.callbacks.push(callback)
    }
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance()
```

### 2. TypeScript Definitions (`src/types/google-maps.d.ts`)

```typescript
// Google Maps types for web
declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: Element, opts?: MapOptions);
        setCenter(latLng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
        addListener(eventName: string, handler: () => void): void;
        panTo(latLng: LatLng | LatLngLiteral): void;
        getZoom(): number;
        getCenter(): LatLng;
      }

      class Marker {
        constructor(opts?: MarkerOptions);
        setPosition(latLng: LatLng | LatLngLiteral): void;
        setMap(map: Map | null): void;
        addListener(eventName: string, handler: () => void): void;
        setTitle(title: string): void;
        setIcon(icon: string | Icon): void;
      }

      namespace marker {
        class AdvancedMarkerElement {
          constructor(opts?: AdvancedMarkerElementOptions);
          position: LatLng | LatLngLiteral | null;
          map: Map | null;
          title: string;
          content: HTMLElement | null;
          addListener(eventName: string, handler: () => void): void;
        }

        class PinElement {
          constructor(opts?: PinElementOptions);
          element: HTMLElement;
          background?: string;
          borderColor?: string;
          glyphColor?: string;
        }

        interface AdvancedMarkerElementOptions {
          position?: LatLng | LatLngLiteral;
          map?: Map;
          title?: string;
          content?: HTMLElement;
        }

        interface PinElementOptions {
          background?: string;
          borderColor?: string;
          glyphColor?: string;
        }
      }

      class InfoWindow {
        constructor(opts?: InfoWindowOptions);
        open(map?: Map, anchor?: Marker | marker.AdvancedMarkerElement): void;
        close(): void;
        setContent(content: string | Element): void;
      }

      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      namespace places {
        class Autocomplete {
          constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
          addListener(eventName: string, handler: () => void): void;
          getPlace(): PlaceResult;
        }

        class PlaceAutocompleteElement extends HTMLElement {
          constructor(options?: PlaceAutocompleteElementOptions);
          addEventListener(type: string, listener: EventListener): void;
          removeEventListener(type: string, listener: EventListener): void;
          includedPrimaryTypes?: string[];
          includedRegionCodes?: string[];
          locationBias?: any;
          locationRestriction?: any;
          name?: string;
          origin?: LatLng | LatLngLiteral;
          requestedLanguage?: string;
          requestedRegion?: string;
        }

        interface PlaceAutocompleteElementOptions {
          includedPrimaryTypes?: string[];
          includedRegionCodes?: string[];
          locationBias?: any;
          locationRestriction?: any;
          name?: string;
          origin?: LatLng | LatLngLiteral;
          requestedLanguage?: string;
          requestedRegion?: string;
        }

        interface PlacePrediction {
          toPlace(): Place;
        }

        interface Place {
          fetchFields(options: { fields: string[] }): Promise<void>;
          displayName?: string;
          formattedAddress?: string;
          location?: LatLng;
          viewport?: any;
          id?: string;
          name?: string;
          formatted_address?: string;
          geometry?: {
            location?: LatLng;
          };
          url?: string;
          website?: string;
          formatted_phone_number?: string;
        }

        interface PlacePredictionSelectEvent extends Event {
          placePrediction: PlacePrediction;
        }

        class PlacesService {
          constructor(attrContainer: HTMLDivElement | Map);
          getDetails(request: PlaceDetailsRequest, callback: (place: PlaceResult | null, status: PlacesServiceStatus) => void): void;
        }

        interface PlaceDetailsRequest {
          placeId: string;
          fields?: string[];
        }

        enum PlacesServiceStatus {
          OK = 'OK',
          ZERO_RESULTS = 'ZERO_RESULTS',
          OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
          REQUEST_DENIED = 'REQUEST_DENIED',
          INVALID_REQUEST = 'INVALID_REQUEST',
          NOT_FOUND = 'NOT_FOUND',
          UNKNOWN_ERROR = 'UNKNOWN_ERROR'
        }

        interface PlaceResult {
          place_id?: string;
          name?: string;
          formatted_address?: string;
          geometry?: {
            location?: LatLng;
          };
          url?: string;
          website?: string;
          formatted_phone_number?: string;
        }

        interface AutocompleteOptions {
          fields?: string[];
          types?: string[];
          componentRestrictions?: undefined;
        }
      }

      namespace event {
        function addListener(instance: any, eventName: string, handler: () => void): void;
        function removeListener(listener: any): void;
        function clearInstanceListeners(instance: any): void;
      }

      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeId?: MapTypeId;
        mapId?: string;
        disableDefaultUI?: boolean;
        zoomControl?: boolean;
        mapTypeControl?: boolean;
        scaleControl?: boolean;
        streetViewControl?: boolean;
        rotateControl?: boolean;
        fullscreenControl?: boolean;
      }

      interface MarkerOptions {
        position?: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
        animation?: Animation;
      }

      interface InfoWindowOptions {
        content?: string | Element;
      }

      interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      interface Icon {
        url: string;
        size?: Size;
        origin?: Point;
        anchor?: Point;
        scaledSize?: Size;
      }

      class Size {
        constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
      }

      class Point {
        constructor(x: number, y: number);
      }

      enum MapTypeId {
        ROADMAP = 'roadmap',
        SATELLITE = 'satellite',
        HYBRID = 'hybrid',
        TERRAIN = 'terrain',
      }

      enum Animation {
        DROP = 'drop',
        BOUNCE = 'bounce',
      }

      interface MapsLibrary {
        Map: typeof Map;
        InfoWindow: typeof InfoWindow;
        LatLng: typeof LatLng;
      }

      interface MarkerLibrary {
        AdvancedMarkerElement: typeof marker.AdvancedMarkerElement;
        PinElement: typeof marker.PinElement;
        Marker: typeof Marker;
      }

      function importLibrary(name: string): Promise<MapsLibrary | MarkerLibrary>;
    }
  }
}

export {};
```

## 🎯 Core Components

### 3. AutocompleteInput Component (`src/components/places/AutocompleteInput.tsx`)

```tsx
import React, { useRef, useEffect, useState } from 'react';
import { googleMapsLoader } from '@/lib/googleMaps';
import type { Place, AutocompleteInputProps } from '../../types/places';

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ 
  onPlaceSelected, 
  placeholder = "Search for a location" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const eventListenerRef = useRef<((event: any) => void) | null>(null);
  const initializingRef = useRef<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeAutocomplete = async () => {
      // Prevent multiple simultaneous initializations
      if (initializingRef.current) {
        console.log('[AutocompleteInput] Already initializing, skipping...');
        return;
      }
      
      // If already loaded and element exists, don't reinitialize
      if (autocompleteElementRef.current && containerRef.current?.contains(autocompleteElementRef.current)) {
        console.log('[AutocompleteInput] Element already exists and is attached, skipping...');
        return;
      }

      initializingRef.current = true;
      
      try {
        console.log('[AutocompleteInput] Starting Google Maps API initialization...');
        await googleMapsLoader.load();
        console.log('[AutocompleteInput] Google Maps API loaded successfully');
        
        if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
          throw new Error('PlaceAutocompleteElement not available');
        }

        if (containerRef.current) {
          // Clean up any existing elements first
          const existingElements = containerRef.current.querySelectorAll('gmp-place-autocomplete');
          console.log(`[AutocompleteInput] Found ${existingElements.length} existing elements to clean up`);
          existingElements.forEach(el => {
            console.log('[AutocompleteInput] Removing existing element');
            el.remove();
          });
          
          // Also clean up our ref if it exists
          if (autocompleteElementRef.current) {
            try {
              autocompleteElementRef.current.remove();
              console.log('[AutocompleteInput] Removed ref element');
            } catch (e) {
              console.log('[AutocompleteInput] Element already removed');
            }
            autocompleteElementRef.current = null;
          }

          console.log('[AutocompleteInput] Creating PlaceAutocompleteElement...');
          
          // Check if we're still mounted before proceeding
          if (!mounted) {
            console.log('[AutocompleteInput] Component unmounted during initialization');
            return;
          }
          
          // Create the new PlaceAutocompleteElement
          const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places") as any;
          
          // Check again after async operation
          if (!mounted) {
            console.log('[AutocompleteInput] Component unmounted after library import');
            return;
          }
          
          autocompleteElementRef.current = new PlaceAutocompleteElement({
            includedPrimaryTypes: ['geocode', 'establishment'],
            requestedLanguage: 'en',
            requestedRegion: 'us'
          });

          const element = autocompleteElementRef.current;
          if (!element || !mounted) return;

          // Style the element to match our design
          element.style.width = '100%';
          element.style.height = '44px';
          element.style.border = '1px solid #d1d5db';
          element.style.borderRadius = '8px';
          element.style.padding = '0 12px';
          element.style.fontSize = '16px';
          element.style.outline = 'none';
          element.style.transition = 'border-color 0.2s';

          // Set placeholder - this needs to be done by finding the input inside the element
          setTimeout(() => {
            const input = element.querySelector('input');
            if (input) {
              input.placeholder = placeholder;
              input.style.border = 'none';
              input.style.outline = 'none';
              input.style.width = '100%';
              input.style.height = '100%';
              input.style.padding = '0';
              input.style.fontSize = '16px';
              input.style.backgroundColor = 'transparent';
            }
          }, 100);

          // Add focus/blur styling
          element.addEventListener('focus', () => {
            element.style.borderColor = '#3b82f6';
            element.style.boxShadow = '0 0 0 1px #3b82f6';
          });

          element.addEventListener('blur', () => {
            element.style.borderColor = '#d1d5db';
            element.style.boxShadow = 'none';
          });

          // Create event listener for place selection
          eventListenerRef.current = async (event: any) => {
            console.log('[AutocompleteInput] Place selection triggered with event:', event);
            
            try {
              if (!event.placePrediction) {
                console.error('[AutocompleteInput] No placePrediction in event');
                return;
              }

              const prediction = event.placePrediction;
              console.log('[AutocompleteInput] Place prediction received:', prediction);

              // Convert prediction to Place and fetch fields
              const place = prediction.toPlace();
              console.log('[AutocompleteInput] Place object created:', place);

              await place.fetchFields({
                fields: [
                  'displayName', 
                  'formattedAddress', 
                  'location', 
                  'id',
                  'viewport',
                  'internationalPhoneNumber'
                ]
              });

              console.log('[AutocompleteInput] Place fields fetched:', place);
              console.log('[AutocompleteInput] Place details:', {
                id: place.id,
                displayName: place.displayName,
                formattedAddress: place.formattedAddress,
                location: place.location,
                hasLocation: !!place.location,
                lat: place.location?.lat?.(),
                lng: place.location?.lng?.()
              });

              // Ensure we have valid data before proceeding
              if (!place.displayName || !place.location) {
                throw new Error('Missing required place data');
              }

              // Convert to our Place interface format
              const placeData: Place = {
                id: place.id || '',
                name: place.displayName || '',
                address: place.formattedAddress || '',
                coordinates: {
                  latitude: place.location.lat(),
                  longitude: place.location.lng(),
                },
                mapsUrl: '', // URL field not available in new API
                website: '', // Website field not available in new API
                phoneNumber: place.internationalPhoneNumber || '',
              };

              console.log('[AutocompleteInput] Final place data:', placeData);
              onPlaceSelected(placeData);

            } catch (error) {
              console.error('[AutocompleteInput] Error processing place selection:', error);
              
              // Fallback - try to get basic info from the prediction
              try {
                const basicPlace: Place = {
                  id: '',
                  name: event.placePrediction?.description || 'Unknown Place',
                  address: event.placePrediction?.description || '',
                  coordinates: { latitude: 0, longitude: 0 },
                  mapsUrl: '',
                  website: '',
                  phoneNumber: '',
                };
                console.log('[AutocompleteInput] Using fallback place data:', basicPlace);
                onPlaceSelected(basicPlace);
              } catch (fallbackError) {
                console.error('[AutocompleteInput] Fallback also failed:', fallbackError);
              }
            }
          };

          // Add the event listener
          element.addEventListener('gmp-select', eventListenerRef.current);

          // Append to container only if still mounted
          if (mounted && containerRef.current) {
            containerRef.current.appendChild(element);
            setIsLoaded(true);
            console.log('[AutocompleteInput] PlaceAutocompleteElement initialized successfully');
          }
        }
      } catch (error) {
        console.error('[AutocompleteInput] Failed to initialize:', error);
        if (mounted) {
          setError('Failed to load Google Maps autocomplete. Please check your connection and API key.');
        }
      } finally {
        // Reset initialization flag
        initializingRef.current = false;
      }
    };

    initializeAutocomplete();

    return () => {
      // Cleanup
      mounted = false;
      console.log('[AutocompleteInput] Cleaning up component...');
      
      // Remove event listener
      if (autocompleteElementRef.current && eventListenerRef.current) {
        console.log('[AutocompleteInput] Removing event listener...');
        try {
          autocompleteElementRef.current.removeEventListener('gmp-select', eventListenerRef.current);
        } catch (e) {
          console.log('[AutocompleteInput] Event listener already removed or element invalid');
        }
      }
      
      // Remove the element
      if (autocompleteElementRef.current) {
        try {
          if (autocompleteElementRef.current.parentNode) {
            autocompleteElementRef.current.parentNode.removeChild(autocompleteElementRef.current);
          }
        } catch (e) {
          console.log('[AutocompleteInput] Element already removed');
        }
        autocompleteElementRef.current = null;
      }
      
      // Clear any remaining elements in container as fallback
      if (containerRef.current) {
        const remainingElements = containerRef.current.querySelectorAll('gmp-place-autocomplete');
        remainingElements.forEach(el => {
          try {
            el.remove();
          } catch (e) {
            console.log('[AutocompleteInput] Fallback cleanup: element already removed');
          }
        });
      }
      
      // Clear refs
      eventListenerRef.current = null;
      initializingRef.current = false;
    };
  }, [onPlaceSelected, placeholder]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div 
        ref={containerRef}
        className="w-full"
        data-testid="places-search-container"
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};
```

### 4. MapPreview Component (`src/components/places/MapPreview.tsx`)

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { googleMapsLoader } from '@/lib/googleMaps';
import type { MapPreviewProps } from '../../types/places';
import { openInGoogleMaps, buildGoogleMapsUrl, validateCoordinates } from '../../utils/maps';

export const MapPreview: React.FC<MapPreviewProps> = ({ 
  latitude, 
  longitude, 
  name, 
  address 
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Validate coordinates
  const coordsValid = validateCoordinates(latitude, longitude);

  useEffect(() => {
    if (!coordsValid) {
      setMapError('Invalid coordinates provided');
      return;
    }

    // Load Google Maps using the loader
    initializeMap();

    return () => {
      // Cleanup marker when component unmounts
      if (markerRef.current) {
        markerRef.current.map = null;
      }
    };
  }, [latitude, longitude, coordsValid]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      await googleMapsLoader.load();
      
      const { Map } = await window.google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      
      const center = { lat: latitude, lng: longitude };
      
      // Initialize map
      const map = new Map(mapRef.current, {
        center,
        zoom: 15,
        mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: true,
        rotateControl: false,
        fullscreenControl: true,
      });

      googleMapRef.current = map;

      // Create a pin element with custom styling
      const pinElement = new PinElement({
        background: '#3B82F6',
        borderColor: '#1E40AF',
        glyphColor: '#FFFFFF',
      });

      // Add marker
      const marker = new AdvancedMarkerElement({
        position: center,
        map,
        title: name,
        content: pinElement.element,
      });

      markerRef.current = marker;

      // Add info window
      if (name || address) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              ${name ? `<h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${name}</h3>` : ''}
              ${address ? `<p style="margin: 0; font-size: 12px; color: #666;">${address}</p>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }

      // Add click listener to marker for deep linking
      marker.addListener('click', handleMarkerPress);

      setMapReady(true);
    } catch (error) {
      console.error('[MapPreview] Error initializing map:', error);
      setMapError('Failed to initialize map');
    }
  };

  const handleMarkerPress = () => {
    console.log('[MapPreview] Marker pressed');
    const url = buildGoogleMapsUrl(latitude, longitude, name);
    openInGoogleMaps(url);
  };

  const handleOpenMapsClick = () => {
    console.log('[MapPreview] Open Maps button clicked');
    const url = buildGoogleMapsUrl(latitude, longitude, name);
    openInGoogleMaps(url);
  };

  if (!coordsValid) {
    return (
      <div className="h-52 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p className="text-red-600 text-sm">Invalid location coordinates</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-52 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 text-2xl mb-2">❌</div>
          <p className="text-red-600 text-sm">{mapError}</p>
          <button 
            onClick={handleOpenMapsClick}
            className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            Open in Google Maps
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-52 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        data-testid="map-view"
      />
      
      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Open Maps button */}
      <button
        onClick={handleOpenMapsClick}
        className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        data-testid="open-maps-button"
        title="Open in Google Maps"
      >
        📍 Open Maps
      </button>

      {/* Location info overlay */}
      {mapReady && name && (
        <div className="absolute top-3 left-3 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md max-w-xs">
          <h3 className="font-medium text-sm text-gray-900 truncate">{name}</h3>
          {address && (
            <p className="text-xs text-gray-600 mt-1 truncate">{address}</p>
          )}
        </div>
      )}
    </div>
  );
};
```

### 5. LocationPicker Component (`src/components/places/LocationPicker.tsx`)

```tsx
import React, { useState } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import { MapPreview } from './MapPreview';
import type { Place } from '../../types/places';

interface LocationPickerProps {
  onLocationSelected?: (place: Place) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Combined location picker component that provides both autocomplete search
 * and map preview functionality
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelected,
  placeholder = "Search for a location...",
  className = "",
}) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const handlePlaceSelected = (place: Place) => {
    console.log('[LocationPicker] Place selected:', place);
    setSelectedPlace(place);
    onLocationSelected?.(place);
  };

  const handleClearLocation = () => {
    setSelectedPlace(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <AutocompleteInput 
          onPlaceSelected={handlePlaceSelected}
          placeholder={placeholder}
        />
        {selectedPlace && (
          <button
            onClick={handleClearLocation}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            title="Clear location"
            data-testid="clear-location-button"
          >
            ✕
          </button>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedPlace && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {selectedPlace.name}
              </h3>
              {selectedPlace.address && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPlace.address}
                </p>
              )}
              {selectedPlace.website && (
                <a 
                  href={selectedPlace.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center mt-1"
                >
                  🌐 Website
                </a>
              )}
              {selectedPlace.phoneNumber && (
                <p className="text-sm text-gray-600 mt-1">
                  📞 {selectedPlace.phoneNumber}
                </p>
              )}
            </div>
          </div>

          {/* Map Preview */}
          <MapPreview
            latitude={selectedPlace.coordinates.latitude}
            longitude={selectedPlace.coordinates.longitude}
            name={selectedPlace.name}
            address={selectedPlace.address}
          />
        </div>
      )}

      {/* Placeholder when no location selected */}
      {!selectedPlace && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📍</div>
          <p className="text-sm">Search for a location to see it on the map</p>
        </div>
      )}
    </div>
  );
};
```

## 📝 Configuration & Environment

### Environment Variables Required:
```bash
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Package Dependencies:
```json
{
  "@googlemaps/js-api-loader": "^1.16.2"
}
```

### Vite Configuration (`vite.config.ts`):
```typescript
export default defineConfig({
  // ... other config
  define: {
    global: 'globalThis',
  },
})
```

## 🔗 Integration Points

### Calendar Integration:
- Used in `src/components/calendar/NewEventSheet.tsx`
- Used in `src/components/calendar/ItineraryBuilder.tsx`
- Used in `src/components/calendar/ItineraryDetailSheet.tsx`

### Split Pay Integration:
- Location picking for expense events
- Venue selection for group expenses

### Type Interfaces:
```typescript
interface Place {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  mapsUrl: string;
  website: string;
  phoneNumber: string;
}

interface AutocompleteInputProps {
  onPlaceSelected: (place: Place) => void;
  placeholder?: string;
}

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}
```

## 🚨 Important Notes:

1. **API Key Management**: Store the Google Maps API key in `VITE_GOOGLE_MAPS_API_KEY` environment variable
2. **Singleton Pattern**: The GoogleMapsLoader ensures only one instance loads the API
3. **Modern API**: Uses the new Places API and AdvancedMarkerElement
4. **Error Handling**: Comprehensive error handling and fallbacks
5. **Cleanup**: Proper component unmounting and memory management
6. **TypeScript**: Full type safety with custom type definitions

This integration provides location autocomplete, map previews, and location selection functionality across the entire application.