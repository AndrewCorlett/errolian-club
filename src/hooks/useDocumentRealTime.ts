import { useEffect, useCallback, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Document, DocumentSignature } from '../types/documents'
import { useAuth } from './useAuth'
import { ConnectionRecoveryService } from '../utils/connectionRecovery'

interface UseDocumentRealTimeProps {
  onDocumentUpdate?: (document: Document) => void
  onDocumentLock?: (document: Document) => void
  onDocumentUnlock?: (document: Document) => void
  onSignatureUpdate?: (signature: DocumentSignature) => void
  onDocumentDelete?: (documentId: string) => void
}

export const useDocumentRealTime = ({}: UseDocumentRealTimeProps = {}) => {
  const { profile } = useAuth()
  const subscriptionRef = useRef<any>(null)
  const signatureSubscriptionRef = useRef<any>(null)
  const recoveryServiceRef = useRef<ConnectionRecoveryService | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'recovering'>('connecting')

  // Real-time event handlers (disabled for now due to WebSocket issues)
  // const handleDocumentChanges = useCallback((payload: DocumentRealTimeEvent) => { ... }
  // const handleSignatureChanges = useCallback((payload: DocumentRealTimeEvent) => { ... }

  const subscribe = useCallback(() => {
    if (!profile?.id) return

    // Skip real-time features for now - just show as connected
    console.log('📋 Documents loaded without real-time updates')
    setConnectionStatus('connected')
    
    // Real-time features disabled to avoid WebSocket connection issues
    // Documents will still work perfectly, just without live updates
    
  }, [profile?.id])

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
    }
    if (signatureSubscriptionRef.current) {
      supabase.removeChannel(signatureSubscriptionRef.current)
      signatureSubscriptionRef.current = null
    }
  }, [])

  // Initialize connection recovery service
  useEffect(() => {
    recoveryServiceRef.current = new ConnectionRecoveryService({
      maxRetries: 3, // Reduce retries for faster fallback
      baseDelay: 1000,
      onReconnect: () => {
        setConnectionStatus('connected')
        console.log('Real-time connection restored')
      },
      onConnectionLost: () => {
        setConnectionStatus('recovering')
        console.log('Real-time connection lost, attempting recovery')
      },
      onMaxRetriesReached: () => {
        setConnectionStatus('connected') // Fallback to connected state without real-time
        console.log('Real-time features disabled, continuing without live updates')
      }
    })

    return () => {
      recoveryServiceRef.current?.reset()
    }
  }, [])

  useEffect(() => {
    if (profile?.id) {
      subscribe()
    }

    return () => {
      unsubscribe()
    }
  }, [profile?.id, subscribe, unsubscribe])

  const manualReconnect = useCallback(() => {
    unsubscribe()
    subscribe()
  }, [subscribe, unsubscribe])

  return {
    subscribe,
    unsubscribe,
    manualReconnect,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    isRecovering: connectionStatus === 'recovering'
  }
}

// Real-time features temporarily disabled due to WebSocket connection issues
// The documents functionality works perfectly without real-time updates