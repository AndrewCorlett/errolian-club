import type { UserRole } from '@/types/user'
import type { Document, DocumentFolder } from '@/types/documents'
import { ROLE_PERMISSIONS } from '@/types/user'

// Role-based visibility helpers for UI components
export const roleBasedUI = {
  // Document operations visibility
  canShowUploadButton: (userRole: UserRole): boolean => {
    return ['super-admin', 'commodore', 'officer', 'member'].includes(userRole)
  },

  canShowCreateFolderButton: (userRole: UserRole): boolean => {
    return ROLE_PERMISSIONS[userRole]?.canManageFolders || false
  },

  canShowEditDocumentButton: (userRole: UserRole, document: Document, userId: string): boolean => {
    if (['super-admin', 'commodore'].includes(userRole)) return true
    if (userRole === 'officer' && document.status !== 'approved') return true
    return document.uploadedBy === userId && document.status === 'pending'
  },

  canShowDeleteDocumentButton: (userRole: UserRole, document: Document, userId: string): boolean => {
    if (['super-admin', 'commodore'].includes(userRole)) return true
    return document.uploadedBy === userId && document.status === 'pending'
  },

  canShowApproveRejectButtons: (userRole: UserRole, document: Document): boolean => {
    return ['super-admin', 'commodore', 'officer'].includes(userRole) && document.status === 'pending'
  },

  canShowLockUnlockButton: (userRole: UserRole): boolean => {
    return ['super-admin', 'commodore', 'officer'].includes(userRole)
  },

  canShowVersionHistoryButton: (userRole: UserRole): boolean => {
    return ['super-admin', 'commodore', 'officer', 'member'].includes(userRole)
  },

  canShowSignatureButton: (userRole: UserRole): boolean => {
    return ['super-admin', 'commodore', 'officer'].includes(userRole)
  },

  // Folder operations visibility
  canShowFolderContextMenu: (userRole: UserRole, folder: DocumentFolder, userId: string): boolean => {
    if (['super-admin', 'commodore'].includes(userRole)) return true
    if (userRole === 'officer') return true
    return folder.createdBy === userId
  },

  canShowDeleteFolderOption: (userRole: UserRole, folder: DocumentFolder, userId: string): boolean => {
    if (['super-admin', 'commodore'].includes(userRole)) return true
    return folder.createdBy === userId
  },

  canShowMoveFolderOption: (userRole: UserRole): boolean => {
    return ['super-admin', 'commodore', 'officer'].includes(userRole)
  },

  // Document viewing restrictions
  canViewDocument: (userRole: UserRole, document: Document, userId: string): boolean => {
    console.log('Permission check for document:', document.name, {
      userRole,
      userId,
      docIsPublic: document.isPublic,
      docStatus: document.status,
      docUploadedBy: document.uploadedBy
    })
    
    // Public documents can be viewed by all members
    if (document.isPublic) {
      console.log('Document is public - allowing access')
      return true
    }
    
    // Super-admin and commodore can view all documents
    if (['super-admin', 'commodore'].includes(userRole)) {
      console.log('User is super-admin/commodore - allowing access')
      return true
    }
    
    // Officers can view all approved and pending documents
    if (userRole === 'officer' && ['approved', 'pending'].includes(document.status)) {
      console.log('User is officer and doc is approved/pending - allowing access')
      return true
    }
    
    // Members can view approved documents and their own documents
    if (userRole === 'member') {
      const canView = document.status === 'approved' || document.uploadedBy === userId
      console.log('Member check:', { approved: document.status === 'approved', ownDoc: document.uploadedBy === userId, canView })
      return canView
    }
    
    // Note: guest role not defined in current UserRole type but included for future extensibility
    
    console.log('No permission rules matched - denying access')
    return false
  },

  canViewFolder: (userRole: UserRole, folder: DocumentFolder, userId: string): boolean => {
    // Public folders can be viewed by all members
    if (folder.isPublic) return true
    
    // Super-admin and commodore can view all folders
    if (['super-admin', 'commodore'].includes(userRole)) return true
    
    // Officers can view all folders
    if (userRole === 'officer') return true
    
    // Members can view public folders and their own folders
    if (userRole === 'member') {
      return folder.isPublic || folder.createdBy === userId
    }
    
    // Note: guest role not defined in current UserRole type but included for future extensibility
    return false
  },

  // Menu filtering
  getVisibleDocumentMenuOptions: (userRole: UserRole, document: Document, userId: string): string[] => {
    const options: string[] = []
    
    // Always show view metadata and download for viewable documents
    if (roleBasedUI.canViewDocument(userRole, document, userId)) {
      options.push('view-metadata', 'download', 'view-uploader-details')
    }
    
    // Version history for members and above
    if (roleBasedUI.canShowVersionHistoryButton(userRole)) {
      options.push('view-version-history')
    }
    
    // Copy link for all users who can view
    if (roleBasedUI.canViewDocument(userRole, document, userId)) {
      options.push('copy-link')
    }
    
    // Move to folder for officers and above
    if (['super-admin', 'commodore', 'officer'].includes(userRole)) {
      options.push('move-to-folder')
    }
    
    // Edit for eligible users
    if (roleBasedUI.canShowEditDocumentButton(userRole, document, userId)) {
      options.push('edit')
    }
    
    // Delete for eligible users
    if (roleBasedUI.canShowDeleteDocumentButton(userRole, document, userId)) {
      options.push('delete')
    }
    
    return options
  },

  getVisibleFolderMenuOptions: (userRole: UserRole, folder: DocumentFolder, userId: string): string[] => {
    const options: string[] = []
    
    // Always show view details for viewable folders
    if (roleBasedUI.canViewFolder(userRole, folder, userId)) {
      options.push('view-details')
    }
    
    // Create subfolder for officers and above
    if (roleBasedUI.canShowCreateFolderButton(userRole)) {
      options.push('create-subfolder')
    }
    
    // Rename for folder owners and officers/admins
    if (['super-admin', 'commodore', 'officer'].includes(userRole) || folder.createdBy === userId) {
      options.push('rename')
    }
    
    // Move folder for officers and above
    if (roleBasedUI.canShowMoveFolderOption(userRole)) {
      options.push('move')
    }
    
    // Delete for eligible users
    if (roleBasedUI.canShowDeleteFolderOption(userRole, folder, userId)) {
      options.push('delete')
    }
    
    return options
  },

  // Error messages for unauthorized actions
  getUnauthorizedMessage: (userRole: UserRole): string => {
    const roleMessages: Record<string, string> = {
      'guest': 'Guests have limited access. Please sign in for full features.',
      'member': 'This action requires officer privileges or higher.',
      'officer': 'This action requires commodore privileges or higher.',
      'commodore': 'This action requires super-admin privileges.',
      'super-admin': 'You have full access to all features.'
    }
    
    return roleMessages[userRole] || 'You do not have permission to perform this action.'
  }
}

// Helper function to filter arrays based on permissions
export const filterByPermissions = <T extends Document | DocumentFolder>(
  items: T[],
  userRole: UserRole,
  userId: string,
  type: 'document' | 'folder'
): T[] => {
  return items.filter(item => {
    if (type === 'document') {
      return roleBasedUI.canViewDocument(userRole, item as Document, userId)
    } else {
      return roleBasedUI.canViewFolder(userRole, item as DocumentFolder, userId)
    }
  })
}