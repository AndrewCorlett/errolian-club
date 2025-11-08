/**
 * Document Converter Utilities
 * Converts between database types and frontend types for documents
 */

import type { Document, DocumentFolder } from '@/types/documents'
import type {
  Document as DocumentRow,
  DocumentFolder as DocumentFolderRow
} from '@/types/supabase'

/**
 * Get proper document URL with signed access
 */
export const getDocumentUrl = async (
  storagePath: string,
  _documentId: string,
  isPublic: boolean = false
): Promise<string> => {
  console.log('getDocumentUrl called with:', { storagePath, isPublic })

  try {
    // Always use signed URLs for better reliability and access control
    // This avoids issues with bucket public access configuration
    console.log('Generating signed URL for storage path:', storagePath)
    const { fileStorage } = await import('@/lib/fileStorage')
    const signedUrl = await fileStorage.createSignedUrl(storagePath, 3600) // 1 hour expiry
    console.log('Signed URL generated:', signedUrl)
    return signedUrl
  } catch {
    console.log(`File not found in storage: ${storagePath}`)

    // Return a placeholder URL for missing files
    const placeholderData = `File not found: ${storagePath}`
    return `data:text/plain;charset=utf-8,${encodeURIComponent(placeholderData)}`
  }
}

/**
 * Convert database document row to frontend Document type
 */
export const convertDocumentRowToDocument = async (row: DocumentRow): Promise<Document> => {
  // Get proper URL for the document
  const url = await getDocumentUrl(row.storage_path, row.id, row.is_public)

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    size: row.size_bytes,
    mimeType: row.mime_type,
    url: url, // Now using proper URL instead of just storage path
    thumbnailUrl: row.thumbnail_path || undefined,
    folderId: row.folder_id || undefined,
    uploadedBy: row.uploaded_by,
    uploadedAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    status: row.status,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
    rejectedReason: row.rejected_reason || undefined,
    description: row.description || undefined,
    tags: row.tags,
    isPublic: row.is_public,
    downloadCount: row.download_count,
    version: row.version,
    parentDocumentId: row.parent_document_id || undefined,
    // Document locking fields
    isLocked: row.is_locked || false,
    lockedBy: row.locked_by || undefined,
    lockedAt: row.locked_at ? new Date(row.locked_at) : undefined,
    // Document signature fields
    requiresSignatures: row.requires_signatures || false,
    signatures: (row.signatures as unknown as Document['signatures']) || [],
    signatureDeadline: row.signature_deadline ? new Date(row.signature_deadline) : undefined,
  }
}

/**
 * Convert database folder row to frontend DocumentFolder type
 */
export const convertDocumentFolderRowToFolder = (row: DocumentFolderRow): DocumentFolder => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  parentId: row.parent_id, // Keep as null for top-level folders to match filter logic
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  isPublic: row.is_public,
  color: row.color || undefined,
  icon: row.icon || undefined,
})
