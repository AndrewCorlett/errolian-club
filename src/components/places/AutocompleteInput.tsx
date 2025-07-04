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