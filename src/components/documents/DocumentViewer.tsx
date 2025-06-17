import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import type { Document } from '@/types/documents'
import { getDocumentTypeIcon, getDocumentStatusColor, formatFileSize } from '@/types/documents'
import { getUserById } from '@/data/mockUsers'
import { getDocumentVersions } from '@/data/mockDocuments'
import { useUserStore } from '@/store/userStore'
import { hasPermission } from '@/types/user'

interface DocumentViewerProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (document: Document) => void
  onEdit?: (document: Document) => void
  onDelete?: (document: Document) => void
  onApprove?: (document: Document) => void
  onReject?: (document: Document, reason: string) => void
}

export default function DocumentViewer({
  document,
  isOpen,
  onClose,
  onDownload,
  onEdit,
  onDelete,
  onApprove,
  onReject
}: DocumentViewerProps) {
  const { currentUser } = useUserStore()
  const [showVersions, setShowVersions] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  if (!isOpen || !document) return null

  const uploader = getUserById(document.uploadedBy)
  const approver = document.approvedBy ? getUserById(document.approvedBy) : null
  const versions = getDocumentVersions(document.id)
  const canEdit = currentUser && (document.uploadedBy === currentUser.id || hasPermission(currentUser.role, 'canEditAllEvents'))
  const canDelete = currentUser && (document.uploadedBy === currentUser.id || hasPermission(currentUser.role, 'canDeleteAllEvents'))
  const canApprove = currentUser && hasPermission(currentUser.role, 'canApproveEvents') && document.status === 'pending'

  const handleDownload = () => {
    onDownload?.(document)
    // Simulate download
    const link = window.document.createElement('a')
    link.href = document.url
    link.download = document.name
    link.click()
  }

  const handleApprove = () => {
    onApprove?.(document)
  }

  const handleRejectSubmit = () => {
    if (rejectReason.trim()) {
      onReject?.(document, rejectReason.trim())
      setShowRejectModal(false)
      setRejectReason('')
    }
  }

  return (
    <>
      <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-scale custom-scrollbar">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{getDocumentTypeIcon(document.type)}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{document.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{formatFileSize(document.size)}</span>
                      <span>•</span>
                      <span>v{document.version}</span>
                      <span>•</span>
                      <span>{document.downloadCount} downloads</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-md ${getDocumentStatusColor(document.status)}`}>
                    {document.status}
                  </span>
                  {!document.isPublic && (
                    <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-800">
                      Private
                    </span>
                  )}
                  {document.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Description */}
            {document.description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{document.description}</p>
              </div>
            )}

            {/* Document Preview */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Preview</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {document.type === 'image' ? (
                  <img 
                    src={document.url} 
                    alt={document.name}
                    className="w-full h-64 object-cover"
                  />
                ) : document.type === 'pdf' ? (
                  <div className="h-64 bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-600">PDF Preview</p>
                      <p className="text-sm text-gray-500">Click download to view full document</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl mb-3 block">{getDocumentTypeIcon(document.type)}</span>
                      <p className="text-gray-600">File Preview</p>
                      <p className="text-sm text-gray-500">Click download to view file</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* File Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">File Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Uploaded by</div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        {uploader?.avatar ? (
                          <img src={uploader.avatar} alt={uploader.name} className="w-6 h-6 rounded-full" />
                        ) : (
                          <span className="text-xs font-medium text-blue-600">
                            {uploader?.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{uploader?.name}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Upload date</div>
                    <p className="font-medium">{format(document.uploadedAt, 'MMMM d, yyyy')}</p>
                    <p className="text-sm text-gray-500">{format(document.uploadedAt, 'h:mm a')}</p>
                  </div>

                  {document.approvedBy && document.approvedAt && (
                    <>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Approved by</div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            {approver?.avatar ? (
                              <img src={approver.avatar} alt={approver.name} className="w-6 h-6 rounded-full" />
                            ) : (
                              <span className="text-xs font-medium text-green-600">
                                {approver?.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">{approver?.name}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Approval date</div>
                        <p className="font-medium">{format(document.approvedAt, 'MMMM d, yyyy')}</p>
                        <p className="text-sm text-gray-500">{format(document.approvedAt, 'h:mm a')}</p>
                      </div>
                    </>
                  )}

                  <div>
                    <div className="text-sm text-gray-600 mb-1">File type</div>
                    <p className="font-medium">{document.mimeType}</p>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Last updated</div>
                    <p className="font-medium">{format(document.updatedAt, 'MMMM d, yyyy')}</p>
                    <p className="text-sm text-gray-500">{format(document.updatedAt, 'h:mm a')}</p>
                  </div>
                </div>

                {document.rejectedReason && (
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600 mb-1">Rejection reason</div>
                    <p className="text-red-600">{document.rejectedReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Version History */}
            {versions.length > 1 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Version History</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVersions(!showVersions)}
                    >
                      {showVersions ? 'Hide' : 'Show'} Versions
                    </Button>
                  </div>
                </CardHeader>
                {showVersions && (
                  <CardContent>
                    <div className="space-y-3">
                      {versions.map(version => (
                        <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Version {version.version}</p>
                            <p className="text-sm text-gray-600">{version.changeLog}</p>
                            <p className="text-xs text-gray-500">
                              {format(version.uploadedAt, 'MMM d, yyyy')} • {formatFileSize(version.size)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button onClick={handleDownload} variant="default">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </Button>
                
                {canApprove && (
                  <>
                    <Button onClick={handleApprove} variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </Button>
                    <Button 
                      onClick={() => setShowRejectModal(true)} 
                      variant="outline" 
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                {canEdit && (
                  <Button onClick={() => onEdit?.(document)} variant="outline" size="sm">
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button 
                    onClick={() => onDelete?.(document)} 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                )}
                <Button variant="outline" onClick={onClose} size="sm">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 modal-backdrop z-60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-md animate-fade-in-scale">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Document</h3>
              <p className="text-gray-600 mb-4">Please provide a reason for rejecting this document:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
              />
              <div className="flex items-center justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Reject Document
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}