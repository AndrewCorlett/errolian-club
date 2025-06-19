import { useState } from 'react'
import { format } from 'date-fns'
import type { DocumentFolder } from '@/types/documents'
import { getDocumentsByFolder } from '@/data/mockDocuments'
import { getUserById } from '@/data/mockUsers'
import FolderContextMenu from './FolderContextMenu'

interface FolderCardProps {
  folder: DocumentFolder
  onClick: (folder: DocumentFolder) => void
  onContextMenuAction?: (action: string, folder: DocumentFolder) => void
  dragProps?: React.HTMLAttributes<HTMLDivElement>
  dropProps?: React.HTMLAttributes<HTMLDivElement>
  isDraggedOver?: boolean
}

export default function FolderCard({ 
  folder, 
  onClick, 
  onContextMenuAction,
  dragProps,
  dropProps,
  isDraggedOver 
}: FolderCardProps) {
  const documents = getDocumentsByFolder(folder.id)
  const creator = getUserById(folder.createdBy)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  
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

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleContextMenuAction = (action: string) => {
    onContextMenuAction?.(action, folder)
    setContextMenu(null)
  }

  return (
    <>
      <div
        {...dragProps}
        {...dropProps}
        onClick={() => onClick(folder)}
        onContextMenu={handleRightClick}
        className={`w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all-smooth text-left group hover-lift animate-fade-in-scale cursor-pointer ${
          isDraggedOver ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' : ''
        }`}
      >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg ${getFolderColorClass(folder.color)} group-hover:scale-110 transition-transform duration-200`}>
          <span className="text-xl">{folder.icon || '📁'}</span>
        </div>
        
        {!folder.isPublic && (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-gray-600">Private</span>
          </div>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {folder.name}
      </h3>
      
      {folder.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {folder.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{documents.length} {documents.length === 1 ? 'file' : 'files'}</span>
          <span>•</span>
          <span>By {creator?.name}</span>
        </div>
        <span>{format(folder.updatedAt, 'MMM d')}</span>
      </div>
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