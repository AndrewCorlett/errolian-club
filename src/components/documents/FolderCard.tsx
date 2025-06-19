import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { DocumentFolder } from '@/types/documents'
import { documentService } from '@/lib/database'
import FolderContextMenu from './FolderContextMenu'
import { Input } from '@/components/ui/input'

interface FolderCardProps {
  folder: DocumentFolder
  onClick: (folder: DocumentFolder) => void
  onContextMenuAction?: (action: string, folder: DocumentFolder) => void
  onRename?: (folder: DocumentFolder) => void
  isRenaming?: boolean
  renamingValue?: string
  onRenamingChange?: (value: string) => void
  dragProps?: React.HTMLAttributes<HTMLDivElement>
  dropProps?: React.HTMLAttributes<HTMLDivElement>
  isDraggedOver?: boolean
}

export default function FolderCard({ 
  folder, 
  onClick, 
  onContextMenuAction,
  onRename,
  isRenaming,
  renamingValue,
  onRenamingChange,
  dragProps,
  dropProps,
  isDraggedOver 
}: FolderCardProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [documentCount, setDocumentCount] = useState<number | null>(null)
  
  // Load document count
  useEffect(() => {
    const loadCount = async () => {
      try {
        const docs = await documentService.getDocuments(folder.id)
        setDocumentCount(docs.length)
      } catch (err) {
        console.error('Failed to load document count:', err)
        setDocumentCount(0)
      }
    }
    loadCount()
  }, [folder.id])
  
  const getFolderColorClass = (color?: string) => {
    const colors: Record<string, string> = {
      'blue': 'bg-blue-100 text-blue-800 border-blue-200',
      'red': 'bg-red-100 text-red-800 border-red-200',
      'green': 'bg-green-100 text-green-800 border-green-200',
      'purple': 'bg-purple-100 text-purple-800 border-purple-200',
      'pink': 'bg-pink-100 text-pink-800 border-pink-200',
      'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    return colors[color || 'blue']
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isRenaming) {
      e.stopPropagation()
      return
    }
    onClick(folder)
  }

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleContextMenuAction = (action: string) => {
    onContextMenuAction?.(action, folder)
    setContextMenu(null)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onRename?.(folder)
    } else if (e.key === 'Escape') {
      onRenamingChange?.(folder.name)
      onRename?.(folder)
    }
  }

  return (
    <>
      <div
        {...dragProps}
        {...dropProps}
        onClick={handleClick}
        onContextMenu={handleRightClick}
        className={`w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all-smooth text-left group hover-lift animate-fade-in-scale cursor-pointer ${
          isDraggedOver ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`p-3 rounded-lg ${getFolderColorClass(folder.color)} group-hover:scale-110 transition-transform duration-200`}>
            <span className="text-xl">{folder.icon || '📁'}</span>
          </div>
          
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
            dir
          </span>
        </div>

        {isRenaming ? (
          <Input
            type="text"
            value={renamingValue}
            onChange={(e) => onRenamingChange?.(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={() => onRename?.(folder)}
            autoFocus
            className="mb-2 text-sm font-semibold"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors truncate">
            {folder.name}
          </h3>
        )}
        
        {folder.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {folder.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{documentCount !== null ? `${documentCount} ${documentCount === 1 ? 'file' : 'files'}` : 'Loading...'}</span>
          <span>{format(folder.updatedAt, 'MMM d')}</span>
        </div>

        {/* Context Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleRightClick(e)
          }}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <FolderContextMenu
          folder={folder}
          isVisible={true}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCreateSubfolder={() => handleContextMenuAction('create-subfolder')}
          onRenameFolder={() => handleContextMenuAction('rename')}
          onDeleteFolder={() => handleContextMenuAction('delete')}
          onMoveFolder={() => handleContextMenuAction('move')}
          onViewFolderDetails={() => handleContextMenuAction('view-details')}
        />
      )}
    </>
  )
}