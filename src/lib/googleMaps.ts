// Google Maps API loader service
// Ensures the API is only loaded once across the entire app

declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader
  private isLoaded = false
  private isLoading = false
  private loadPromise: Promise<void> | null = null
  private callbacks: (() => void)[] = []

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader()
    }
    return GoogleMapsLoader.instance
  }

  async load(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded && window.google && window.google.maps) {
      return Promise.resolve()
    }

    // If currently loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript && window.google && window.google.maps) {
      this.isLoaded = true
      return Promise.resolve()
    }

    // Start loading
    this.isLoading = true
    this.loadPromise = this.loadGoogleMaps()
    
    try {
      await this.loadPromise
      this.isLoaded = true
      this.isLoading = false
      
      // Execute any queued callbacks
      this.callbacks.forEach(callback => callback())
      this.callbacks = []
      
    } catch (error) {
      this.isLoading = false
      this.loadPromise = null
      throw error
    }
  }

  private loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        reject(new Error('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file'))
        return
      }

      // Clean up any existing scripts that might have failed to load
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
      existingScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      })

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`
      script.async = true
      script.defer = true

      // Set up callback
      window.initGoogleMaps = () => {
        if (window.google && window.google.maps) {
          resolve()
        } else {
          reject(new Error('Google Maps API failed to load'))
        }
      }

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API script'))
      }

      document.head.appendChild(script)
    })
  }

  isReady(): boolean {
    return this.isLoaded && window.google && window.google.maps
  }

  onReady(callback: () => void): void {
    if (this.isReady()) {
      callback()
    } else {
      this.callbacks.push(callback)
    }
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance()