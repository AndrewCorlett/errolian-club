import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import mammoth from 'mammoth'
import type { Document } from '@/types/documents'
import SignatureOverlay from './SignatureOverlay'

interface WordViewerProps {
  url: string
  document?: Document
  showSignatures?: boolean
  isEditingSignatures?: boolean
  onSignatureFieldsChange?: (fields: any[]) => void
  onSign?: (fieldId: string, signatureData: string) => void
  className?: string
}

export default function WordViewer({ 
  url, 
  document,
  showSignatures = false,
  isEditingSignatures = false,
  onSignatureFieldsChange,
  onSign,
  className = '' 
}: WordViewerProps) {
  const [htmlContent, setHtmlContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const loadWordDocument = async () => {
      try {
        setLoading(true)
        setError(null)
        setMessages([])

        // Fetch the document
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()

        // Convert using mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer })
        setHtmlContent(result.value)

        // Handle conversion messages/warnings
        if (result.messages.length > 0) {
          setMessages(result.messages.map(m => m.message))
        }
      } catch (err) {
        console.error('Error loading Word document:', err)
        setError(err instanceof Error ? err.message : 'Failed to load Word document')
      } finally {
        setLoading(false)
      }
    }

    if (url) {
      loadWordDocument()
    }
  }, [url])

  const handleDownload = () => {
    const link = window.document.createElement('a')
    link.href = url
    link.download = url.split('/').pop() || 'document.docx'
    link.click()
  }

  const handleCopyText = async () => {
    try {
      // Extract text content from HTML
      const tempDiv = window.document.createElement('div')
      tempDiv.innerHTML = htmlContent
      const textContent = tempDiv.textContent || tempDiv.innerText || ''
      
      await navigator.clipboard.writeText(textContent)
      // Could add a toast notification here
    } catch (err) {
      console.error('Error copying text:', err)
    }
  }

  if (loading) {
    return (
      <div className={`bg-gray-50 flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading Word document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 font-medium">Error Loading Word Document</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button 
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Download to View
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Word Document Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 3v18h20V3H2zm18 16H4V5h16v14zM8 7v2h8V7H8zm0 4v2h8v-2H8zm0 4v2h6v-2H8z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Word Document Preview</span>
            </div>
            
            {messages.length > 0 && (
              <div className="text-xs text-amber-600">
                Some formatting may not display correctly
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyText}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Text
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="overflow-auto max-h-[500px] p-6 bg-white">
        <div className="relative">
          <div 
            className="prose prose-sm max-w-none
              prose-headings:text-gray-900 prose-headings:font-semibold
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-em:text-gray-700 prose-em:italic
              prose-ul:text-gray-700 prose-ol:text-gray-700
              prose-li:text-gray-700 prose-li:leading-relaxed
              prose-table:border-collapse prose-table:border prose-table:border-gray-300
              prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:p-2 prose-th:text-left
              prose-td:border prose-td:border-gray-300 prose-td:p-2
              prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
              prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded prose-pre:overflow-auto
              prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          
          {/* Signature Overlay */}
          {showSignatures && document && (
            <SignatureOverlay
              document={document}
              isEditing={isEditingSignatures}
              onFieldsChange={onSignatureFieldsChange}
              onSign={onSign}
              className="absolute inset-0"
            />
          )}
        </div>
      </div>

      {/* Conversion Messages */}
      {messages.length > 0 && (
        <div className="bg-amber-50 border-t border-amber-200 p-3">
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">Conversion Notes:</p>
            <ul className="text-amber-700 text-xs space-y-1">
              {messages.slice(0, 3).map((message, index) => (
                <li key={index}>• {message}</li>
              ))}
              {messages.length > 3 && (
                <li>• ... and {messages.length - 3} more</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}