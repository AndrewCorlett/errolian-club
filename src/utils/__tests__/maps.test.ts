import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openInGoogleMaps, buildGoogleMapsUrl, validateCoordinates, formatAddress } from '../maps';

describe('maps utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildGoogleMapsUrl', () => {
    it('builds correct URL with coordinates only', () => {
      const url = buildGoogleMapsUrl(37.7749, -122.4194);
      expect(url).toBe('https://www.google.com/maps/search/37.7749,-122.4194@37.7749,-122.4194,15z');
    });

    it('builds correct URL with coordinates and name', () => {
      const url = buildGoogleMapsUrl(37.7749, -122.4194, 'Test Location');
      expect(url).toBe('https://www.google.com/maps/search/37.7749,-122.4194+(Test%20Location)@37.7749,-122.4194,15z');
    });

    it('properly encodes special characters in name', () => {
      const url = buildGoogleMapsUrl(37.7749, -122.4194, 'Test & Location');
      expect(url).toBe('https://www.google.com/maps/search/37.7749,-122.4194+(Test%20%26%20Location)@37.7749,-122.4194,15z');
    });
  });

  describe('validateCoordinates', () => {
    it('validates correct coordinates', () => {
      expect(validateCoordinates(37.7749, -122.4194)).toBe(true);
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
    });

    it('rejects invalid coordinates', () => {
      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(-91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
      expect(validateCoordinates(0, -181)).toBe(false);
      expect(validateCoordinates(NaN, 0)).toBe(false);
      expect(validateCoordinates(0, NaN)).toBe(false);
    });

    it('rejects non-number types', () => {
      expect(validateCoordinates('37.7749' as any, -122.4194)).toBe(false);
      expect(validateCoordinates(37.7749, '-122.4194' as any)).toBe(false);
    });
  });

  describe('formatAddress', () => {
    it('trims whitespace', () => {
      expect(formatAddress('  123 Main St  ')).toBe('123 Main St');
    });

    it('normalizes multiple spaces', () => {
      expect(formatAddress('123  Main   St')).toBe('123 Main St');
    });

    it('handles empty string', () => {
      expect(formatAddress('')).toBe('');
    });
  });

  describe('openInGoogleMaps', () => {
    it('opens URL in new tab when window is available', async () => {
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', { value: mockOpen, writable: true });

      await openInGoogleMaps('https://maps.google.com/test');

      expect(mockOpen).toHaveBeenCalledWith('https://maps.google.com/test', '_blank');
    });

    it('handles error when window is not available', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Temporarily remove window
      const originalWindow = global.window;
      delete (global as any).window;

      await openInGoogleMaps('https://maps.google.com/test');

      expect(consoleSpy).toHaveBeenCalledWith('[Maps] Window object not available');

      // Restore window
      global.window = originalWindow;
      consoleSpy.mockRestore();
    });
  });
});