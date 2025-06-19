import type { UserRole } from '@/types/supabase'
import type { Document } from '@/types/documents'

/**
 * Document Permission System
 * 
 * Permission Matrix:
 * Role              Upload  Edit    Sign    Lock/Unlock  View Versions
 * Officer           ✅      ✅      ✅      ❌           ✅
 * Admin             ✅      ✅      ✅      ✅           ✅
 * Member            ❌      ❌      ❌      ❌           ✅ (read-only)
 */

/**
 * Check if user can upload documents
 */
export function canUpload(userRole: UserRole): boolean {
  return ['super-admin', 'commodore', 'officer'].includes(userRole)
}

/**
 * Check if user can edit a specific document
 */
export function canEdit(userRole: UserRole, document: Document, userId: string): boolean {
  // Super admin and commodore can edit all documents
  if (userRole === 'super-admin' || userRole === 'commodore') {
    return true
  }
  
  // Officers can edit their own documents or unlocked documents
  if (userRole === 'officer') {
    // Can edit if they uploaded it
    if (document.uploadedBy === userId) {
      return true
    }
    // Can edit if document is not locked
    return !document.isLocked
  }
  
  // Members cannot edit documents
  return false
}

/**
 * Check if user can sign documents
 */
export function canSign(userRole: UserRole): boolean {
  return ['super-admin', 'commodore', 'officer'].includes(userRole)
}

/**
 * Check if user can lock/unlock documents
 */
export function canLockUnlock(userRole: UserRole): boolean {
  return ['super-admin', 'commodore'].includes(userRole)
}

/**
 * Check if user can view document versions
 */
export function canViewVersions(): boolean {
  // All users can view versions (read-only for members)
  return true
}

/**
 * Check if user can delete documents
 */
export function canDelete(userRole: UserRole, document: Document, userId: string): boolean {
  // Super admin and commodore can delete all documents
  if (userRole === 'super-admin' || userRole === 'commodore') {
    return true
  }
  
  // Officers can delete their own documents if not locked
  if (userRole === 'officer') {
    return document.uploadedBy === userId && !document.isLocked
  }
  
  // Members cannot delete documents
  return false
}

/**
 * Check if user can approve/reject documents
 */
export function canApproveReject(userRole: UserRole): boolean {
  return ['super-admin', 'commodore', 'officer'].includes(userRole)
}

/**
 * Check if user can move documents between folders
 */
export function canMoveDocuments(userRole: UserRole): boolean {
  return ['super-admin', 'commodore', 'officer'].includes(userRole)
}

/**
 * Check if user can create/manage folders
 */
export function canManageFolders(userRole: UserRole): boolean {
  return ['super-admin', 'commodore', 'officer'].includes(userRole)
}

/**
 * Check if user can view private documents
 */
export function canViewPrivateDocuments(userRole: UserRole, document: Document, userId: string): boolean {
  // Public documents are visible to all
  if (document.isPublic) {
    return true
  }
  
  // Super admin and commodore can view all private documents
  if (userRole === 'super-admin' || userRole === 'commodore') {
    return true
  }
  
  // Officers can view private documents they uploaded
  if (userRole === 'officer') {
    return document.uploadedBy === userId
  }
  
  // Members can only view public documents
  return false
}

/**
 * Check if user needs to sign a document
 */
export function needsToSign(document: Document, userId: string): boolean {
  if (!document.requiresSignatures) {
    return false
  }
  
  // Check if user has already signed
  const hasAlreadySigned = document.signatures.some(sig => sig.userId === userId)
  return !hasAlreadySigned
}

/**
 * Check if document signature collection is complete
 */
export function isSignatureComplete(document: Document): boolean {
  if (!document.requiresSignatures) {
    return true
  }
  
  // For now, we'll consider it complete when all officers have signed
  // In a real implementation, this would check against a list of required signers
  return document.signatures.length > 0
}

/**
 * Get user permissions summary for a document
 */
export function getDocumentPermissions(userRole: UserRole, document: Document, userId: string) {
  return {
    canView: canViewPrivateDocuments(userRole, document, userId),
    canEdit: canEdit(userRole, document, userId),
    canDelete: canDelete(userRole, document, userId),
    canSign: canSign(userRole) && needsToSign(document, userId),
    canLock: canLockUnlock(userRole),
    canUnlock: canLockUnlock(userRole),
    canApprove: canApproveReject(userRole) && document.status === 'pending',
    canReject: canApproveReject(userRole) && document.status === 'pending',
    canMove: canMoveDocuments(userRole),
    canViewVersions: canViewVersions(),
  }
}