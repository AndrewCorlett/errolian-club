/**
 * File Cleanup Utilities
 * Handles automatic cleanup of old file versions and orphaned files
 */

import { supabase } from '../lib/supabase'
import { fileStorage } from '../lib/fileStorage'

export interface CleanupOptions {
  maxVersionsToKeep?: number
  maxAgeInDays?: number
  dryRun?: boolean
}

export class FileCleanupService {
  
  /**
   * Clean up old document versions
   */
  async cleanupOldVersions(options: CleanupOptions = {}): Promise<{
    deletedFiles: string[]
    totalSizeCleaned: number
    errors: string[]
  }> {
    const {
      maxVersionsToKeep = 10,
      maxAgeInDays = 90,
      dryRun = false
    } = options

    const deletedFiles: string[] = []
    const errors: string[] = []
    let totalSizeCleaned = 0

    try {
      // Get all documents with versions
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, storage_path, version, created_at, size_bytes')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`)
      }

      // Group documents by their base ID (assuming versions share base path)
      const documentGroups = new Map<string, any[]>()
      
      for (const doc of documents || []) {
        const baseId = this.extractBaseDocumentId(doc.storage_path)
        if (!documentGroups.has(baseId)) {
          documentGroups.set(baseId, [])
        }
        documentGroups.get(baseId)!.push(doc)
      }

      // Process each document group
      for (const [_baseId, versions] of documentGroups) {
        // Sort versions by creation date (newest first)
        versions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        // Identify versions to delete
        const versionsToDelete = []

        // Delete versions beyond the keep limit
        if (versions.length > maxVersionsToKeep) {
          versionsToDelete.push(...versions.slice(maxVersionsToKeep))
        }

        // Delete old versions regardless of count
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays)

        for (const version of versions) {
          if (new Date(version.created_at) < cutoffDate) {
            if (!versionsToDelete.includes(version)) {
              versionsToDelete.push(version)
            }
          }
        }

        // Always keep at least one version (the latest)
        if (versionsToDelete.length >= versions.length) {
          versionsToDelete.splice(versionsToDelete.indexOf(versions[0]), 1)
        }

        // Delete the identified versions
        for (const version of versionsToDelete) {
          try {
            if (!dryRun) {
              await fileStorage.deleteFile(version.storage_path)
              
              // Update database to mark as deleted or remove record
              await supabase
                .from('documents')
                .delete()
                .eq('id', version.id)
            }

            deletedFiles.push(version.storage_path)
            totalSizeCleaned += version.size_bytes || 0
          } catch (deleteError) {
            const errorMsg = `Failed to delete ${version.storage_path}: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`
            errors.push(errorMsg)
            console.warn(errorMsg)
          }
        }
      }

      return {
        deletedFiles,
        totalSizeCleaned,
        errors
      }
    } catch (error) {
      console.error('Cleanup failed:', error)
      throw error
    }
  }

  /**
   * Clean up orphaned files (files in storage without database records)
   */
  async cleanupOrphanedFiles(options: CleanupOptions = {}): Promise<{
    deletedFiles: string[]
    totalSizeCleaned: number
    errors: string[]
  }> {
    const { dryRun = false } = options
    
    const deletedFiles: string[] = []
    const errors: string[] = []
    let totalSizeCleaned = 0

    try {
      // Get all files from storage
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('documents')
        .list('', {
          limit: 1000,
          offset: 0
        })

      if (storageError) {
        throw new Error(`Failed to list storage files: ${storageError.message}`)
      }

      // Get all storage paths from database
      const { data: dbDocuments, error: dbError } = await supabase
        .from('documents')
        .select('storage_path')

      if (dbError) {
        throw new Error(`Failed to fetch database documents: ${dbError.message}`)
      }

      const dbPaths = new Set((dbDocuments || []).map((doc: any) => doc.storage_path))

      // Find orphaned files
      for (const file of storageFiles || []) {
        const filePath = file.name
        
        if (!dbPaths.has(filePath)) {
          try {
            if (!dryRun) {
              await fileStorage.deleteFile(filePath)
            }

            deletedFiles.push(filePath)
            totalSizeCleaned += file.metadata?.size || 0
          } catch (deleteError) {
            const errorMsg = `Failed to delete orphaned file ${filePath}: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`
            errors.push(errorMsg)
            console.warn(errorMsg)
          }
        }
      }

      return {
        deletedFiles,
        totalSizeCleaned,
        errors
      }
    } catch (error) {
      console.error('Orphaned file cleanup failed:', error)
      throw error
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    documentCount: number
    versionCount: number
    oldestFile: Date | null
    newestFile: Date | null
  }> {
    try {
      // Get document statistics from database
      const { data: documents, error } = await supabase
        .from('documents')
        .select('size_bytes, created_at, version')

      if (error) {
        throw new Error(`Failed to fetch document stats: ${error.message}`)
      }

      const totalFiles = documents?.length || 0
      const totalSize = documents?.reduce((sum: number, doc: any) => sum + (doc.size_bytes || 0), 0) || 0
      const documentCount = new Set(documents?.map((doc: any) => this.extractBaseDocumentId(doc.id))).size
      const versionCount = totalFiles - documentCount

      const dates = documents?.map((doc: any) => new Date(doc.created_at)).sort((a: Date, b: Date) => a.getTime() - b.getTime()) || []
      const oldestFile = dates.length > 0 ? dates[0] : null
      const newestFile = dates.length > 0 ? dates[dates.length - 1] : null

      return {
        totalFiles,
        totalSize,
        documentCount,
        versionCount,
        oldestFile,
        newestFile
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      throw error
    }
  }

  /**
   * Schedule automatic cleanup
   */
  scheduleCleanup(options: CleanupOptions & { intervalHours?: number } = {}): () => void {
    const { intervalHours = 24, ...cleanupOptions } = options

    const intervalMs = intervalHours * 60 * 60 * 1000

    const interval = setInterval(async () => {
      try {
        console.log('🧹 Running scheduled file cleanup...')
        
        const versionCleanup = await this.cleanupOldVersions(cleanupOptions)
        const orphanCleanup = await this.cleanupOrphanedFiles(cleanupOptions)

        const totalCleaned = versionCleanup.totalSizeCleaned + orphanCleanup.totalSizeCleaned
        const totalFiles = versionCleanup.deletedFiles.length + orphanCleanup.deletedFiles.length

        console.log(`✅ Cleanup complete: ${totalFiles} files, ${this.formatFileSize(totalCleaned)} freed`)
        
        if (versionCleanup.errors.length > 0 || orphanCleanup.errors.length > 0) {
          console.warn('⚠️ Some cleanup operations failed:', {
            versionErrors: versionCleanup.errors,
            orphanErrors: orphanCleanup.errors
          })
        }
      } catch (error) {
        console.error('❌ Scheduled cleanup failed:', error)
      }
    }, intervalMs)

    // Return cleanup function
    return () => {
      clearInterval(interval)
    }
  }

  /**
   * Extract base document ID from storage path
   */
  private extractBaseDocumentId(storagePathOrId: string): string {
    // Simple implementation - in practice this would depend on your path structure
    if (storagePathOrId.includes('/versions/')) {
      return storagePathOrId.split('/versions/')[1].split('/')[0]
    }
    return storagePathOrId
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
export const fileCleanup = new FileCleanupService()