export type DocumentType = 'pdf' | 'image' | 'video' | 'audio' | 'doc' | 'spreadsheet' | 'other'
export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export interface DocumentSignature {
  id: string
  documentId: string
  userId: string
  signedAt: Date
  signatureData: string // base64 encoded signature
  ipAddress?: string
}

export interface Document {
  id: string
  name: string
  type: DocumentType
  size: number // in bytes
  mimeType: string
  url: string
  thumbnailUrl?: string
  folderId?: string
  uploadedBy: string
  uploadedAt: Date
  updatedAt: Date
  status: DocumentStatus
  approvedBy?: string
  approvedAt?: Date
  rejectedReason?: string
  description?: string
  tags: string[]
  isPublic: boolean
  downloadCount: number
  version: number
  parentDocumentId?: string // For versioning
  // Document locking fields
  isLocked: boolean
  lockedBy?: string
  lockedAt?: Date
  // Document signature fields
  requiresSignatures: boolean
  signatures: DocumentSignature[]
  signatureDeadline?: Date
}

export interface DocumentFolder {
  id: string
  name: string
  description?: string
  parentId?: string // For nested folders
  createdBy: string
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  color?: string
  icon?: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  name: string
  size: number
  url: string
  uploadedBy: string
  uploadedAt: Date
  changeLog?: string
}

export function getDocumentTypeIcon(type: DocumentType): string {
  const icons: Record<DocumentType, string> = {
    'pdf': 'pdf',
    'image': 'image',
    'video': 'video',
    'audio': 'audio',
    'doc': 'document',
    'spreadsheet': 'spreadsheet',
    'other': 'file'
  }
  return icons[type]
}

export function getDocumentTypeColor(type: DocumentType): string {
  const colors: Record<DocumentType, string> = {
    'pdf': 'bg-red-100 text-red-800',
    'image': 'bg-green-100 text-green-800',
    'video': 'bg-purple-100 text-purple-800',
    'audio': 'bg-blue-100 text-blue-800',
    'doc': 'bg-blue-100 text-blue-800',
    'spreadsheet': 'bg-green-100 text-green-800',
    'other': 'bg-gray-100 text-gray-800'
  }
  return colors[type]
}

export function getDocumentStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800'
  }
  return colors[status]
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileTypeFromMime(mimeType: string): DocumentType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'doc'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet'
  return 'other'
}