import { useState } from 'react'
import { Lock, Unlock, AlertTriangle, User, Clock } from 'lucide-react'
import type { Document } from '../../types/documents'
import { useDocumentRealTime } from '../../hooks/useDocumentRealTime'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '@/components/ui/button'

// Simple badge component since we don't have the UI component
const Badge = ({ children, variant = 'default', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}) => (
  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
    variant === 'default' ? 'bg-blue-100 text-blue-800' :
    variant === 'secondary' ? 'bg-gray-100 text-gray-800' :
    variant === 'destructive' ? 'bg-red-100 text-red-800' :
    'bg-white text-gray-800 border border-gray-300'
  } ${className}`}>
    {children}
  </span>
)

// Simple alert components since we don't have the UI component
const Alert = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-start p-4 rounded-md border ${className}`}>
    {children}
  </div>
)

const AlertDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`ml-3 ${className}`}>
    {children}
  </div>
)

interface LiveDocumentLockStatusProps {
  document: Document
  onLockChange?: (isLocked: boolean, lockedBy?: string) => void
  showControls?: boolean
}

export default function LiveDocumentLockStatus({ 
  document, 
  onLockChange,
  showControls = true
}: LiveDocumentLockStatusProps) {
  const { profile } = useAuth()
  const [currentDocument, setCurrentDocument] = useState<Document>(document)
  const [lockAnimation, setLockAnimation] = useState<'locking' | 'unlocking' | null>(null)

  // Real-time lock status updates
  useDocumentRealTime({
    onDocumentLock: (updatedDocument) => {
      if (updatedDocument.id === document.id) {
        setCurrentDocument(updatedDocument)
        onLockChange?.(true, updatedDocument.lockedBy)
        
        // Trigger lock animation
        setLockAnimation('locking')
        setTimeout(() => setLockAnimation(null), 1500)
      }
    },
    onDocumentUnlock: (updatedDocument) => {
      if (updatedDocument.id === document.id) {
        setCurrentDocument(updatedDocument)
        onLockChange?.(false)
        
        // Trigger unlock animation
        setLockAnimation('unlocking')
        setTimeout(() => setLockAnimation(null), 1500)
      }
    }
  })

  const isLocked = currentDocument.isLocked
  const lockedBy = currentDocument.lockedBy
  const lockedAt = currentDocument.lockedAt
  const isLockedByCurrentUser = lockedBy === profile?.id

  const getLockStatusBadge = () => {
    if (!isLocked) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Unlock className="h-3 w-3" />
          Available
        </Badge>
      )
    }

    return (
      <Badge 
        variant={isLockedByCurrentUser ? 'default' : 'destructive'} 
        className={`flex items-center gap-1 transition-all duration-500 ${
          lockAnimation === 'locking' ? 'animate-pulse bg-red-500' : ''
        } ${
          lockAnimation === 'unlocking' ? 'animate-pulse bg-green-500' : ''
        }`}
      >
        <Lock className="h-3 w-3" />
        Locked
      </Badge>
    )
  }

  const handleToggleLock = async () => {
    // This would integrate with your document locking service
    console.log(`${isLocked ? 'Unlocking' : 'Locking'} document:`, document.id)
    
    if (isLocked) {
      // Trigger unlock animation
      setLockAnimation('unlocking')
      // TODO: Call actual unlock service
    } else {
      // Trigger lock animation
      setLockAnimation('locking')
      // TODO: Call actual lock service
    }
  }

  const canToggleLock = profile && (
    profile.role === 'super-admin' || 
    profile.role === 'commodore' ||
    profile.role === 'officer' || 
    isLockedByCurrentUser
  )

  const getLockTimeDisplay = () => {
    if (!lockedAt) return null
    
    const lockTime = new Date(lockedAt)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lockTime.getTime()) / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)} hours ago`
    } else {
      return lockTime.toLocaleDateString()
    }
  }

  return (
    <div className="space-y-3">
      {/* Lock Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getLockStatusBadge()}
          {isLocked && lockedBy && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <User className="h-3 w-3" />
              <span>
                {isLockedByCurrentUser ? 'You' : `User ${lockedBy}`}
              </span>
              {lockedAt && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{getLockTimeDisplay()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lock Controls */}
        {showControls && canToggleLock && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleLock}
            disabled={!!lockAnimation}
            className="flex items-center gap-1"
          >
            {lockAnimation ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : isLocked ? (
              <Unlock className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {isLocked ? 'Unlock' : 'Lock'}
          </Button>
        )}
      </div>

      {/* Lock Warning */}
      {isLocked && !isLockedByCurrentUser && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            This document is currently locked by another user. You cannot make changes until it's unlocked.
          </AlertDescription>
        </Alert>
      )}

      {/* Lock Information */}
      {isLocked && isLockedByCurrentUser && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            You have this document locked. Remember to unlock it when you're done editing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}