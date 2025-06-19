import { useRef, useEffect } from 'react'
import type { DocumentFolder } from '@/types/documents'
import { useAuth } from '@/hooks/useAuth'

interface FolderContextMenuProps {
  folder: DocumentFolder
  isVisible: boolean
  x: number
  y: number
  onClose: () => void
  onCreateSubfolder: (parentFolder: DocumentFolder) => void
  onRenameFolder: (folder: DocumentFolder) => void
  onDeleteFolder: (folder: DocumentFolder) => void
  onMoveFolder: (folder: DocumentFolder) => void
  onViewFolderDetails: (folder: DocumentFolder) => void
}

export default function FolderContextMenu({
  folder,
  isVisible,
  x,
  y,
  onClose,
  onCreateSubfolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
  onViewFolderDetails
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
  const adjustedY = Math.min(y, window.innerHeight - 300)

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* View Details */}
      <button
        onClick={() => handleAction(() => onViewFolderDetails(folder))}
        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        View Details
      </button>

      <div className="border-t border-gray-100 my-1" />

      {/* Create Subfolder */}
      {canManageFolders && (
        <button
          onClick={() => handleAction(() => onCreateSubfolder(folder))}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Subfolder
        </button>
      )}

      {/* Rename Folder */}
      {canManageFolders && (
        <button
          onClick={() => handleAction(() => onRenameFolder(folder))}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Rename
        </button>
      )}

      {/* Move Folder */}
      {canManageFolders && (
        <button
          onClick={() => handleAction(() => onMoveFolder(folder))}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
          </svg>
          Move Folder
        </button>
      )}

      <div className="border-t border-gray-100 my-1" />

      {/* Delete Folder */}
      {canDeleteFolder && (
        <button
          onClick={() => handleAction(() => onDeleteFolder(folder))}
          className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Folder
        </button>
      )}
    </div>
  )
}