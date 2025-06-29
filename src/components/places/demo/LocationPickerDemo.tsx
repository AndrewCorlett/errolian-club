import React, { useState } from 'react';
import { LocationPicker } from '../LocationPicker';
import type { Place } from '../../../types/places';

/**
 * Demo component showing how to use the Google Maps Places Autocomplete
 * and Map Preview functionality
 */
export const LocationPickerDemo: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Place | null>(null);

  const handleLocationSelected = (place: Place) => {
    console.log('Location selected in demo:', place);
    setSelectedLocation(place);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Google Maps Integration Demo
        </h1>
        <p className="text-gray-600">
          Search for a location and see it on the map
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Location Picker
        </h2>
        <LocationPicker
          onLocationSelected={handleLocationSelected}
          placeholder="Search for restaurants, venues, addresses..."
          className="w-full"
        />
      </div>

      {selectedLocation && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Selected Location Details
          </h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {selectedLocation.name}</p>
            <p><span className="font-medium">Address:</span> {selectedLocation.address}</p>
            <p>
              <span className="font-medium">Coordinates:</span> 
              {selectedLocation.coordinates.latitude}, {selectedLocation.coordinates.longitude}
            </p>
            {selectedLocation.website && (
              <p>
                <span className="font-medium">Website:</span> 
                <a 
                  href={selectedLocation.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 ml-1"
                >
                  {selectedLocation.website}
                </a>
              </p>
            )}
            {selectedLocation.phoneNumber && (
              <p><span className="font-medium">Phone:</span> {selectedLocation.phoneNumber}</p>
            )}
            <p>
              <span className="font-medium">Maps URL:</span> 
              <a 
                href={selectedLocation.mapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                Open in Google Maps
              </a>
            </p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Features Demonstrated:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ Google Places Autocomplete with live search</li>
          <li>✅ Interactive map preview with markers</li>
          <li>✅ Deep linking to Google Maps app</li>
          <li>✅ Place details extraction (name, address, coordinates, etc.)</li>
          <li>✅ Error handling for invalid locations</li>
          <li>✅ Responsive design with Tailwind CSS</li>
          <li>✅ TypeScript support with proper type safety</li>
          <li>✅ Comprehensive unit test coverage</li>
        </ul>
      </div>

      <div className="bg-yellow-50 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">Usage Notes:</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Requires Google Maps API key in environment variables</li>
          <li>• Billing must be enabled on Google Cloud Console</li>
          <li>• Places API and Maps JavaScript API must be enabled</li>
          <li>• Works in web browsers (not React Native)</li>
        </ul>
      </div>
    </div>
  );
};