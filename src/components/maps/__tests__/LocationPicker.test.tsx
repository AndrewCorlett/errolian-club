import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LocationPicker from '../LocationPicker'

// Mock Google Maps API
const mockAutocomplete = {
  addListener: vi.fn(),
  getPlace: vi.fn(),
  setFields: vi.fn()
}

const mockMaps = {
  places: {
    Autocomplete: vi.fn(() => mockAutocomplete)
  },
  event: {
    clearInstanceListeners: vi.fn()
  },
  Map: vi.fn(),
  Marker: vi.fn(),
  Geocoder: vi.fn()
}

// Mock the Google Maps loader
vi.mock('@/lib/googleMaps', () => ({
  googleMapsLoader: {
    load: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
    onReady: vi.fn()
  }
}))

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks()
  
  // Set up global window.google
  global.window.google = {
    maps: mockMaps
  }
})

describe('LocationPicker', () => {
  const mockOnChange = vi.fn()
  const defaultProps = {
    onChange: mockOnChange,
    placeholder: 'Search for a location...'
  }

  it('renders input field', () => {
    render(<LocationPicker {...defaultProps} />)
    
    expect(screen.getByPlaceholderText('Search for a location...')).toBeInTheDocument()
  })

  it('initializes Google Maps autocomplete when loaded', async () => {
    render(<LocationPicker {...defaultProps} />)
    
    await waitFor(() => {
      expect(mockMaps.places.Autocomplete).toHaveBeenCalled()
    })
    
    expect(mockAutocomplete.addListener).toHaveBeenCalledWith('place_changed', expect.any(Function))
  })

  it('handles place selection correctly', async () => {
    const mockPlace = {
      formatted_address: '123 Test Street, Test City',
      geometry: {
        location: {
          lat: () => -33.8688,
          lng: () => 151.2093
        }
      },
      place_id: 'test-place-id'
    }

    mockAutocomplete.getPlace.mockReturnValue(mockPlace)

    render(<LocationPicker {...defaultProps} />)

    await waitFor(() => {
      expect(mockMaps.places.Autocomplete).toHaveBeenCalled()
    })

    // Simulate place selection
    const placeChangedCallback = mockAutocomplete.addListener.mock.calls[0][1]
    placeChangedCallback()

    expect(mockOnChange).toHaveBeenCalledWith({
      address: '123 Test Street, Test City',
      lat: -33.8688,
      lng: 151.2093,
      placeId: 'test-place-id'
    })
  })

  it('shows clear button when location is selected', () => {
    const locationValue = {
      address: '123 Test Street',
      lat: -33.8688,
      lng: 151.2093
    }

    render(<LocationPicker {...defaultProps} value={locationValue} />)
    
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('clears location when clear button is clicked', () => {
    const locationValue = {
      address: '123 Test Street',
      lat: -33.8688,
      lng: 151.2093
    }

    render(<LocationPicker {...defaultProps} value={locationValue} />)
    
    const clearButton = screen.getByText('Clear')
    fireEvent.click(clearButton)
    
    expect(mockOnChange).toHaveBeenCalledWith(null)
  })

  it('displays selected location information', () => {
    const locationValue = {
      address: '123 Test Street, Test City',
      lat: -33.8688,
      lng: 151.2093
    }

    render(<LocationPicker {...defaultProps} value={locationValue} />)
    
    expect(screen.getByText('Selected Location')).toBeInTheDocument()
    expect(screen.getByText('123 Test Street, Test City')).toBeInTheDocument()
  })

  it('logs debug information', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    render(<LocationPicker {...defaultProps} />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '[LocationPicker] Autocomplete effect triggered:',
        expect.any(Object)
      )
    })
    
    consoleSpy.mockRestore()
  })
})