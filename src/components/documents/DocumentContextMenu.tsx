import { useState, useRef, useEffect } from 'react'
import type { Document } from '@/types/documents'
import { useAuth } from '@/hooks/useAuth'
import { roleBasedUI } from '@/utils/roleBasedUI'

interface DocumentContextMenuProps {
  document: Document
  onViewVersionHistory?: (document: Document) => void
  onViewMetadata?: (document: Document) => void
  onViewUploaderDetails?: (document: Document) => void
  onCopyLink?: (document: Document) => void
  onMoveToFolder?: (document: Document) => void
  onDelete?: (document: Document) => void
  onEdit?: (document: Document) => void
  onDownload?: (document: Document) => void
}

export default function DocumentContextMenu({
  document,
  onViewVersionHistory,
  onViewMetadata,
  onViewUploaderDetails,
  onCopyLink,
  onMoveToFolder,
  onDelete,
  onEdit,
  onDownload
}: DocumentContextMenuProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Permission checks using role-based UI
  const visibleOptions = user ? roleBasedUI.getVisibleDocumentMenuOptions(user.role as any, document, user.id) : []

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      window.document.addEventListener('mousedown', handleClickOutside)
      return () => window.document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    if (isOpen) {
      window.document.addEventListener('keydown', handleKeyDown)
      return () => window.document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text)
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err)
    })
  }

  const menuItems = [
    {
      id: 'view-version-history',
      label: 'View Version History',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => onViewVersionHistory?.(document)
    },
    {
      id: 'view-metadata',
      label: 'View Metadata',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => onViewMetadata?.(document)
    },
    {
      id: 'view-uploader-details',
      label: 'View Uploader Details',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => onViewUploaderDetails?.(document)
    },
    {
      id: 'copy-link',
      label: 'Copy Link',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      onClick: () => {
        const link = `${window.location.origin}/documents/${document.id}`
        copyToClipboard(link)
        onCopyLink?.(document)
      }
    },
    {
      id: 'download',
      label: 'Download',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      onClick: () => onDownload?.(document)
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: () => onEdit?.(document),
      disabled: document.isLocked && document.lockedBy !== user?.id
    },
    {
      id: 'move-to-folder',
      label: 'Move to Folder',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      onClick: () => onMoveToFolder?.(document)
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: () => onDelete?.(document),
      className: 'text-red-600 hover:bg-red-50',
      disabled: document.isLocked && document.lockedBy !== user?.id
    }
  ].filter(item => visibleOptions.includes(item.id))

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1 rounded-md hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="More actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-8 z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-fade-in-scale"
          role="menu"
          aria-orientation="vertical"
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                handleAction(item.onClick)
              }}
              disabled={item.disabled}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                item.className || 'text-gray-700'
              }`}
              role="menuitem"
            >
              {item.icon}
              {item.label}
              {item.disabled && (
                <svg className="w-3 h-3 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>
          ))}

          {/* Separator */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Document Info */}
          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span>Version {document.version}</span>
              <span>{document.downloadCount} downloads</span>
            </div>
            {document.isLocked && (
              <div className="flex items-center gap-1 mt-1 text-red-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Locked</span>
              </div>
            )}
            {document.requiresSignatures && (
              <div className="flex items-center gap-1 mt-1 text-purple-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>{document.signatures.length} signatures</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}