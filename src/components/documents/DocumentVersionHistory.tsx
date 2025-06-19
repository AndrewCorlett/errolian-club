import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import type { Document, DocumentVersion } from '@/types/documents'
import { formatFileSize } from '@/types/documents'
import { useAuth } from '@/hooks/useAuth'
import { canEdit } from '@/utils/documentPermissions'

interface DocumentVersionHistoryProps {
  document: Document
  isOpen: boolean
  onClose: () => void
  onRestoreVersion?: (versionId: string) => void
  onDownloadVersion?: (versionId: string) => void
  onCompareVersions?: (version1Id: string, version2Id: string) => void
}

// Mock function to get document versions - will be replaced with actual API call
const getDocumentVersions = (documentId: string): DocumentVersion[] => {
  return [
    {
      id: `${documentId}_v3`,
      documentId,
      version: 3,
      name: 'Document v3.pdf',
      size: 1024000,
      url: '/mock/document_v3.pdf',
      uploadedBy: 'user_1',
      uploadedAt: new Date('2024-01-15T10:30:00Z'),
      changeLog: 'Updated section 3 with new requirements'
    },
    {
      id: `${documentId}_v2`,
      documentId,
      version: 2,
      name: 'Document v2.pdf',
      size: 980000,
      url: '/mock/document_v2.pdf',
      uploadedBy: 'user_2',
      uploadedAt: new Date('2024-01-10T14:20:00Z'),
      changeLog: 'Added appendix and fixed formatting issues'
    },
    {
      id: `${documentId}_v1`,
      documentId,
      version: 1,
      name: 'Document v1.pdf',
      size: 850000,
      url: '/mock/document_v1.pdf',
      uploadedBy: 'user_1',
      uploadedAt: new Date('2024-01-05T09:15:00Z'),
      changeLog: 'Initial version'
    }
  ]
}

// Mock function to get user by ID - will be replaced with actual API call
const getUserById = (userId: string) => {
  const users = {
    'user_1': { id: 'user_1', name: 'John Smith', avatar: null },
    'user_2': { id: 'user_2', name: 'Sarah Johnson', avatar: null },
  }
  return users[userId as keyof typeof users] || { id: userId, name: 'Unknown User', avatar: null }
}

export default function DocumentVersionHistory({
  document,
  isOpen,
  onClose,
  onRestoreVersion,
  onDownloadVersion,
  onCompareVersions
}: DocumentVersionHistoryProps) {
  const { user } = useAuth()
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && document) {
      setLoading(true)
      // Simulate API call
      setTimeout(() => {
        const versionHistory = getDocumentVersions(document.id)
        setVersions(versionHistory)
        setLoading(false)
      }, 500)
    }
  }, [isOpen, document])

  if (!isOpen) return null

  const userCanEdit = user && user.role && canEdit(user.role as any, document, user.id)

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      } else if (prev.length < 2) {
        return [...prev, versionId]
      } else {
        // Replace the first selected version
        return [prev[1], versionId]
      }
    })
  }

  const handleRestoreVersion = (versionId: string) => {
    if (window.confirm('Are you sure you want to restore this version? This will create a new version based on the selected one.')) {
      onRestoreVersion?.(versionId)
    }
  }

  const handleDownloadVersion = (versionId: string) => {
    onDownloadVersion?.(versionId)
  }

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      onCompareVersions?.(selectedVersions[0], selectedVersions[1])
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Version History</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {document.name} - {versions.length} versions
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedVersions.length === 2 && (
                <Button
                  onClick={handleCompareVersions}
                  variant="outline"
                  size="sm"
                >
                  Compare Selected
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading version history...</div>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              {versions.length > 0 ? (
                <div className="divide-y">
                  {versions.map((version) => {
                    const uploader = getUserById(version.uploadedBy)
                    const isSelected = selectedVersions.includes(version.id)
                    const isCurrent = version.version === document.version

                    return (
                      <div
                        key={version.id}
                        className={`p-6 hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleVersionSelect(version.id)}
                                className="rounded border-gray-300"
                                disabled={selectedVersions.length >= 2 && !isSelected}
                              />
                              <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                  Version {version.version}
                                  {isCurrent && (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
                                      Current
                                    </span>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {version.name}
                                </p>
                              </div>
                            </div>

                            {version.changeLog && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                  {version.changeLog}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  {uploader.avatar ? (
                                    <img
                                      src={uploader.avatar}
                                      alt={uploader.name}
                                      className="w-6 h-6 rounded-full"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium text-blue-600">
                                      {uploader.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  )}
                                </div>
                                <span>{uploader.name}</span>
                              </div>
                              <span>•</span>
                              <span>{formatFileSize(version.size)}</span>
                              <span>•</span>
                              <span>{format(version.uploadedAt, 'MMM d, yyyy h:mm a')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              onClick={() => handleDownloadVersion(version.id)}
                              variant="outline"
                              size="sm"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </Button>
                            
                            {userCanEdit && !isCurrent && (
                              <Button
                                onClick={() => handleRestoreVersion(version.id)}
                                variant="outline"
                                size="sm"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No version history</h3>
                  <p className="text-gray-600">This document has no previous versions.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {selectedVersions.length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            <p className="text-sm text-gray-600">
              {selectedVersions.length === 1
                ? '1 version selected'
                : `${selectedVersions.length} versions selected`}
              {selectedVersions.length === 2 && ' - Click "Compare Selected" to view differences'}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}