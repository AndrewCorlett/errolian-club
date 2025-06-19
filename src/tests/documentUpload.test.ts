/**
 * Integration tests for Document Upload Flow
 * Tests the complete upload process logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the auth context
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  profile: { name: 'Test User' }
}

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    profile: mockUser.profile
  })
}))

// Mock Supabase and file storage
const mockUpload = vi.fn()
const mockCreateDocument = vi.fn()

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
    from: () => ({
      insert: () => ({
        select: () => ({
          single: mockCreateDocument
        })
      })
    })
  }
}))

describe('Document Upload Flow Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle successful document upload logic', async () => {
    // Mock successful file upload
    mockUpload.mockResolvedValue({
      data: { path: 'general/123_abc_test.pdf' },
      error: null
    })

    // Mock successful document creation
    mockCreateDocument.mockResolvedValue({
      data: {
        id: 'doc-123',
        name: 'test.pdf',
        storage_path: 'general/123_abc_test.pdf',
        created_at: new Date().toISOString()
      },
      error: null
    })

    const { documentService } = await import('../lib/database')
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    
    const result = await documentService.createDocumentWithFile(file, {
      name: 'test.pdf',
      type: 'pdf',
      uploaded_by: mockUser.id,
      status: 'pending',
      is_public: false,
      version: 1
    })

    expect(result.document.name).toBe('test.pdf')
    expect(result.document.storage_path).toBe('general/123_abc_test.pdf')
    expect(mockUpload).toHaveBeenCalledTimes(1)
    expect(mockCreateDocument).toHaveBeenCalledTimes(1)
  })

  it('should handle storage path uniqueness constraint violation with retry', async () => {
    // Mock successful file upload
    mockUpload.mockResolvedValue({
      data: { path: 'general/123_abc_test.pdf' },
      error: null
    })

    // Mock database constraint violation then success
    mockCreateDocument
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
          name: 'test.pdf',
          storage_path: 'general/r2_456_def_test.pdf',
          created_at: new Date().toISOString()
        },
        error: null
      })

    const { documentService } = await import('../lib/database')
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    
    const result = await documentService.createDocumentWithFile(file, {
      name: 'test.pdf',
      type: 'pdf',
      uploaded_by: mockUser.id,
      status: 'pending',
      is_public: false,
      version: 1
    })

    expect(result.document.name).toBe('test.pdf')
    // Should have succeeded on retry
    expect(mockUpload).toHaveBeenCalledTimes(2) // Original + retry
    expect(mockCreateDocument).toHaveBeenCalledTimes(2) // Original + retry
  })

  it('should handle multiple files with the same name by generating unique paths', async () => {
    // Test that uploading the same filename twice generates different storage paths
    const file1 = new File(['content 1'], 'test.pdf', { type: 'application/pdf' })
    const file2 = new File(['content 2'], 'test.pdf', { type: 'application/pdf' })

    const { fileStorage } = await import('../lib/fileStorage')
    
    // Mock different responses for different upload calls
    mockUpload
      .mockResolvedValueOnce({
        data: { path: 'general/123_abc_test.pdf' },
        error: null
      })
      .mockResolvedValueOnce({
        data: { path: 'general/456_def_test.pdf' },
        error: null
      })

    const result1 = await fileStorage.uploadFile(file1, { folder: 'general' })
    const result2 = await fileStorage.uploadFile(file2, { folder: 'general' })

    expect(result1.path).not.toBe(result2.path)
    expect(result1.path).toContain('test.pdf')
    expect(result2.path).toContain('test.pdf')
  })
})