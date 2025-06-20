import React from 'react';
import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import type { Document } from '@/types/documents';
import SignatureOverlay from './SignatureOverlay';

interface SignatureField {
  id: string
  x: number
  y: number
  width: number
  height: number
  signedBy?: string
  signatureData?: string
  required: boolean
}

interface PDFViewerProps {
  url: string
  document?: Document
  showSignatures?: boolean
  isEditingSignatures?: boolean
  onSignatureFieldsChange?: (fields: SignatureField[]) => void
  onSign?: (fieldId: string, signatureData: string) => void
  className?: string
}

export default function PDFViewer({ 
  url, 
  document,
  showSignatures = false,
  isEditingSignatures = false,
  onSignatureFieldsChange,
  onSign,
  className = '' 
}: PDFViewerProps) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [debugInfo, setDebugInfo] = React.useState<any>(null)
  const [hasError, setHasError] = React.useState(false)
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null)
  
  console.log('PDFViewer: Initial URL:', url)
  
  // Generate signed URL from the provided URL
  React.useEffect(() => {
    let cancelled = false
    
    const generateSignedUrl = async () => {
      try {
        // Only generate if URL is not already a time-limited signed URL
        if (!url?.includes('token=') && !url?.includes('sign/')) {
          console.log('PDFViewer: Generating signed URL for:', url)
          
          // Extract storage path from various URL formats
          let storagePath = ''
          
          // Handle public URL format: /storage/v1/object/public/documents/{path}
          const publicMatch = url.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/)
          if (publicMatch) {
            storagePath = publicMatch[1]
            console.log('PDFViewer: Extracted path from public URL:', storagePath)
          }
          // Handle direct storage path
          else if (!url.startsWith('http')) {
            storagePath = url
            console.log('PDFViewer: Using direct storage path:', storagePath)
          }
          // Handle other URL formats or already signed URLs
          else {
            console.log('PDFViewer: URL appears to be already signed or unknown format, using as-is')
            if (!cancelled) setSignedUrl(url)
            return
          }
          
          if (storagePath) {
            const { fileStorage } = await import('@/lib/fileStorage')
            const newSignedUrl = await fileStorage.createSignedUrl(storagePath, 3600)
            console.log('PDFViewer: Generated signed URL successfully')
            if (!cancelled) setSignedUrl(newSignedUrl)
          } else {
            console.warn('PDFViewer: Could not extract storage path from URL:', url)
            if (!cancelled) setSignedUrl(url)
          }
        } else {
          console.log('PDFViewer: URL already appears to be signed, using as-is')
          if (!cancelled) setSignedUrl(url)
        }
      } catch (error) {
        console.error('PDFViewer: Failed to generate signed URL:', error)
        // Fallback to original URL
        if (!cancelled) setSignedUrl(url)
      }
    }
    
    if (url) {
      generateSignedUrl()
    }
    
    return () => { cancelled = true }
  }, [url]) // Only depends on original URL
  
  console.log('PDFViewer: Final signed URL:', signedUrl)
  
  // Simple error detection based on URL fetch (only when we have signedUrl)
  React.useEffect(() => {
    if (!signedUrl) return
    
    const testAccess = async () => {
      try {
        const response = await fetch(signedUrl, { method: 'HEAD' })
        if (!response.ok) {
          console.error('PDFViewer: URL not accessible:', response.status, response.statusText)
          setHasError(true)
          setDebugInfo({
            url: signedUrl,
            error: `${response.status} ${response.statusText}`,
            contentType: response.headers.get('content-type')
          })
        } else {
          console.log('PDFViewer: URL accessible, content-type:', response.headers.get('content-type'))
          setHasError(false)
          setDebugInfo(null)
        }
      } catch (error) {
        console.error('PDFViewer: Failed to test URL access:', error)
        setHasError(true)
        setDebugInfo({ 
          url: signedUrl,
          error: error instanceof Error ? error.message : 'Network error' 
        })
      }
    }
    
    testAccess()
  }, [signedUrl])
  
  // Show loading spinner while generating signed URL
  if (!signedUrl) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-center h-full bg-gray-50 border border-gray-200 rounded">
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600">Loading PDF...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Debug Info Display */}
      {debugInfo && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-100 border border-yellow-300 rounded p-2 text-xs max-w-md">
          <div className="font-bold">PDF Debug Info:</div>
          <div>URL: {debugInfo.url?.substring(0, 80)}...</div>
          <div>Content-Type: {debugInfo.contentType || 'None'}</div>
          {debugInfo.error && <div className="text-red-600">Error: {debugInfo.error}</div>}
        </div>
      )}
      
      {hasError ? (
        <div className="flex items-center justify-center h-full bg-red-50 border border-red-200 rounded">
          <div className="text-center p-4">
            <div className="text-red-600 font-medium">PDF Loading Error</div>
            <div className="text-sm text-red-500 mt-2">
              The document could not be loaded. Please check the file exists and is accessible.
            </div>
            {debugInfo?.error && (
              <div className="text-xs text-gray-600 mt-1">
                Error: {debugInfo.error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <Viewer
          fileUrl={signedUrl}
          plugins={[defaultLayoutPluginInstance]}
        />
      )}
      
      {/* Signature Overlay Integration */}
      {showSignatures && document && !hasError && (
        <SignatureOverlay
          document={document}
          isEditing={isEditingSignatures}
          onFieldsChange={onSignatureFieldsChange}
          onSign={onSign}
          className="absolute inset-0"
        />
      )}
    </div>
  );
}