import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Set environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.VITE_GOOGLE_MAPS_API_KEY = 'test-google-maps-api-key'

// Polyfill crypto.getRandomValues for web environment
if (!globalThis.crypto) {
  globalThis.crypto = {} as Crypto;
}
if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = (arr: any) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  };
}

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  },
  writable: true
})

// Mock crypto for random generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: any[]) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  }
})

// Mock Google Maps API
const createMockMap = () => ({
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  addListener: vi.fn(),
  panTo: vi.fn(),
  getZoom: vi.fn(() => 10),
  getCenter: vi.fn(() => ({ lat: () => 0, lng: () => 0 })),
})

const createMockMarker = () => ({
  setPosition: vi.fn(),
  setMap: vi.fn(),
  addListener: vi.fn(),
  setTitle: vi.fn(),
  setIcon: vi.fn(),
})

const createMockAutocomplete = () => ({
  addListener: vi.fn(),
  getPlace: vi.fn(() => ({
    place_id: 'test-place-id',
    name: 'Test Location',
    formatted_address: '123 Test Street, Test City',
    geometry: {
      location: {
        lat: () => 37.7749,
        lng: () => -122.4194,
      },
    },
    url: 'https://maps.google.com/test',
    website: 'https://test.com',
    formatted_phone_number: '(555) 123-4567',
  })),
})

Object.defineProperty(global, 'google', {
  value: {
    maps: {
      Map: vi.fn().mockImplementation(() => createMockMap()),
      Marker: vi.fn().mockImplementation(() => createMockMarker()),
      InfoWindow: vi.fn().mockImplementation(() => ({
        open: vi.fn(),
        close: vi.fn(),
        setContent: vi.fn(),
      })),
      places: {
        Autocomplete: vi.fn().mockImplementation(() => createMockAutocomplete()),
      },
      MapTypeId: {
        ROADMAP: 'roadmap',
        SATELLITE: 'satellite',
        HYBRID: 'hybrid',
        TERRAIN: 'terrain',
      },
      Animation: {
        DROP: 'drop',
        BOUNCE: 'bounce',
      },
      event: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        clearInstanceListeners: vi.fn(),
      },
    },
  },
  writable: true,
})

// Mock @googlemaps/js-api-loader
vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(true),
  })),
}))

// Mock window.open for Google Maps links
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
})