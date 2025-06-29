export interface Place {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  mapsUrl: string;
  website?: string;
  phoneNumber?: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  url: string;
  website?: string;
  formatted_phone_number?: string;
}

export interface AutocompleteInputProps {
  onPlaceSelected: (place: Place) => void;
  placeholder?: string;
}

export interface MapPreviewProps {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
}