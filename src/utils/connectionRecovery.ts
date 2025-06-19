/**
 * Connection Recovery Service
 * Handles real-time connection failures and automatic recovery
 */

interface ConnectionRecoveryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  onReconnect?: () => void
  onMaxRetriesReached?: () => void
  onConnectionLost?: () => void
}

export class ConnectionRecoveryService {
  private retryCount = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private isReconnecting = false
  
  constructor(private options: ConnectionRecoveryOptions = {}) {
    this.options = {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      ...options
    }
  }

  /**
   * Handle connection loss and start recovery process
   */
  handleConnectionLoss(): void {
    if (this.isReconnecting) return
    
    console.warn('🔌 Real-time connection lost, starting recovery...')
    this.options.onConnectionLost?.()
    this.startReconnectionProcess()
  }

  /**
   * Handle successful reconnection
   */
  handleReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.retryCount = 0
    this.isReconnecting = false
    
    console.log('✅ Real-time connection restored')
    this.options.onReconnect?.()
  }

  /**
   * Start the exponential backoff reconnection process
   */
  private startReconnectionProcess(): void {
    if (this.retryCount >= (this.options.maxRetries || 5)) {
      console.error('❌ Max reconnection attempts reached')
      this.options.onMaxRetriesReached?.()
      return
    }

    this.isReconnecting = true
    this.retryCount++

    const delay = this.calculateDelay()
    console.log(`🔄 Reconnection attempt ${this.retryCount} in ${delay}ms`)

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnection()
    }, delay)
  }

  /**
   * Calculate delay using exponential backoff
   */
  private calculateDelay(): number {
    const { baseDelay = 1000, maxDelay = 30000, backoffMultiplier = 2 } = this.options
    
    const delay = baseDelay * Math.pow(backoffMultiplier, this.retryCount - 1)
    return Math.min(delay, maxDelay)
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnection(): void {
    // Check if browser is online
    if (!navigator.onLine) {
      console.warn('📴 Browser is offline, waiting for network...')
      // Wait for online event
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline)
        this.attemptReconnection()
      }
      window.addEventListener('online', handleOnline)
      return
    }

    // Try to reconnect (this would be implemented by the caller)
    console.log(`🔄 Attempting reconnection ${this.retryCount}/${this.options.maxRetries}`)
    
    // Start next retry cycle if this attempt fails
    // The actual reconnection logic should call either:
    // - this.handleReconnection() on success
    // - this.startReconnectionProcess() on failure
  }

  /**
   * Reset the recovery state
   */
  reset(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.retryCount = 0
    this.isReconnecting = false
  }

  /**
   * Check if currently attempting to reconnect
   */
  get isRecovering(): boolean {
    return this.isReconnecting
  }

  /**
   * Get current retry count
   */
  get currentRetryCount(): number {
    return this.retryCount
  }

  /**
   * Get maximum retry count
   */
  get maxRetries(): number {
    return this.options.maxRetries || 5
  }
}

/**
 * Network status monitor
 */
export class NetworkStatusMonitor {
  private listeners: Array<(isOnline: boolean) => void> = []
  private isMonitoring = false

  constructor() {
    this.handleOnline = this.handleOnline.bind(this)
    this.handleOffline = this.handleOffline.bind(this)
  }

  /**
   * Start monitoring network status
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
    this.isMonitoring = true
  }

  /**
   * Stop monitoring network status
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this.isMonitoring = false
  }

  /**
   * Add listener for network status changes
   */
  addListener(listener: (isOnline: boolean) => void): void {
    this.listeners.push(listener)
  }

  /**
   * Remove listener for network status changes
   */
  removeListener(listener: (isOnline: boolean) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * Get current network status
   */
  get isOnline(): boolean {
    return navigator.onLine
  }

  private handleOnline(): void {
    console.log('🌐 Network connection restored')
    this.notifyListeners(true)
  }

  private handleOffline(): void {
    console.log('📴 Network connection lost')
    this.notifyListeners(false)
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline)
      } catch (error) {
        console.error('Error in network status listener:', error)
      }
    })
  }
}

// Global instances
export const connectionRecovery = new ConnectionRecoveryService()
export const networkMonitor = new NetworkStatusMonitor()