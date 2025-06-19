/**
 * Tests for Document Upload Retry Logic
 * Specifically tests handling of storage path uniqueness constraint violations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase
const mockUpload = vi.fn()
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
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/test.pdf' } }),
        createSignedUrl: () => Promise.resolve({ 
          data: { signedUrl: 'https://example.com/signed.pdf' }, 
          error: null 
        })
      })
    },
    from: () => mockSupabaseQuery
  }
}))

describe('Document Upload Retry Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockReturnValue(mockSupabaseQuery)
    mockSelect.mockReturnValue(mockSupabaseQuery)
  })

  it('should retry on storage path uniqueness constraint violation', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const mockDocumentData = {
      name: 'test.pdf',
      type: 'pdf' as const,
      uploaded_by: 'user-123',
      status: 'pending' as const,
      is_public: false,
      version: 1
    }

    // Mock successful file uploads for both attempts
    mockUpload
      .mockResolvedValueOnce({
        data: { path: 'general/123_abc_test.pdf' },
        error: null
      })
      .mockResolvedValueOnce({
        data: { path: 'general/r2_456_def_test.pdf' }, // Different path on retry
        error: null
      })

    // Mock database responses: first fails with uniqueness constraint, second succeeds
    mockSingle
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "documents_storage_path_key"'
        }
      })
      .mockResolvedValueOnce({
        data: {
          id: 'doc-123',
          ...mockDocumentData,
          storage_path: 'general/r2_456_def_test.pdf',
          size_bytes: 1024,
          mime_type: 'application/pdf',
          created_at: new Date().toISOString()
        },
        error: null
      })

    const { documentService } = await import('../lib/database')
    
    const result = await documentService.createDocumentWithFile(mockFile, mockDocumentData)

    // Should have called upload twice (original + retry)
    expect(mockUpload).toHaveBeenCalledTimes(2)
    
    // Should have called database insert twice (original + retry)
    expect(mockSingle).toHaveBeenCalledTimes(2)
    
    // Final result should use the retry path
    expect(result.document.storage_path).toBe('general/r2_456_def_test.pdf')
  })

  it('should fail after max retries', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const mockDocumentData = {
      name: 'test.pdf',
      type: 'pdf' as const,
      uploaded_by: 'user-123',
      status: 'pending' as const,
      is_public: false,
      version: 1
    }

    // Mock file uploads to succeed
    mockUpload.mockResolvedValue({
      data: { path: 'general/123_abc_test.pdf' },
      error: null
    })

    // Mock all database attempts to fail with uniqueness constraint
    mockSingle.mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint "documents_storage_path_key"'
      }
    })

    const { documentService } = await import('../lib/database')
    
    await expect(documentService.createDocumentWithFile(mockFile, mockDocumentData))
      .rejects.toThrow(/duplicate key value violates unique constraint/)
    
    // Should have tried 3 times (max retries)
    expect(mockUpload).toHaveBeenCalledTimes(3)
    expect(mockSingle).toHaveBeenCalledTimes(3)
  })

  it('should fail immediately on non-uniqueness errors', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const mockDocumentData = {
      name: 'test.pdf',
      type: 'pdf' as const,
      uploaded_by: 'user-123',
      status: 'pending' as const,
      is_public: false,
      version: 1
    }

    // Mock file upload to succeed
    mockUpload.mockResolvedValue({
      data: { path: 'general/123_abc_test.pdf' },
      error: null
    })

    // Mock database to fail with a different error (not uniqueness constraint)
    mockSingle.mockResolvedValue({
      data: null,
      error: {
        code: '23502',
        message: 'null value in column violates not-null constraint'
      }
    })

    const { documentService } = await import('../lib/database')
    
    await expect(documentService.createDocumentWithFile(mockFile, mockDocumentData))
      .rejects.toThrow(/null value in column/)
    
    // Should only try once (no retries for non-uniqueness errors)
    expect(mockUpload).toHaveBeenCalledTimes(1)
    expect(mockSingle).toHaveBeenCalledTimes(1)
  })

  it('should generate different storage paths on retries', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    // Test that retry attempts generate different paths
    const { fileStorage } = await import('../lib/fileStorage')

    // Mock different responses for different calls
    mockUpload
      .mockResolvedValueOnce({
        data: { path: 'general/123_abc_test.pdf' },
        error: null
      })
      .mockResolvedValueOnce({
        data: { path: 'general/r2_456_def_test.pdf' },
        error: null
      })

    const result1 = await fileStorage.uploadFile(mockFile, { folder: 'general' })
    const result2 = await fileStorage.uploadFile(mockFile, { folder: 'general', retryAttempt: 2 })

    // Paths should be different due to retry attempt prefix
    expect(result1.path).not.toBe(result2.path)
    expect(result1.path).toBe('general/123_abc_test.pdf')
    expect(result2.path).toBe('general/r2_456_def_test.pdf')
  })
})