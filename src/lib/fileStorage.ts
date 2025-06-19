/**
 * File Storage Service
 * Handles file uploads, downloads, and storage management with Supabase Storage
 */

import { supabase } from './supabase'
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

      // Get signed URL for secure access (with retry for immediate availability)
      let signedUrlData = null
      try {
        const { data, error } = await supabase.storage
          .from(this.BUCKET_NAME)
          .createSignedUrl(filePath, 3600) // 1 hour expiry
        
        if (error) {
          console.log('Signed URL will be generated on-demand later:', error.message)
        } else {
          signedUrlData = data
        }
      } catch (error) {
        console.log('Signed URL will be generated on-demand later')
      }

      return {
        path: data.path,
        fullUrl: signedUrlData?.signedUrl || urlData.publicUrl,
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
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(path, expiresIn)

      if (error || !data?.signedUrl) {
        throw new Error(`Failed to create signed URL: ${error?.message || 'No URL returned'}`)
      }

      return data.signedUrl
    } catch (error) {
      console.error('Signed URL creation error:', error)
      throw new Error(`Failed to create signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(path: string): Promise<void> {
    try {
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