import { useRef, useEffect } from 'react'
import type { DocumentFolder } from '@/types/documents'
import { useAuth } from '@/hooks/useAuth'

interface FolderContextMenuProps {
  folder: DocumentFolder
  isVisible: boolean
  x: number
  y: number
  onClose: () => void
  onRenameFolder: (folder: DocumentFolder) => void
  onDeleteFolder: (folder: DocumentFolder) => void
  onMoveFolder: (folder: DocumentFolder) => void
  onCreateSubfolder?: (parentFolder: DocumentFolder) => void
  onViewFolderDetails?: (folder: DocumentFolder) => void
}

export default function FolderContextMenu({
  folder,
  isVisible,
  x,
  y,
  onClose,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder
}: FolderContextMenuProps) {
  const { profile } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)

  // Permission checks
  const canManageFolders = profile && (
    profile.role === 'super-admin' || 
    profile.role === 'commodore' || 
    profile.role === 'officer'
  )
  const canDeleteFolder = profile && (
    profile.role === 'super-admin' || 
    profile.role === 'commodore' ||
    folder.createdBy === profile.id
  )

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200)
  const adjustedY = Math.min(y, window.innerHeight - 150)

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* Move Folder */}
      {canManageFolders && (
        <button
          onClick={() => handleAction(() => onMoveFolder(folder))}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Move...
        </button>
      )}

      {/* Rename Folder */}
      {canManageFolders && (
        <button
          onClick={() => handleAction(() => onRenameFolder(folder))}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Rename
        </button>
      )}

      {/* Delete Folder */}
      {canDeleteFolder && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => handleAction(() => onDeleteFolder(folder))}
            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </>
      )}
    </div>
  )
}