/**
 * Unit tests for PDFViewer Component (React PDF Viewer)
 * Tests basic rendering, props handling, and signature integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PDFViewer from '../PDFViewer'
import type { Document } from '@/types/documents'

// Mock React PDF Viewer components
vi.mock('@react-pdf-viewer/core', () => ({
  Viewer: ({ fileUrl, plugins }: { fileUrl: string; plugins: any[] }) => (
    <div data-testid="pdf-viewer" data-file-url={fileUrl} data-plugins-count={plugins.length}>
      PDF Viewer Mock
    </div>
  )
}))

vi.mock('@react-pdf-viewer/default-layout', () => ({
  defaultLayoutPlugin: () => ({ name: 'defaultLayoutPlugin' })
}))

// Mock SignatureOverlay component
vi.mock('../SignatureOverlay', () => ({
  default: ({ document, isEditing, className }: any) => (
    <div 
      data-testid="signature-overlay" 
      data-document-id={document?.id}
      data-editing={isEditing}
      className={className}
    >
      Signature Overlay Mock
    </div>
  )
}))

// Mock CSS imports
vi.mock('@react-pdf-viewer/core/lib/styles/index.css', () => ({}))
vi.mock('@react-pdf-viewer/default-layout/lib/styles/index.css', () => ({}))

describe('PDFViewer', () => {
  const mockDocument: Document = {
    id: 'doc-123',
    name: 'test.pdf',
    type: 'pdf',
    url: '/test.pdf',
    size: 1024,
    mimeType: 'application/pdf',
    uploadedBy: 'user-123',
    uploadedAt: new Date(),
    updatedAt: new Date(),
    folderId: undefined,
    isPublic: true,
    isLocked: false,
    lockedBy: undefined,
    lockedAt: undefined,
    version: 1,
    status: 'approved',
    approvedBy: undefined,
    approvedAt: undefined,
    rejectedReason: undefined,
    downloadCount: 0,
    description: undefined,
    tags: [],
    requiresSignatures: false,
    signatures: []
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders with required props only', () => {
      render(<PDFViewer url="/test.pdf" />)
      
      const viewer = screen.getByTestId('pdf-viewer')
      expect(viewer).toBeInTheDocument()
      expect(viewer).toHaveAttribute('data-file-url', '/test.pdf')
      expect(viewer).toHaveAttribute('data-plugins-count', '1')
    })

    it('applies custom className correctly', () => {
      const { container } = render(
        <PDFViewer url="/test.pdf" className="custom-class" />
      )
      
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('relative', 'custom-class')
    })

    it('passes file URL to Viewer component', () => {
      render(<PDFViewer url="/custom/path.pdf" />)
      
      const viewer = screen.getByTestId('pdf-viewer')
      expect(viewer).toHaveAttribute('data-file-url', '/custom/path.pdf')
    })
  })

  describe('Signature Integration', () => {
    it('does not render SignatureOverlay when showSignatures is false', () => {
      render(
        <PDFViewer 
          url="/test.pdf" 
          document={mockDocument}
          showSignatures={false}
        />
      )
      
      expect(screen.queryByTestId('signature-overlay')).not.toBeInTheDocument()
    })

    it('does not render SignatureOverlay when document is not provided', () => {
      render(
        <PDFViewer 
          url="/test.pdf" 
          showSignatures={true}
        />
      )
      
      expect(screen.queryByTestId('signature-overlay')).not.toBeInTheDocument()
    })

    it('renders SignatureOverlay when showSignatures is true and document is provided', () => {
      render(
        <PDFViewer 
          url="/test.pdf" 
          document={mockDocument}
          showSignatures={true}
        />
      )
      
      const overlay = screen.getByTestId('signature-overlay')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveAttribute('data-document-id', 'doc-123')
      expect(overlay).toHaveClass('absolute', 'inset-0')
    })

    it('passes isEditingSignatures prop to SignatureOverlay', () => {
      render(
        <PDFViewer 
          url="/test.pdf" 
          document={mockDocument}
          showSignatures={true}
          isEditingSignatures={true}
        />
      )
      
      const overlay = screen.getByTestId('signature-overlay')
      expect(overlay).toHaveAttribute('data-editing', 'true')
    })

    it('defaults isEditingSignatures to false', () => {
      render(
        <PDFViewer 
          url="/test.pdf" 
          document={mockDocument}
          showSignatures={true}
        />
      )
      
      const overlay = screen.getByTestId('signature-overlay')
      expect(overlay).toHaveAttribute('data-editing', 'false')
    })
  })

  describe('Props Interface', () => {
    it('handles all optional props correctly', () => {
      const mockOnFieldsChange = vi.fn()
      const mockOnSign = vi.fn()

      render(
        <PDFViewer 
          url="/test.pdf"
          document={mockDocument}
          showSignatures={true}
          isEditingSignatures={true}
          onSignatureFieldsChange={mockOnFieldsChange}
          onSign={mockOnSign}
          className="test-class"
        />
      )
      
      // Component should render without errors
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      expect(screen.getByTestId('signature-overlay')).toBeInTheDocument()
    })

    it('applies default values for optional props', () => {
      const { container } = render(<PDFViewer url="/test.pdf" />)
      
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('relative')
      expect(wrapper.className).toBe('relative ')
    })
  })

  describe('Container Structure', () => {
    it('creates proper container structure with relative positioning', () => {
      const { container } = render(<PDFViewer url="/test.pdf" />)
      
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('relative')
      expect(wrapper.tagName).toBe('DIV')
    })

    it('positions SignatureOverlay absolutely within relative container', () => {
      render(
        <PDFViewer 
          url="/test.pdf" 
          document={mockDocument}
          showSignatures={true}
        />
      )
      
      const overlay = screen.getByTestId('signature-overlay')
      expect(overlay).toHaveClass('absolute', 'inset-0')
    })
  })

  describe('Plugin Configuration', () => {
    it('initializes defaultLayoutPlugin correctly', () => {
      render(<PDFViewer url="/test.pdf" />)
      
      const viewer = screen.getByTestId('pdf-viewer')
      expect(viewer).toHaveAttribute('data-plugins-count', '1')
    })
  })

  describe('TypeScript Interface Compliance', () => {
    it('accepts all defined props without TypeScript errors', () => {
      // This test ensures the component accepts the expected interface
      const validProps = {
        url: '/test.pdf',
        document: mockDocument,
        showSignatures: true,
        isEditingSignatures: false,
        onSignatureFieldsChange: vi.fn(),
        onSign: vi.fn(),
        className: 'test'
      }

      expect(() => render(<PDFViewer {...validProps} />)).not.toThrow()
    })
  })
})