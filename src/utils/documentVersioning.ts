import type { Document, DocumentVersion } from '@/types/documents'

/**
 * Document Versioning Utilities
 * Handles version creation, management, and metadata
 */

/**
 * Create a new version of a document
 */
export function createNewVersion(
  currentDocument: Document,
  updates: Partial<Document>
): Document {
  const newVersion: Document = {
    ...currentDocument,
    ...updates,
    version: currentDocument.version + 1,
    updatedAt: new Date(),
    parentDocumentId: currentDocument.id,
  }

  // If document is being modified, invalidate signatures
  if (currentDocument.requiresSignatures && hasContentChanges(currentDocument, updates)) {
    newVersion.signatures = []
    newVersion.isLocked = false // Unlock when signatures are invalidated
  }

  return newVersion
}

/**
 * Check if updates include content changes that would invalidate signatures
 */
function hasContentChanges(current: Document, updates: Partial<Document>): boolean {
  const contentFields = ['name', 'url', 'size', 'mimeType']
  return contentFields.some(field => 
    updates[field as keyof Document] !== undefined && 
    updates[field as keyof Document] !== current[field as keyof Document]
  )
}

/**
 * Create a document version record for history tracking
 */
export function createVersionRecord(
  document: Document,
  changelog?: string
): DocumentVersion {
  return {
    id: `${document.id}_v${document.version}`,
    documentId: document.id,
    version: document.version,
    name: document.name,
    size: document.size,
    url: document.url,
    uploadedBy: document.uploadedBy,
    uploadedAt: document.uploadedAt,
    changeLog: changelog
  }
}

/**
 * Restore a document to a previous version
 */
export function restoreToVersion(
  currentDocument: Document,
  targetVersion: DocumentVersion
): Document {
  const restoredDocument: Document = {
    ...currentDocument,
    name: targetVersion.name,
    size: targetVersion.size,
    url: targetVersion.url,
    version: currentDocument.version + 1,
    updatedAt: new Date(),
    // Clear signatures when restoring
    signatures: [],
    isLocked: false,
  }

  return restoredDocument
}

/**
 * Check if a new version should be created based on changes
 */
export function shouldCreateNewVersion(
  current: Document,
  updates: Partial<Document>
): boolean {
  // Always create new version for file content changes
  if (updates.url || updates.size || updates.mimeType) {
    return true
  }

  // Create new version for significant metadata changes
  const significantFields = ['name', 'description']
  return significantFields.some(field => 
    updates[field as keyof Document] !== undefined &&
    updates[field as keyof Document] !== current[field as keyof Document]
  )
}

/**
 * Generate automatic changelog based on changes
 */
export function generateAutoChangelog(
  current: Document,
  updates: Partial<Document>
): string {
  const changes: string[] = []

  if (updates.name && updates.name !== current.name) {
    changes.push(`Renamed from "${current.name}" to "${updates.name}"`)
  }

  if (updates.description && updates.description !== current.description) {
    changes.push('Updated description')
  }

  if (updates.url && updates.url !== current.url) {
    changes.push('File content updated')
  }

  if (updates.tags && JSON.stringify(updates.tags) !== JSON.stringify(current.tags)) {
    changes.push('Updated tags')
  }

  if (updates.isPublic !== undefined && updates.isPublic !== current.isPublic) {
    changes.push(`Changed visibility to ${updates.isPublic ? 'public' : 'private'}`)
  }

  return changes.length > 0 ? changes.join(', ') : 'Document updated'
}

/**
 * Validate version creation
 */
export function validateVersionCreation(
  document: Document,
  userId: string
): { valid: boolean; error?: string } {
  // Check if document is locked
  if (document.isLocked && document.lockedBy !== userId) {
    return {
      valid: false,
      error: 'Cannot create new version: document is locked by another user'
    }
  }

  // Check version limit (prevent excessive versions)
  if (document.version >= 100) {
    return {
      valid: false,
      error: 'Maximum version limit reached (100 versions)'
    }
  }

  return { valid: true }
}

/**
 * Get version statistics for a document
 */
export function getVersionStats(versions: DocumentVersion[]): {
  totalVersions: number
  sizeGrowth: number
  contributors: string[]
  latestChange: Date
} {
  if (versions.length === 0) {
    return {
      totalVersions: 0,
      sizeGrowth: 0,
      contributors: [],
      latestChange: new Date()
    }
  }

  const sortedVersions = versions.sort((a, b) => a.version - b.version)
  const firstVersion = sortedVersions[0]
  const lastVersion = sortedVersions[sortedVersions.length - 1]

  return {
    totalVersions: versions.length,
    sizeGrowth: lastVersion.size - firstVersion.size,
    contributors: [...new Set(versions.map(v => v.uploadedBy))],
    latestChange: lastVersion.uploadedAt
  }
}