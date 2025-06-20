import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import * as pdfjsLib from 'pdfjs-dist'
import type { Document } from '@/types/documents'
import SignatureOverlay from './SignatureOverlay'

// Configure PDF.js worker - use local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString()

interface PDFViewerProps {
  url: string
  document?: Document
  showSignatures?: boolean
  isEditingSignatures?: boolean
  onSignatureFieldsChange?: (fields: any[]) => void
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true)
        setError(null)
        const loadingTask = pdfjsLib.getDocument(url)
        const pdfDoc = await loadingTask.promise
        setPdf(pdfDoc)
        setTotalPages(pdfDoc.numPages)
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError('Failed to load PDF document')
      } finally {
        setLoading(false)
      }
    }

    if (url) {
      loadPDF()
    }
  }, [url])

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current) return

      try {
        const page = await pdf.getPage(currentPage)
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        
        if (!context) return

        const viewport = page.getViewport({ scale })
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await page.render(renderContext).promise
      } catch (err) {
        console.error('Error rendering page:', err)
        setError('Failed to render PDF page')
      }
    }

    renderPage()
  }, [pdf, currentPage, scale])

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.25, 3.0))
  }

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.25, 0.5))
  }

  const handleFitToWidth = () => {
    // Calculate scale to fit canvas width to container
    if (canvasRef.current) {
      const containerWidth = canvasRef.current.parentElement?.clientWidth || 800
      setScale(containerWidth / 595) // 595 is standard PDF page width
    }
  }

  const handleSearch = async () => {
    if (!pdf || !searchText.trim()) return

    setIsSearching(true)
    try {
      // Simple text search - iterate through pages
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const textItems = textContent.items as any[]
        
        const pageText = textItems.map(item => item.str).join(' ')
        if (pageText.toLowerCase().includes(searchText.toLowerCase())) {
          setCurrentPage(pageNum)
          break
        }
      }
    } catch (err) {
      console.error('Error searching PDF:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCopyText = async () => {
    if (!pdf) return

    try {
      const page = await pdf.getPage(currentPage)
      const textContent = await page.getTextContent()
      const textItems = textContent.items as any[]
      const pageText = textItems.map(item => item.str).join(' ')
      
      await navigator.clipboard.writeText(pageText)
      // Could add a toast notification here
    } catch (err) {
      console.error('Error copying text:', err)
    }
  }

  if (loading) {
    return (
      <div className={`bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading PDF...</p>
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
          <p className="text-red-800 font-medium">Error Loading PDF</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* PDF Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between gap-4">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            
            <span className="text-sm text-gray-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </Button>
            
            <span className="text-sm text-gray-600 px-2 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={scale >= 3.0}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleFitToWidth}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </Button>
          </div>

          {/* Search and Copy Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Search text..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm px-2 py-1 border border-gray-300 rounded w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearch}
                disabled={!searchText.trim() || isSearching}
              >
                {isSearching ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </Button>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleCopyText}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="overflow-auto max-h-[500px] flex justify-center p-4 bg-gray-100">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="shadow-lg border border-gray-300 bg-white"
            style={{ maxWidth: '100%', height: 'auto' }}
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
    </div>
  )
}