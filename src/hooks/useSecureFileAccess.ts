import { useState, useEffect, useCallback } from 'react'
import { documentService } from '../lib/database'

interface UseSecureFileAccessProps {
  documentId: string
  autoRefresh?: boolean
  refreshInterval?: number // in minutes
}

export const useSecureFileAccess = ({ 
  documentId, 
  autoRefresh = true, 
  refreshInterval = 30 
}: UseSecureFileAccessProps) => {
  const [secureUrl, setSecureUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshUrl = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get a signed URL that expires in 1 hour
      const url = await documentService.getSecureFileUrl(documentId, 3600)
      setSecureUrl(url)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get secure file URL'
      setError(errorMessage)
      console.error('Failed to get secure file URL:', err)
    } finally {
      setLoading(false)
    }
  }, [documentId])

  // Initial load
  useEffect(() => {
    refreshUrl()
  }, [refreshUrl])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const intervalMs = refreshInterval * 60 * 1000 // convert minutes to milliseconds
    const interval = setInterval(refreshUrl, intervalMs)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshUrl])

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (secureUrl) {
        // URL.revokeObjectURL(secureUrl) // Don't revoke signed URLs
      }
    }
  }, [])

  return {
    secureUrl,
    loading,
    error,
    refreshUrl
  }
}