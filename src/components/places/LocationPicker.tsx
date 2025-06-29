import React, { useState } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import { MapPreview } from './MapPreview';
import { Place } from '../../types/places';

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