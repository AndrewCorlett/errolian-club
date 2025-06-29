import React, { useState, useEffect, useRef } from 'react';
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
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Validate coordinates
  const coordsValid = validateCoordinates(latitude, longitude);

  useEffect(() => {
    if (!coordsValid) {
      setMapError('Invalid coordinates provided');
      return;
    }

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => setMapError('Failed to load Google Maps');
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      // Cleanup marker when component unmounts
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [latitude, longitude, coordsValid]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      const center = { lat: latitude, lng: longitude };
      
      // Initialize map
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: true,
        rotateControl: false,
        fullscreenControl: true,
      });

      googleMapRef.current = map;

      // Add marker
      const marker = new google.maps.Marker({
        position: center,
        map,
        title: name,
        animation: google.maps.Animation.DROP,
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