import type { Document, DocumentSignature } from '@/types/documents'
import { documentSignatureNotifications } from './notifications'

/**
 * Signature Validation Utilities
 * Handles signature workflow validation, invalidation, and state management
 */

export interface SignatureValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

/**
 * Validate if a user can sign a document
 */
export function canUserSign(document: Document, userId: string, userRole: string): SignatureValidationResult {
  // Check if document requires signatures
  if (!document.requiresSignatures) {
    return {
      valid: false,
      error: 'This document does not require signatures'
    }
  }

  // Check if user has already signed
  const existingSignature = document.signatures.find(sig => sig.userId === userId)
  if (existingSignature) {
    return {
      valid: false,
      error: 'You have already signed this document'
    }
  }

  // Check if user has permission to sign (officers and above)
  if (!['super-admin', 'commodore', 'officer'].includes(userRole)) {
    return {
      valid: false,
      error: 'You do not have permission to sign documents'
    }
  }

  // Check if document is locked (but allow signing on locked documents)
  const warnings: string[] = []
  if (document.isLocked) {
    warnings.push('Document is currently locked')
  }

  // Check deadline
  if (document.signatureDeadline && new Date() > document.signatureDeadline) {
    return {
      valid: false,
      error: 'Signature deadline has passed'
    }
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Validate signature data format and quality
 */
export function validateSignatureData(signatureData: string): SignatureValidationResult {
  // Check if signature data exists
  if (!signatureData || signatureData.trim() === '') {
    return {
      valid: false,
      error: 'Signature data is required'
    }
  }

  // Check if it's a valid data URL for images
  if (signatureData.startsWith('data:image/')) {
    // Basic validation for image data URLs
    const [header, data] = signatureData.split(',')
    if (!header || !data || data.length < 100) {
      return {
        valid: false,
        error: 'Signature appears to be too simple or invalid'
      }
    }
  } else if (typeof signatureData === 'string') {
    // For typed signatures, check minimum length
    if (signatureData.length < 2) {
      return {
        valid: false,
        error: 'Signature is too short'
      }
    }
  } else {
    return {
      valid: false,
      error: 'Invalid signature format'
    }
  }

  return { valid: true }
}

/**
 * Create a new signature record
 */
export function createSignature(
  documentId: string,
  userId: string,
  signatureData: string,
  ipAddress?: string
): DocumentSignature {
  return {
    id: `sig_${documentId}_${userId}_${Date.now()}`,
    documentId,
    userId,
    signedAt: new Date(),
    signatureData,
    ipAddress
  }
}

/**
 * Invalidate all signatures on a document
 */
export function invalidateSignatures(
  document: Document,
  reason: string
): Document {
  // Clear all signatures
  const updatedDocument: Document = {
    ...document,
    signatures: [],
    isLocked: false, // Unlock when signatures are invalidated
    updatedAt: new Date()
  }

  // Send notification
  documentSignatureNotifications.signaturesInvalidated(document.name, document.id)

  console.log(`Signatures invalidated for "${document.name}": ${reason}`)

  return updatedDocument
}

/**
 * Check if document modifications require signature invalidation
 */
export function shouldInvalidateSignatures(
  currentDocument: Document,
  updates: Partial<Document>
): boolean {
  // Changes that invalidate signatures
  const invalidatingChanges = [
    'name',
    'size',
    'mimeType',
    'url', // File content changed
    'description' // If description is critical content
  ]

  return invalidatingChanges.some(field => 
    field in updates && updates[field as keyof Document] !== currentDocument[field as keyof Document]
  )
}

/**
 * Process document update with signature validation
 */
export function processDocumentUpdate(
  currentDocument: Document,
  updates: Partial<Document>
): Document {
  let updatedDocument = { ...currentDocument, ...updates }

  // Check if signatures should be invalidated
  if (currentDocument.requiresSignatures && 
      currentDocument.signatures.length > 0 && 
      shouldInvalidateSignatures(currentDocument, updates)) {
    
    updatedDocument = invalidateSignatures(
      updatedDocument,
      'Document was modified'
    )
  }

  return updatedDocument
}

/**
 * Check if all required signatures are collected
 */
export function areAllSignaturesCollected(document: Document): boolean {
  if (!document.requiresSignatures) {
    return true // No signatures required
  }

  // In a real implementation, this would check against a list of required signers
  // For now, we'll consider it complete if there are any signatures
  return document.signatures.length > 0
}

/**
 * Auto-lock document when all signatures are collected
 */
export function checkAndLockIfComplete(document: Document): Document {
  if (areAllSignaturesCollected(document) && !document.isLocked) {
    const updatedDocument: Document = {
      ...document,
      isLocked: true,
      lockedBy: 'system', // Locked by system when signatures complete
      lockedAt: new Date()
    }

    // Send notification
    documentSignatureNotifications.allSignaturesComplete(document.name, document.id)

    return updatedDocument
  }

  return document
}

/**
 * Remove a signature from a document
 */
export function removeSignature(
  document: Document,
  signatureId: string,
  removedByUserId: string
): Document {
  const signature = document.signatures.find(sig => sig.id === signatureId)
  if (!signature) {
    throw new Error('Signature not found')
  }

  // Only allow users to remove their own signatures, or admins to remove any
  const canRemove = signature.userId === removedByUserId || 
                   ['super-admin', 'commodore'].includes(removedByUserId) // Assuming we have user role

  if (!canRemove) {
    throw new Error('You can only remove your own signature')
  }

  const updatedDocument: Document = {
    ...document,
    signatures: document.signatures.filter(sig => sig.id !== signatureId),
    isLocked: false, // Unlock when signature is removed
    updatedAt: new Date()
  }

  // Send notification (would need to get user name in real implementation)
  documentSignatureNotifications.signatureRemoved(document.name, 'User', document.id)

  return updatedDocument
}

/**
 * Add a signature to a document
 */
export function addSignature(
  document: Document,
  userId: string,
  userRole: string,
  signatureData: string,
  ipAddress?: string
): Document {
  // Validate user can sign
  const userValidation = canUserSign(document, userId, userRole)
  if (!userValidation.valid) {
    throw new Error(userValidation.error)
  }

  // Validate signature data
  const dataValidation = validateSignatureData(signatureData)
  if (!dataValidation.valid) {
    throw new Error(dataValidation.error)
  }

  // Create new signature
  const newSignature = createSignature(document.id, userId, signatureData, ipAddress)

  // Add signature to document
  let updatedDocument: Document = {
    ...document,
    signatures: [...document.signatures, newSignature],
    updatedAt: new Date()
  }

  // Check if document should be auto-locked
  updatedDocument = checkAndLockIfComplete(updatedDocument)

  // Send notification (would need to get user name in real implementation)
  documentSignatureNotifications.signatureCompleted(document.name, 'User', document.id)

  return updatedDocument
}

/**
 * Get signature progress information
 */
export function getSignatureProgress(document: Document): {
  collected: number
  required: number
  percentage: number
  isComplete: boolean
  missingSigners?: string[]
} {
  const collected = document.signatures.length
  const required = document.requiresSignatures ? Math.max(collected, 1) : 0 // Simplified logic
  const percentage = required > 0 ? (collected / required) * 100 : 100
  const isComplete = areAllSignaturesCollected(document)

  return {
    collected,
    required,
    percentage,
    isComplete
  }
}

/**
 * Check for signature deadline violations
 */
export function checkSignatureDeadlines(documents: Document[]): void {
  const now = new Date()
  
  documents.forEach(document => {
    if (!document.requiresSignatures || !document.signatureDeadline) {
      return
    }

    const timeUntilDeadline = document.signatureDeadline.getTime() - now.getTime()
    const hoursUntilDeadline = Math.floor(timeUntilDeadline / (1000 * 60 * 60))

    // Warn when 24 hours remaining
    if (hoursUntilDeadline === 24 && !areAllSignaturesCollected(document)) {
      documentSignatureNotifications.signatureDeadlineApproaching(
        document.name,
        document.id,
        24
      )
    }

    // Warn when deadline has passed
    if (timeUntilDeadline <= 0 && !areAllSignaturesCollected(document)) {
      const missingSigners = ['Missing signer info'] // In real app, calculate actual missing signers
      documentSignatureNotifications.signatureDeadlinePassed(
        document.name,
        document.id,
        missingSigners
      )
    }
  })
}