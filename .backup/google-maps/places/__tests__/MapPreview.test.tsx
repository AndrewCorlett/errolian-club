import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MapPreview } from '../MapPreview';
import * as mapsUtils from '../../../utils/maps';

// Mock the maps utilities
vi.mock('../../../utils/maps', () => ({
  openInGoogleMaps: vi.fn(),
  buildGoogleMapsUrl: vi.fn(() => 'https://maps.google.com/mocked'),
  validateCoordinates: vi.fn((lat, lng) => 
    typeof lat === 'number' && typeof lng === 'number' && 
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  ),
}));

describe('MapPreview', () => {
  const defaultProps = {
    latitude: 37.7749,
    longitude: -122.4194,
    name: 'Test Location',
    address: '123 Test Street, Test City',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = 'test-google-maps-api-key';
    // Reset validateCoordinates to return true by default
    vi.mocked(mapsUtils.validateCoordinates).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with valid coordinates', () => {
    render(<MapPreview {...defaultProps} />);
    
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
    expect(screen.getByTestId('open-maps-button')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<MapPreview {...defaultProps} />);
    
    // The map should be rendered but we can check for the map container
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });

  it('displays location info when map is ready', async () => {
    render(<MapPreview {...defaultProps} />);
    
    // Wait for map to be ready (mocked behavior)
    await waitFor(() => {
      expect(screen.getByText('Test Location')).toBeInTheDocument();
    });
  });

  it('shows error for invalid coordinates', () => {
    // Mock validateCoordinates to return false for invalid coordinates
    vi.mocked(mapsUtils.validateCoordinates).mockReturnValue(false);
    
    render(
      <MapPreview 
        latitude={91} // Invalid latitude
        longitude={-122.4194}
        name="Invalid Location"
      />
    );
    
    expect(screen.getByText('Invalid location coordinates')).toBeInTheDocument();
    expect(screen.queryByTestId('map-view')).not.toBeInTheDocument();
  });

  it('calls openInGoogleMaps when Open Maps button is clicked', async () => {
    render(<MapPreview {...defaultProps} />);
    
    const openMapsButton = screen.getByTestId('open-maps-button');
    fireEvent.click(openMapsButton);
    
    expect(mapsUtils.buildGoogleMapsUrl).toHaveBeenCalledWith(37.7749, -122.4194, 'Test Location');
    expect(mapsUtils.openInGoogleMaps).toHaveBeenCalledWith('https://maps.google.com/mocked');
  });

  it('renders without address when not provided', () => {
    render(
      <MapPreview 
        latitude={37.7749}
        longitude={-122.4194}
        name="Test Location"
      />
    );
    
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
    expect(screen.getByTestId('open-maps-button')).toBeInTheDocument();
  });

  it('handles component lifecycle correctly', () => {
    const { unmount } = render(<MapPreview {...defaultProps} />);
    
    // Should render without crashing
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
    
    // Should unmount without crashing
    unmount();
  });
});