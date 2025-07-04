/**
 * Utility functions for Google Maps integration and deep linking
 */

/**
 * Opens a URL in the external browser or app
 * @param url - The URL to open
 */
export const openInGoogleMaps = async (url: string): Promise<void> => {
  try {
    // For web, we'll open in a new tab
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      console.error('[Maps] Window object not available');
    }
  } catch (error) {
    console.error('[Maps] Error opening URL:', error);
  }
};

/**
 * Builds a Google Maps URL for the given coordinates
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param name - Optional place name for the marker
 * @returns Google Maps URL
 */
export const buildGoogleMapsUrl = (
  latitude: number, 
  longitude: number, 
  name?: string
): string => {
  const baseUrl = 'https://www.google.com/maps/search/';
  const coords = `${latitude},${longitude}`;
  const label = name ? encodeURIComponent(name) : '';
  
  // For web, use the standard Google Maps URL
  return `${baseUrl}${coords}${label ? `+(${label})` : ''}@${coords},15z`;
};

/**
 * Validates coordinates
 * @param latitude - Latitude to validate
 * @param longitude - Longitude to validate
 * @returns True if coordinates are valid
 */
export const validateCoordinates = (latitude: number, longitude: number): boolean => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
};

/**
 * Formats an address for display
 * @param address - Raw address string
 * @returns Formatted address
 */
export const formatAddress = (address: string): string => {
  return address.trim().replace(/\s+/g, ' ');
};