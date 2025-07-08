import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AutocompleteInput } from '../AutocompleteInput';
import { Loader } from '@googlemaps/js-api-loader';

describe('AutocompleteInput', () => {
  const mockOnPlaceSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure API key is available in tests
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = 'test-google-maps-api-key';
  });

  it('renders correctly with default placeholder', () => {
    render(<AutocompleteInput onPlaceSelected={mockOnPlaceSelected} />);
    
    expect(screen.getByTestId('places-search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for a location')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <AutocompleteInput 
        onPlaceSelected={mockOnPlaceSelected} 
        placeholder="Find a venue..." 
      />
    );
    
    expect(screen.getByPlaceholderText('Find a venue...')).toBeInTheDocument();
  });

  it('shows error message when API key is missing', async () => {
    // Remove API key
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = '';
    
    render(<AutocompleteInput onPlaceSelected={mockOnPlaceSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Google Maps API key not found/)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<AutocompleteInput onPlaceSelected={mockOnPlaceSelected} />);
    
    const input = screen.getByTestId('places-search-input');
    expect(input).toBeDisabled();
  });

  it('loads Google Maps API on mount', async () => {
    render(<AutocompleteInput onPlaceSelected={mockOnPlaceSelected} />);
    
    await waitFor(() => {
      expect(Loader).toHaveBeenCalledWith({
        apiKey: 'test-google-maps-api-key',
        version: 'weekly',
        libraries: ['places']
      });
    });
  });
});