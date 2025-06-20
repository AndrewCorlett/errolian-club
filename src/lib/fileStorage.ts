/**
 * File Storage Service
 * Handles file uploads, downloads, and storage management with Supabase Storage
 */

import { getSupabaseAdmin } from './supabase'
// File storage service for Supabase Storage integration

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface FileUploadOptions {
  folder?: string
  filename?: string
  isPublic?: boolean
  onProgress?: (progress: UploadProgress) => void
  maxSize?: number // in bytes
  allowedTypes?: string[] // MIME types
  retryAttempt?: number // For generating unique paths on retries
}

export interface FileUploadResult {
  path: string
  fullUrl: string
  publicUrl?: string
  size: number
  mimeType: string
}

export class FileStorageService {
  private readonly BUCKET_NAME = 'documents'
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB default
  private readonly ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'text/plain',
    'text/csv'
  ]

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File, 
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    // Validate file
    this.validateFile(file, options)

    // Generate file path
    const filePath = this.generateFilePath(file, options)

    try {
      // Upload file with progress tracking
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
          duplex: 'half' as const
        })

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath)

      // For immediate upload response, just return the public URL
      // Signed URLs will be generated on-demand when needed for secure access
      return {
        path: data.path,
        fullUrl: urlData.publicUrl,
        publicUrl: options.isPublic ? urlData.publicUrl : undefined,
        size: file.size,
        mimeType: file.type
      }
    } catch (error) {
      console.error('File upload error:', error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload a new version of an existing document
   */
  async uploadVersion(
    file: File,
    documentId: string,
    versionNumber: number,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    const versionPath = `versions/${documentId}/v${versionNumber}/${file.name}`
    
    const versionOptions: FileUploadOptions = {
      ...options,
      filename: versionPath
    }

    return this.uploadFile(file, versionOptions)
  }

  /**
   * Download a file from storage
   */
  async downloadFile(path: string): Promise<Blob> {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(path)

      if (error) {
        throw new Error(`Download failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('File download error:', error)
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a signed URL for secure file access
   */
  async createSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    console.log('🔐 FileStorage.createSignedUrl called with:', { 
      path, 
      expiresIn, 
      bucket: this.BUCKET_NAME,
      pathLength: path.length,
      pathStartsWith: path.substring(0, 50) + (path.length > 50 ? '...' : '')
    })
    
    // Additional path validation logging
    if (path.includes('//')) {
      console.warn('⚠️  Double slashes detected in path:', path)
    }
    if (path.startsWith('/')) {
      console.warn('⚠️  Path starts with slash (should not):', path)
    }
    if (!path) {
      console.error('❌ Empty path provided to createSignedUrl')
      throw new Error('Path cannot be empty')
    }
    
    try {
      console.log('📤 Calling supabase.storage.createSignedUrl with exact path:', JSON.stringify(path))
      
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(path, expiresIn)

      console.log('📥 Supabase createSignedUrl response:', { 
        success: !!data?.signedUrl,
        hasError: !!error,
        error: error ? error.message : null,
        signedUrlLength: data?.signedUrl ? data.signedUrl.length : 0,
        signedUrlStart: data?.signedUrl ? data.signedUrl.substring(0, 100) + '...' : null
      })

      if (error || !data?.signedUrl) {
        console.error('Signed URL creation failed:', error)
        throw new Error(`Failed to create signed URL: ${error?.message || 'No URL returned'}`)
      }

      console.log('Signed URL created successfully:', data.signedUrl)
      return data.signedUrl
    } catch (error) {
      console.error('Signed URL creation error:', error)
      throw new Error(`Failed to create signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Test storage bucket access and configuration
   */
  async testStorageBucket(): Promise<{
    exists: boolean
    accessible: boolean
    canCreateSignedUrls: boolean
    error?: string
  }> {
    const result = {
      exists: false,
      accessible: false,
      canCreateSignedUrls: false,
      error: undefined as string | undefined
    }

    try {
      // Test bucket access by listing files
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', { limit: 1 })

      if (error) {
        result.error = error.message
        return result
      }

      result.exists = true
      result.accessible = true

      // Test signed URL creation with a dummy path
      try {
        await supabase.storage
          .from(this.BUCKET_NAME)
          .createSignedUrl('test/dummy.txt', 60)
        result.canCreateSignedUrls = true
      } catch (err) {
        console.log('Signed URL test failed:', err)
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return result
  }

  /**
   * Test document URL access
   */
  async testDocumentAccess(path: string): Promise<{
    publicUrl: string
    signedUrl?: string
    publicAccessible: boolean
    signedAccessible: boolean
    contentType?: string
    error?: string
  }> {
    const result = {
      publicUrl: '',
      signedUrl: undefined as string | undefined,
      publicAccessible: false,
      signedAccessible: false,
      contentType: undefined as string | undefined,
      error: undefined as string | undefined
    }

    try {
      // Get public URL  
      const supabase = getSupabaseAdmin()
      const { data: publicData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(path)
      result.publicUrl = publicData.publicUrl

      // Test public URL access
      try {
        const publicResponse = await fetch(result.publicUrl, { method: 'HEAD' })
        result.publicAccessible = publicResponse.ok
        if (publicResponse.ok) {
          result.contentType = publicResponse.headers.get('content-type') || undefined
        }
      } catch (err) {
        console.log('Public URL test failed:', err)
      }

      // Try to create and test signed URL
      try {
        result.signedUrl = await this.createSignedUrl(path, 3600)
        const signedResponse = await fetch(result.signedUrl, { method: 'HEAD' })
        result.signedAccessible = signedResponse.ok
        if (signedResponse.ok && !result.contentType) {
          result.contentType = signedResponse.headers.get('content-type') || undefined
        }
      } catch (err) {
        console.log('Signed URL test failed:', err)
        result.error = err instanceof Error ? err.message : 'Unknown error'
      }

    } catch (err) {
      result.error = err instanceof Error ? err.message : 'Unknown error'
    }

    return result
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path])

      if (error) {
        throw new Error(`Delete failed: ${error.message}`)
      }
    } catch (error) {
      console.error('File deletion error:', error)
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete all versions of a document
   */
  async deleteDocumentVersions(documentId: string): Promise<void> {
    try {
      // List all files in the document's version folder
      const supabase = getSupabaseAdmin()
      const { data: files, error: listError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(`versions/${documentId}`, {
          limit: 100,
          offset: 0
        })

      if (listError) {
        throw new Error(`Failed to list versions: ${listError.message}`)
      }

      if (files && files.length > 0) {
        const filePaths = files.map((file: any) => `versions/${documentId}/${file.name}`)
        
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filePaths)

        if (deleteError) {
          throw new Error(`Failed to delete versions: ${deleteError.message}`)
        }
      }
    } catch (error) {
      console.error('Version deletion error:', error)
      throw new Error(`Failed to delete document versions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Copy a file to a new location
   */
  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .copy(sourcePath, destinationPath)

      if (error) {
        throw new Error(`Copy failed: ${error.message}`)
      }
    } catch (error) {
      console.error('File copy error:', error)
      throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(path: string): Promise<{ size: number; lastModified: Date; mimeType?: string }> {
    try {
      // Download just the file to get metadata
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(path, {
          transform: {
            width: 1,
            height: 1,
            resize: 'fill'
          }
        })

      if (error) {
        throw new Error(`Failed to get file info: ${error.message}`)
      }

      return {
        size: data.size,
        lastModified: new Date(), // Supabase doesn't provide this directly
        mimeType: data.type
      }
    } catch (error) {
      console.error('File info error:', error)
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File, options: FileUploadOptions): void {
    const maxSize = options.maxSize || this.MAX_FILE_SIZE
    const allowedTypes = options.allowedTypes || this.ALLOWED_TYPES

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`)
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
    }

    // Check for empty file
    if (file.size === 0) {
      throw new Error('Cannot upload empty file')
    }
  }

  /**
   * Generate a unique file path
   */
  private generateFilePath(file: File, options: FileUploadOptions): string {
    const timestamp = Date.now()
    // Use crypto.getRandomValues for better randomness if available, fallback to Math.random
    const randomSuffix = this.generateRandomSuffix()
    const sanitizedFilename = this.sanitizeFilename(options.filename || file.name)
    
    const folder = options.folder || 'uploads'
    
    // Include retry attempt in path to ensure uniqueness on retries
    const retryPrefix = options.retryAttempt ? `r${options.retryAttempt}_` : ''
    
    return `${folder}/${retryPrefix}${timestamp}_${randomSuffix}_${sanitizedFilename}`
  }

  /**
   * Generate a random suffix with better entropy
   */
  private generateRandomSuffix(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Use crypto for better randomness
      const array = new Uint8Array(6)
      crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(36)).join('').substring(0, 8)
    } else {
      // Fallback to Math.random with longer suffix
      return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6)
    }
  }

  /**
   * Sanitize filename for storage
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .toLowerCase()
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`
  }
}

// Singleton instance
export const fileStorage = new FileStorageService()