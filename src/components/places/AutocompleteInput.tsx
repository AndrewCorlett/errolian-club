import React, { useRef, useEffect, useState } from 'react';
import { googleMapsLoader } from '@/lib/googleMaps';
import type { Place, AutocompleteInputProps } from '../../types/places';

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ 
  onPlaceSelected, 
  placeholder = "Search for a location" 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await googleMapsLoader.load();
        
        if (inputRef.current) {
          // Initialize the autocomplete
          autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            fields: ['place_id', 'name', 'formatted_address', 'geometry', 'url', 'website', 'formatted_phone_number'],
            types: ['establishment', 'geocode']
          });

          // Add place change listener
          autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('[AutocompleteInput] Failed to load Google Maps API:', error);
        setError('Failed to load Google Maps. Please check your API key and internet connection.');
      }
    };

    if (googleMapsLoader.isReady()) {
      // Already loaded, initialize immediately
      if (inputRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['place_id', 'name', 'formatted_address', 'geometry', 'url', 'website', 'formatted_phone_number'],
          types: ['establishment', 'geocode']
        });
        autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
        setIsLoaded(true);
      }
    } else {
      initializeAutocomplete();
    }

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current);
      }
    };
  }, []);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    
    if (!place || !place.geometry || !place.geometry.location) {
      console.error('[AutocompleteInput] No valid place data received');
      return;
    }

    try {
      const location = place.geometry.location;
      const placeData: Place = {
        id: place.place_id || '',
        name: place.name || '',
        address: place.formatted_address || '',
        coordinates: {
          latitude: location.lat(),
          longitude: location.lng(),
        },
        mapsUrl: place.url || '',
        website: place.website,
        phoneNumber: place.formatted_phone_number,
      };

      console.log('[AutocompleteInput] Place selected:', placeData);
      onPlaceSelected(placeData);
    } catch (error) {
      console.error('[AutocompleteInput] Error processing place data:', error);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        data-testid="places-search-input"
        disabled={!isLoaded}
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};