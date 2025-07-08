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
      
      console.log('[GoogleMapsLoader] Checking API key availability...')
      
      if (!apiKey) {
        console.error('[GoogleMapsLoader] No API key found in environment variables')
        reject(new Error('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file'))
        return
      }

      console.log('[GoogleMapsLoader] API key found, proceeding with script loading...')

      // Clean up any existing scripts that might have failed to load
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
      console.log(`[GoogleMapsLoader] Found ${existingScripts.length} existing Google Maps scripts, cleaning up...`)
      existingScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      })

      const script = document.createElement('script')
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`
      script.src = scriptUrl
      script.async = true
      script.defer = true

      console.log('[GoogleMapsLoader] Creating script element with URL:', scriptUrl)

      // Set up callback
      window.initGoogleMaps = () => {
        console.log('[GoogleMapsLoader] initGoogleMaps callback triggered')
        console.log('[GoogleMapsLoader] window.google available:', !!window.google)
        console.log('[GoogleMapsLoader] window.google.maps available:', !!window.google?.maps)
        console.log('[GoogleMapsLoader] window.google.maps.places available:', !!window.google?.maps?.places)
        
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('[GoogleMapsLoader] Google Maps API loaded successfully with Places library')
          resolve()
        } else {
          console.error('[GoogleMapsLoader] Google Maps API loaded but missing required components')
          reject(new Error('Google Maps API failed to load completely'))
        }
      }

      script.onerror = (error) => {
        console.error('[GoogleMapsLoader] Script loading error:', error)
        reject(new Error('Failed to load Google Maps API script'))
      }

      console.log('[GoogleMapsLoader] Appending script to document head...')
      document.head.appendChild(script)
    })
  }

  isReady(): boolean {
    const ready = this.isLoaded && window.google && window.google.maps && window.google.maps.places
    console.log('[GoogleMapsLoader] isReady() check:', {
      isLoaded: this.isLoaded,
      hasGoogle: !!window.google,
      hasMaps: !!window.google?.maps,
      hasPlaces: !!window.google?.maps?.places,
      ready
    })
    return ready
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