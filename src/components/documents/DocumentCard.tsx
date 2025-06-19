import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { Document } from '@/types/documents'
import { getDocumentStatusColor, getDocumentTypeColor, formatFileSize } from '@/types/documents'
import { userService } from '@/lib/database'
import DocumentContextMenu from './DocumentContextMenu'

interface DocumentCardProps {
  document: Document
  onClick: (document: Document) => void
  showFolder?: boolean
  onViewVersionHistory?: (document: Document) => void
  onViewMetadata?: (document: Document) => void
  onViewUploaderDetails?: (document: Document) => void
  onCopyLink?: (document: Document) => void
  onMoveToFolder?: (document: Document) => void
  onDelete?: (document: Document) => void
  onEdit?: (document: Document) => void
  onDownload?: (document: Document) => void
  dragProps?: React.HTMLAttributes<HTMLDivElement>
  isDraggedOver?: boolean
}

// Helper function to get abbreviated file type
function getAbbreviatedType(type: string): string {
  const abbreviations: Record<string, string> = {
    'pdf': 'doc',
    'doc': 'doc',
    'image': 'img',
    'video': 'vid',
    'audio': 'aud',
    'spreadsheet': 'xls',
    'other': 'file'
  }
  return abbreviations[type] || 'file'
}

export default function DocumentCard({ 
  document, 
  onClick,
  onViewVersionHistory,
  onViewMetadata,
  onViewUploaderDetails,
  onCopyLink,
  onMoveToFolder,
  onDelete,
  onEdit,
  onDownload,
  dragProps,
  isDraggedOver
}: DocumentCardProps) {
  const [uploader, setUploader] = useState<any>(null)

  useEffect(() => {
    const loadUploader = async () => {
      try {
        const user = await userService.getUser(document.uploadedBy)
        setUploader(user)
      } catch (error) {
        console.error('Failed to load uploader:', error)
      }
    }
    loadUploader()
  }, [document.uploadedBy])

  return (
    <div
      {...dragProps}
      onClick={() => onClick(document)}
      className={`w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all-smooth text-left group hover-lift animate-fade-in-scale cursor-pointer ${
        isDraggedOver ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* File Icon/Thumbnail */}
        <div className="flex-shrink-0">
          {document.thumbnailUrl ? (
            <img 
              src={document.thumbnailUrl} 
              alt={document.name}
              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getDocumentTypeColor(document.type)} group-hover:scale-110 transition-transform duration-200`}>
              <span className="text-xs font-medium">{getAbbreviatedType(document.type)}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors" title={document.name}>
              {document.name}
            </h3>
            <div className="flex items-center gap-2 ml-2">
              <span className={`text-xs px-2 py-1 rounded-md ${getDocumentStatusColor(document.status)}`}>
                {document.status}
              </span>
              {document.isLocked && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-md" title="Document is locked">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
              {document.requiresSignatures && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md" title="Requires signatures">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              )}
              {!document.isPublic && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md" title="Private document">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {document.description}
            </p>
          )}

          {/* Tags */}
          {document.tags.length > 0 && (
            <div className="flex items-center gap-1 mb-3 flex-wrap">
              {document.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                  {tag}
                </span>
              ))}
              {document.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{document.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                  {uploader?.avatar ? (
                    <img src={uploader.avatar} alt={uploader.name} className="w-4 h-4 rounded-full" />
                  ) : (
                    <span className="text-xs font-medium text-blue-600">
                      {uploader?.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  )}
                </div>
                <span>{uploader?.name}</span>
              </div>
              <span>•</span>
              <span>{formatFileSize(document.size)}</span>
              <span>•</span>
              <span>v{document.version}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{document.downloadCount}</span>
              </div>
              <span>{format(document.updatedAt, 'MMM d')}</span>
              
              {/* Context Menu */}
              <DocumentContextMenu
                document={document}
                onViewVersionHistory={onViewVersionHistory}
                onViewMetadata={onViewMetadata}
                onViewUploaderDetails={onViewUploaderDetails}
                onCopyLink={onCopyLink}
                onMoveToFolder={onMoveToFolder}
                onDelete={onDelete}
                onEdit={onEdit}
                onDownload={onDownload}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}