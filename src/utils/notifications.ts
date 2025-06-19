/**
 * Notification System for Document Events
 * Handles in-app notifications for document lock status changes, signatures, etc.
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  documentId?: string
  userId?: string
}

// In-memory storage for demo - in real app this would be in state management or database
let notifications: Notification[] = []
let notificationListeners: Array<(notifications: Notification[]) => void> = []

/**
 * Add a new notification
 */
export function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
  const newNotification: Notification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    read: false
  }

  notifications.unshift(newNotification) // Add to beginning
  
  // Keep only last 50 notifications
  if (notifications.length > 50) {
    notifications = notifications.slice(0, 50)
  }

  // Notify listeners
  notificationListeners.forEach(listener => listener([...notifications]))
  
  // Auto-dismiss info notifications after 5 seconds
  if (notification.type === 'info') {
    setTimeout(() => {
      dismissNotification(newNotification.id)
    }, 5000)
  }
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId: string): void {
  const notification = notifications.find(n => n.id === notificationId)
  if (notification) {
    notification.read = true
    notificationListeners.forEach(listener => listener([...notifications]))
  }
}

/**
 * Dismiss/remove notification
 */
export function dismissNotification(notificationId: string): void {
  notifications = notifications.filter(n => n.id !== notificationId)
  notificationListeners.forEach(listener => listener([...notifications]))
}

/**
 * Get all notifications
 */
export function getNotifications(): Notification[] {
  return [...notifications]
}

/**
 * Get unread notifications count
 */
export function getUnreadCount(): number {
  return notifications.filter(n => !n.read).length
}

/**
 * Subscribe to notification changes
 */
export function subscribeToNotifications(callback: (notifications: Notification[]) => void): () => void {
  notificationListeners.push(callback)
  
  // Return unsubscribe function
  return () => {
    notificationListeners = notificationListeners.filter(listener => listener !== callback)
  }
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  notifications = []
  notificationListeners.forEach(listener => listener([]))
}

/**
 * Document Lock Notifications
 */
export const documentLockNotifications = {
  locked: (documentName: string, lockerName: string, documentId: string) => {
    addNotification({
      type: 'warning',
      title: 'Document Locked',
      message: `"${documentName}" has been locked by ${lockerName}`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  unlocked: (documentName: string, unlockerName: string, documentId: string) => {
    addNotification({
      type: 'success',
      title: 'Document Unlocked',
      message: `"${documentName}" has been unlocked by ${unlockerName}`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  editBlocked: (documentName: string, lockerName: string, documentId: string) => {
    addNotification({
      type: 'error',
      title: 'Edit Blocked',
      message: `Cannot edit "${documentName}" - it is locked by ${lockerName}`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  lockConflict: (documentName: string, documentId: string) => {
    addNotification({
      type: 'error',
      title: 'Lock Conflict',
      message: `Lock conflict detected on "${documentName}". Please refresh and try again.`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  }
}

/**
 * Document Signature Notifications
 */
export const documentSignatureNotifications = {
  signatureRequested: (documentName: string, requesterName: string, documentId: string, deadline?: Date) => {
    const deadlineText = deadline ? ` by ${deadline.toLocaleDateString()}` : ''
    addNotification({
      type: 'info',
      title: 'Signature Required',
      message: `${requesterName} has requested your signature on "${documentName}"${deadlineText}`,
      documentId,
      actionUrl: `/documents/${documentId}/sign`
    })
  },

  signatureCompleted: (documentName: string, signerName: string, documentId: string) => {
    addNotification({
      type: 'success',
      title: 'Document Signed',
      message: `${signerName} has signed "${documentName}"`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  signatureRemoved: (documentName: string, signerName: string, documentId: string) => {
    addNotification({
      type: 'warning',
      title: 'Signature Removed',
      message: `${signerName} removed their signature from "${documentName}"`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  allSignaturesComplete: (documentName: string, documentId: string) => {
    addNotification({
      type: 'success',
      title: 'All Signatures Collected',
      message: `All required signatures have been collected for "${documentName}"`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  signaturesInvalidated: (documentName: string, documentId: string) => {
    addNotification({
      type: 'warning',
      title: 'Signatures Invalidated',
      message: `Document "${documentName}" was modified - all signatures have been invalidated`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  signatureDeadlineApproaching: (documentName: string, documentId: string, hoursRemaining: number) => {
    addNotification({
      type: 'warning',
      title: 'Signature Deadline Approaching',
      message: `"${documentName}" signature deadline is in ${hoursRemaining} hours`,
      documentId,
      actionUrl: `/documents/${documentId}/sign`
    })
  },

  signatureDeadlinePassed: (documentName: string, documentId: string, missingSigners: string[]) => {
    addNotification({
      type: 'error',
      title: 'Signature Deadline Passed',
      message: `"${documentName}" deadline passed. Missing signatures from: ${missingSigners.join(', ')}`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  signatureRequestCancelled: (documentName: string, requesterName: string, documentId: string) => {
    addNotification({
      type: 'info',
      title: 'Signature Request Cancelled',
      message: `${requesterName} cancelled the signature request for "${documentName}"`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  }
}

/**
 * Document Version Notifications
 */
export const documentVersionNotifications = {
  newVersion: (documentName: string, version: number, uploaderName: string, documentId: string) => {
    addNotification({
      type: 'info',
      title: 'New Document Version',
      message: `${uploaderName} uploaded version ${version} of "${documentName}"`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  versionRestored: (documentName: string, restoredVersion: number, restorerName: string, documentId: string) => {
    addNotification({
      type: 'info',
      title: 'Version Restored',
      message: `${restorerName} restored version ${restoredVersion} of "${documentName}"`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  }
}

/**
 * Document General Notifications
 */
export const documentGeneralNotifications = {
  uploaded: (documentName: string, uploaderName: string, documentId: string) => {
    addNotification({
      type: 'success',
      title: 'Document Uploaded',
      message: `${uploaderName} uploaded "${documentName}"`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  approved: (documentName: string, approverName: string, documentId: string) => {
    addNotification({
      type: 'success',
      title: 'Document Approved',
      message: `${approverName} approved "${documentName}"`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  rejected: (documentName: string, rejectorName: string, reason: string, documentId: string) => {
    addNotification({
      type: 'error',
      title: 'Document Rejected',
      message: `${rejectorName} rejected "${documentName}": ${reason}`,
      documentId,
      actionUrl: `/documents/${documentId}`
    })
  },

  deleted: (documentName: string, deleterName: string) => {
    addNotification({
      type: 'warning',
      title: 'Document Deleted',
      message: `${deleterName} deleted "${documentName}"`
    })
  }
}

/**
 * Utility function to format notification time
 */
export function formatNotificationTime(timestamp: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - timestamp.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return timestamp.toLocaleDateString()
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons = {
    info: '📘',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  return icons[type]
}

/**
 * Get notification color classes based on type
 */
export function getNotificationColors(type: NotificationType): string {
  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  }
  return colors[type]
}