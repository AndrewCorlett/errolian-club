import type { Document } from '@/types/documents'
import type { UserRole } from '@/types/supabase'
import { canLockUnlock } from './documentPermissions'

/**
 * Document Locking Utilities
 * Handles document lock/unlock operations and validation
 */

export interface LockResult {
  success: boolean
  error?: string
  document?: Document
}

/**
 * Lock a document
 */
export function lockDocument(document: Document, userId: string, userRole: UserRole): LockResult {
  // Check permissions
  if (!canLockUnlock(userRole)) {
    return {
      success: false,
      error: 'You do not have permission to lock documents'
    }
  }

  // Check if already locked
  if (document.isLocked) {
    return {
      success: false,
      error: `Document is already locked by ${document.lockedBy === userId ? 'you' : 'another user'}`
    }
  }

  // Check if document has pending signatures
  if (document.requiresSignatures && document.signatures.length > 0) {
    return {
      success: false,
      error: 'Cannot lock document with active signatures. Signatures will be invalidated.'
    }
  }

  // Lock the document
  const lockedDocument: Document = {
    ...document,
    isLocked: true,
    lockedBy: userId,
    lockedAt: new Date(),
    updatedAt: new Date()
  }

  return {
    success: true,
    document: lockedDocument
  }
}

/**
 * Unlock a document
 */
export function unlockDocument(document: Document, userId: string, userRole: UserRole): LockResult {
  // Check permissions
  if (!canLockUnlock(userRole)) {
    return {
      success: false,
      error: 'You do not have permission to unlock documents'
    }
  }

  // Check if document is locked
  if (!document.isLocked) {
    return {
      success: false,
      error: 'Document is not locked'
    }
  }

  // Check if user can unlock (admin/commodore can unlock any, or if user locked it)
  const canUnlock = userRole === 'super-admin' || userRole === 'commodore' || document.lockedBy === userId
  
  if (!canUnlock) {
    return {
      success: false,
      error: 'You can only unlock documents you have locked'
    }
  }

  // Unlock the document
  const unlockedDocument: Document = {
    ...document,
    isLocked: false,
    lockedBy: undefined,
    lockedAt: undefined,
    updatedAt: new Date()
  }

  return {
    success: true,
    document: unlockedDocument
  }
}

/**
 * Check if a user can edit a locked document
 */
export function canEditLockedDocument(document: Document, userId: string, userRole: UserRole): boolean {
  if (!document.isLocked) {
    return true
  }

  // Super admin and commodore can edit any locked document
  if (userRole === 'super-admin' || userRole === 'commodore') {
    return true
  }

  // User can edit if they locked the document
  return document.lockedBy === userId
}

/**
 * Validate lock status before performing operations
 */
export function validateLockForOperation(
  document: Document, 
  userId: string, 
  operation: 'edit' | 'delete' | 'approve' | 'move'
): { valid: boolean; error?: string } {
  if (!document.isLocked) {
    return { valid: true }
  }

  // Check if user locked the document
  if (document.lockedBy === userId) {
    return { valid: true }
  }

  const operationNames = {
    edit: 'edit',
    delete: 'delete',
    approve: 'approve',
    move: 'move'
  }

  return {
    valid: false,
    error: `Cannot ${operationNames[operation]} document: it is locked by another user`
  }
}

/**
 * Auto-unlock document when creating new version (invalidates signatures)
 */
export function autoUnlockForNewVersion(document: Document): Document {
  if (!document.isLocked) {
    return document
  }

  // Auto-unlock when creating new version as it invalidates signatures
  return {
    ...document,
    isLocked: false,
    lockedBy: undefined,
    lockedAt: undefined,
    // Signatures are already invalidated in version creation logic
  }
}

/**
 * Get lock status description for UI
 */
export function getLockStatusDescription(document: Document): string {
  if (!document.isLocked) {
    return 'Document is unlocked and can be edited'
  }

  const lockedDate = document.lockedAt ? ` on ${document.lockedAt.toLocaleDateString()}` : ''
  return `Document is locked by user ${document.lockedBy}${lockedDate}`
}

/**
 * Check for lock conflicts when multiple users try to edit
 */
export function detectLockConflict(
  currentDocument: Document, 
  lastKnownVersion: number,
  userId: string
): { hasConflict: boolean; message?: string } {
  // Check if document version has changed (someone else made changes)
  if (currentDocument.version !== lastKnownVersion) {
    return {
      hasConflict: true,
      message: 'Document has been modified by another user. Please refresh to see the latest version.'
    }
  }

  // Check if document was locked by someone else
  if (currentDocument.isLocked && currentDocument.lockedBy !== userId) {
    return {
      hasConflict: true,
      message: `Document was locked by another user while you were editing.`
    }
  }

  return { hasConflict: false }
}

/**
 * Calculate lock duration for display
 */
export function getLockDuration(document: Document): string {
  if (!document.isLocked || !document.lockedAt) {
    return ''
  }

  const now = new Date()
  const lockTime = new Date(document.lockedAt)
  const diffMs = now.getTime() - lockTime.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

/**
 * Notification messages for lock operations
 */
export const lockNotifications = {
  locked: (documentName: string, userName: string) => 
    `Document "${documentName}" has been locked by ${userName}`,
  
  unlocked: (documentName: string, userName: string) => 
    `Document "${documentName}" has been unlocked by ${userName}`,
  
  lockExpired: (documentName: string) => 
    `Lock on document "${documentName}" has expired`,
  
  editBlocked: (documentName: string, lockerName: string) => 
    `Cannot edit "${documentName}": locked by ${lockerName}`,
  
  lockConflict: (documentName: string) => 
    `Lock conflict detected on "${documentName}". Please refresh and try again.`
}