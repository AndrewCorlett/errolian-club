import { format } from 'date-fns'
import type { Document } from '@/types/documents'
import { getDocumentTypeIcon, getDocumentStatusColor, getDocumentTypeColor, formatFileSize } from '@/types/documents'
import { getUserById } from '@/data/mockUsers'

interface DocumentCardProps {
  document: Document
  onClick: (document: Document) => void
  showFolder?: boolean
}

export default function DocumentCard({ document, onClick }: DocumentCardProps) {
  const uploader = getUserById(document.uploadedBy)

  return (
    <button
      onClick={() => onClick(document)}
      className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all-smooth text-left group hover-lift animate-fade-in-scale"
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
              <span className="text-lg">{getDocumentTypeIcon(document.type)}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {document.name}
            </h3>
            <div className="flex items-center gap-2 ml-2">
              <span className={`text-xs px-2 py-1 rounded-md ${getDocumentStatusColor(document.status)}`}>
                {document.status}
              </span>
              {!document.isPublic && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                      {uploader?.name.split(' ').map(n => n[0]).join('')}
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
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}