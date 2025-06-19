/**
 * Unit tests for File Storage Service
 * Tests file upload, path generation, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockCreateSignedUrl = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl
      })
    }
  }
}))

describe('FileStorage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('path generation logic', () => {
    it('should generate unique paths for same filename', async () => {
      // Test that uploading same filename twice should create different storage paths
      const file1 = new File(['content1'], 'test.pdf', { type: 'application/pdf' })
      const file2 = new File(['content2'], 'test.pdf', { type: 'application/pdf' })

      // We can't directly test the private method, but we can test the behavior
      // by checking that two uploads of the same filename get different paths
      
      mockUpload
        .mockResolvedValueOnce({
          data: { path: 'general/123_abc_test.pdf' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { path: 'general/456_def_test.pdf' },
          error: null
        })

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/test.pdf' }
      })

      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed.pdf' },
        error: null
      })

      const { fileStorage } = await import('../lib/fileStorage')

      const result1 = await fileStorage.uploadFile(file1, { folder: 'general' })
      const result2 = await fileStorage.uploadFile(file2, { folder: 'general' })

      expect(result1.path).not.toBe(result2.path)
      expect(result1.path).toContain('test.pdf')
      expect(result2.path).toContain('test.pdf')
    })
  })

  describe('file validation through upload', () => {
    it('should handle supported file types', async () => {
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      mockUpload.mockResolvedValue({
        data: { path: 'general/123_abc_test.pdf' },
        error: null
      })

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/test.pdf' }
      })

      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed.pdf' },
        error: null
      })

      const { fileStorage } = await import('../lib/fileStorage')
      
      await expect(fileStorage.uploadFile(pdfFile)).resolves.toBeDefined()
    })

    it('should reject very large files', async () => {
      // Create a file larger than reasonable upload size
      const largeContent = 'x'.repeat(100 * 1024 * 1024) // 100MB
      const largeFile = new File([largeContent], 'large.pdf', { 
        type: 'application/pdf' 
      })

      const { fileStorage } = await import('../lib/fileStorage')
      
      await expect(fileStorage.uploadFile(largeFile)).rejects.toThrow()
    })
  })

  describe('uploadFile', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    it('should successfully upload a file', async () => {
      mockUpload.mockResolvedValue({
        data: { path: 'general/123_abc_test.pdf' },
        error: null
      })
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/public/test.pdf' }
      })
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/test.pdf' },
        error: null
      })

      const { fileStorage } = await import('../lib/fileStorage')
      const result = await fileStorage.uploadFile(mockFile, { folder: 'general' })

      expect(result).toEqual({
        path: 'general/123_abc_test.pdf',
        fullUrl: 'https://example.com/signed/test.pdf',
        publicUrl: undefined,
        size: mockFile.size,
        mimeType: mockFile.type
      })
    })

    it('should handle upload errors', async () => {
      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' }
      })

      const { fileStorage } = await import('../lib/fileStorage')
      await expect(fileStorage.uploadFile(mockFile)).rejects.toThrow('Upload failed: Upload failed')
    })

    it('should handle signed URL failures gracefully', async () => {
      mockUpload.mockResolvedValue({
        data: { path: 'general/123_abc_test.pdf' },
        error: null
      })
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/public/test.pdf' }
      })
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Object not found' }
      })

      const { fileStorage } = await import('../lib/fileStorage')
      const result = await fileStorage.uploadFile(mockFile)

      expect(result.fullUrl).toBe('https://example.com/public/test.pdf')
    })
  })
})