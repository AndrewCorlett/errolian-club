import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { format } from 'date-fns'
import type { DocumentVersion } from '@/types/documents'
import { formatFileSize } from '@/types/documents'

interface DocumentVersionComparisonProps {
  documentId: string
  version1Id?: string
  version2Id?: string
  isOpen: boolean
  onClose: () => void
  onDownloadVersion?: (versionId: string) => void
}

interface VersionDiff {
  field: string
  label: string
  version1Value: string
  version2Value: string
  hasChanged: boolean
}

// Mock function to get document versions - will be replaced with actual API call
const getDocumentVersions = (documentId: string): DocumentVersion[] => {
  return [
    {
      id: `${documentId}_v3`,
      documentId,
      version: 3,
      name: 'Project_Proposal_v3.pdf',
      size: 1024000,
      url: '/mock/document_v3.pdf',
      uploadedBy: 'user_1',
      uploadedAt: new Date('2024-01-15T10:30:00Z'),
      changeLog: 'Updated section 3 with new requirements and added appendix'
    },
    {
      id: `${documentId}_v2`,
      documentId,
      version: 2,
      name: 'Project_Proposal_v2.pdf',
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
      name: 'Project_Proposal_v1.pdf',
      size: 850000,
      url: '/mock/document_v1.pdf',
      uploadedBy: 'user_1',
      uploadedAt: new Date('2024-01-05T09:15:00Z'),
      changeLog: 'Initial version'
    }
  ]
}

// Mock function to get user by ID
const getUserById = (userId: string) => {
  const users = {
    'user_1': { id: 'user_1', name: 'John Smith', avatar: null },
    'user_2': { id: 'user_2', name: 'Sarah Johnson', avatar: null },
  }
  return users[userId as keyof typeof users] || { id: userId, name: 'Unknown User', avatar: null }
}

export default function DocumentVersionComparison({
  documentId,
  version1Id,
  version2Id,
  isOpen,
  onClose,
  onDownloadVersion
}: DocumentVersionComparisonProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [selectedVersion1, setSelectedVersion1] = useState<string>('')
  const [selectedVersion2, setSelectedVersion2] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true)
      // Simulate API call
      setTimeout(() => {
        const versionHistory = getDocumentVersions(documentId)
        setVersions(versionHistory)
        
        // Set initial selections
        if (version1Id) setSelectedVersion1(version1Id)
        if (version2Id) setSelectedVersion2(version2Id)
        
        setLoading(false)
      }, 500)
    }
  }, [isOpen, documentId, version1Id, version2Id])

  if (!isOpen) return null

  const version1 = versions.find(v => v.id === selectedVersion1)
  const version2 = versions.find(v => v.id === selectedVersion2)

  const generateDifferences = (v1: DocumentVersion, v2: DocumentVersion): VersionDiff[] => {
    return [
      {
        field: 'name',
        label: 'File Name',
        version1Value: v1.name,
        version2Value: v2.name,
        hasChanged: v1.name !== v2.name
      },
      {
        field: 'size',
        label: 'File Size',
        version1Value: formatFileSize(v1.size),
        version2Value: formatFileSize(v2.size),
        hasChanged: v1.size !== v2.size
      },
      {
        field: 'uploadedBy',
        label: 'Uploaded By',
        version1Value: getUserById(v1.uploadedBy).name,
        version2Value: getUserById(v2.uploadedBy).name,
        hasChanged: v1.uploadedBy !== v2.uploadedBy
      },
      {
        field: 'uploadedAt',
        label: 'Upload Date',
        version1Value: format(v1.uploadedAt, 'MMM d, yyyy h:mm a'),
        version2Value: format(v2.uploadedAt, 'MMM d, yyyy h:mm a'),
        hasChanged: v1.uploadedAt.getTime() !== v2.uploadedAt.getTime()
      },
      {
        field: 'changeLog',
        label: 'Changes',
        version1Value: v1.changeLog || 'No changelog',
        version2Value: v2.changeLog || 'No changelog',
        hasChanged: v1.changeLog !== v2.changeLog
      }
    ]
  }

  const differences = version1 && version2 ? generateDifferences(version1, version2) : []
  const changedFields = differences.filter(diff => diff.hasChanged)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Version Comparison</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Compare document versions side by side
              </p>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading versions...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Version Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version 1
                  </label>
                  <Select
                    value={selectedVersion1}
                    onChange={(e) => setSelectedVersion1(e.target.value)}
                    className="w-full"
                  >
                    <option value="">Select version...</option>
                    {versions.map(version => (
                      <option key={version.id} value={version.id}>
                        Version {version.version} - {version.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version 2
                  </label>
                  <Select
                    value={selectedVersion2}
                    onChange={(e) => setSelectedVersion2(e.target.value)}
                    className="w-full"
                  >
                    <option value="">Select version...</option>
                    {versions.map(version => (
                      <option key={version.id} value={version.id}>
                        Version {version.version} - {version.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Comparison Results */}
              {version1 && version2 ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Comparison Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Total Fields:</span>
                        <span className="ml-2 font-medium">{differences.length}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Changed:</span>
                        <span className="ml-2 font-medium text-orange-600">{changedFields.length}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Unchanged:</span>
                        <span className="ml-2 font-medium text-green-600">{differences.length - changedFields.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Version 1 */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Version {version1.version}
                          </CardTitle>
                          <Button
                            onClick={() => onDownloadVersion?.(version1.id)}
                            variant="outline"
                            size="sm"
                          >
                            Download
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {differences.map(diff => (
                          <div
                            key={diff.field}
                            className={`p-3 rounded-md ${
                              diff.hasChanged 
                                ? 'bg-red-50 border border-red-200' 
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="font-medium text-sm text-gray-700 mb-1">
                              {diff.label}
                            </div>
                            <div className={`text-sm ${
                              diff.hasChanged ? 'text-red-800' : 'text-gray-800'
                            }`}>
                              {diff.version1Value}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Version 2 */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Version {version2.version}
                          </CardTitle>
                          <Button
                            onClick={() => onDownloadVersion?.(version2.id)}
                            variant="outline"
                            size="sm"
                          >
                            Download
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {differences.map(diff => (
                          <div
                            key={diff.field}
                            className={`p-3 rounded-md ${
                              diff.hasChanged 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="font-medium text-sm text-gray-700 mb-1">
                              {diff.label}
                            </div>
                            <div className={`text-sm ${
                              diff.hasChanged ? 'text-green-800' : 'text-gray-800'
                            }`}>
                              {diff.version2Value}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Changes List */}
                  {changedFields.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Changes Detected</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {changedFields.map(diff => (
                            <div key={diff.field} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-md">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">
                                  {diff.label} changed
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className="text-red-600">From:</span> {diff.version1Value}
                                  <br />
                                  <span className="text-green-600">To:</span> {diff.version2Value}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* File Content Preview Note */}
                  <Card className="bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-blue-900">Content Comparison</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            File content comparison is currently showing metadata only. 
                            For detailed content differences, download both versions and use your preferred diff tool.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select Versions to Compare
                  </h3>
                  <p className="text-gray-600">
                    Choose two versions from the dropdowns above to see their differences.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}