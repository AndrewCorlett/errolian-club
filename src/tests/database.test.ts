/**
 * Unit tests for Database Service
 * Tests document creation, uniqueness constraints, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { documentService } from '../lib/database'

// Mock Supabase
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()

const mockSupabaseQuery = {
  insert: mockInsert,
  select: mockSelect,
  single: mockSingle
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => mockSupabaseQuery
  }
}))

// Mock file storage
vi.mock('../lib/fileStorage', () => ({
  fileStorage: {
    uploadFile: vi.fn()
  }
}))

describe('Document Database Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockReturnValue(mockSupabaseQuery)
    mockSelect.mockReturnValue(mockSupabaseQuery)
  })

  describe('createDocument', () => {
    const mockDocument = {
      name: 'test.pdf',
      type: 'pdf' as const,
      size_bytes: 1024,
      mime_type: 'application/pdf',
      storage_path: 'general/123_abc_test.pdf',
      uploaded_by: 'user-123',
      status: 'pending' as const,
      is_public: false,
      version: 1
    }

    it('should successfully create a document', async () => {
      const expectedDocument = { id: 'doc-123', ...mockDocument, created_at: new Date().toISOString() }
      
      mockSingle.mockResolvedValue({
        data: expectedDocument,
        error: null
      })

      const result = await documentService.createDocument(mockDocument)

      expect(mockInsert).toHaveBeenCalledWith(mockDocument)
      expect(result).toEqual(expectedDocument)
    })

    it('should handle storage path uniqueness constraint violations', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "documents_storage_path_key"'
        }
      })

      await expect(documentService.createDocument(mockDocument))
        .rejects.toThrow(/duplicate key value violates unique constraint/)
    })

    it('should handle other database errors', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23502',
          message: 'null value in column violates not-null constraint'
        }
      })

      await expect(documentService.createDocument(mockDocument))
        .rejects.toThrow(/null value in column/)
    })
  })

  describe('createDocumentWithFile', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const mockDocumentData = {
      name: 'test.pdf',
      type: 'pdf' as const,
      uploaded_by: 'user-123',
      status: 'pending' as const,
      is_public: false,
      version: 1
    }

    it('should upload file and create document record', async () => {
      const { fileStorage } = await import('../lib/fileStorage')
      
      // Mock file upload
      vi.mocked(fileStorage.uploadFile).mockResolvedValue({
        path: 'general/123_abc_test.pdf',
        fullUrl: 'https://example.com/test.pdf',
        size: 1024,
        mimeType: 'application/pdf'
      })

      // Mock document creation
      const expectedDocument = {
        id: 'doc-123',
        ...mockDocumentData,
        storage_path: 'general/123_abc_test.pdf',
        size_bytes: 1024,
        mime_type: 'application/pdf',
        created_at: new Date().toISOString()
      }

      mockSingle.mockResolvedValue({
        data: expectedDocument,
        error: null
      })

      const result = await documentService.createDocumentWithFile(mockFile, mockDocumentData)

      expect(fileStorage.uploadFile).toHaveBeenCalledWith(mockFile, {
        folder: 'general',
        isPublic: false
      })
      expect(result.document).toEqual(expectedDocument)
    })

    it('should handle file upload failures', async () => {
      const { fileStorage } = await import('../lib/fileStorage')
      
      vi.mocked(fileStorage.uploadFile).mockRejectedValue(new Error('Upload failed'))

      await expect(documentService.createDocumentWithFile(mockFile, mockDocumentData))
        .rejects.toThrow('Upload failed')
    })

    it('should handle database creation failures after successful upload', async () => {
      const { fileStorage } = await import('../lib/fileStorage')
      
      // Successful upload
      vi.mocked(fileStorage.uploadFile).mockResolvedValue({
        path: 'general/123_abc_test.pdf',
        fullUrl: 'https://example.com/test.pdf',
        size: 1024,
        mimeType: 'application/pdf'
      })

      // Failed database insert
      mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "documents_storage_path_key"'
        }
      })

      await expect(documentService.createDocumentWithFile(mockFile, mockDocumentData))
        .rejects.toThrow(/duplicate key value violates unique constraint/)
    })
  })
})