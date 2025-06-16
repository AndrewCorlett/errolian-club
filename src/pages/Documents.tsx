import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import FolderCard from '@/components/documents/FolderCard'
import DocumentCard from '@/components/documents/DocumentCard'
import DocumentViewer from '@/components/documents/DocumentViewer'
import DocumentUploadModal from '@/components/documents/DocumentUploadModal'
import { 
  mockDocuments, 
  searchDocuments, 
  getDocumentsByFolder, 
  getFoldersByParent,
  getRecentDocuments,
  getPopularDocuments 
} from '@/data/mockDocuments'
import type { Document, DocumentFolder, DocumentStatus } from '@/types/documents'
import { useUserStore } from '@/store/userStore'
import { hasPermission } from '@/types/user'

type ViewMode = 'folders' | 'all' | 'recent' | 'popular'
type SortOption = 'name' | 'date' | 'size' | 'downloads'

export default function Documents() {
  const { currentUser } = useUserStore()
  const [viewMode, setViewMode] = useState<ViewMode>('folders')
  const [currentFolder, setCurrentFolder] = useState<DocumentFolder | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [folderPath, setFolderPath] = useState<DocumentFolder[]>([])

  const canUpload = currentUser && hasPermission(currentUser.role, 'canCreateEvents')

  // Get current documents based on view mode and filters
  const getCurrentDocuments = () => {
    let documents: Document[] = []

    switch (viewMode) {
      case 'folders':
        documents = getDocumentsByFolder(currentFolder?.id)
        break
      case 'recent':
        documents = getRecentDocuments()
        break
      case 'popular':
        documents = getPopularDocuments()
        break
      case 'all':
      default:
        documents = mockDocuments
        break
    }

    // Apply search filter
    if (searchQuery.trim()) {
      documents = searchDocuments(searchQuery.trim())
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      documents = documents.filter(doc => doc.status === statusFilter)
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        documents.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        break
      case 'size':
        documents.sort((a, b) => b.size - a.size)
        break
      case 'downloads':
        documents.sort((a, b) => b.downloadCount - a.downloadCount)
        break
      case 'name':
      default:
        documents.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return documents
  }

  const getCurrentFolders = () => {
    return getFoldersByParent(currentFolder?.id)
  }

  const handleFolderClick = (folder: DocumentFolder) => {
    setCurrentFolder(folder)
    setFolderPath(prev => [...prev, folder])
    setViewMode('folders')
  }

  const handleFolderNavigation = (index: number) => {
    if (index === -1) {
      // Go to root
      setCurrentFolder(null)
      setFolderPath([])
    } else {
      // Go to specific folder in path
      const newPath = folderPath.slice(0, index + 1)
      setCurrentFolder(newPath[newPath.length - 1])
      setFolderPath(newPath)
    }
  }

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document)
    setShowDocumentViewer(true)
  }

  const handleDocumentDownload = (document: Document) => {
    // Simulate download and increment count
    console.log('Downloading:', document.name)
    alert(`Downloaded: ${document.name}`)
  }

  const handleDocumentUpload = (documentData: Omit<Document, 'id' | 'uploadedAt' | 'updatedAt' | 'downloadCount' | 'version'>) => {
    const newDocument: Document = {
      id: `doc_${Date.now()}`,
      ...documentData,
      uploadedAt: new Date(),
      updatedAt: new Date(),
      downloadCount: 0,
      version: 1
    }
    
    console.log('Document uploaded:', newDocument)
    alert(`Document "${documentData.name}" uploaded successfully!`)
  }

  const handleDocumentApprove = (document: Document) => {
    console.log('Approving document:', document.name)
    alert(`Document "${document.name}" approved!`)
    setShowDocumentViewer(false)
  }

  const handleDocumentReject = (document: Document, reason: string) => {
    console.log('Rejecting document:', document.name, 'Reason:', reason)
    alert(`Document "${document.name}" rejected: ${reason}`)
    setShowDocumentViewer(false)
  }

  const currentDocuments = getCurrentDocuments()
  const currentFolders = getCurrentFolders()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Documents</h1>
                <p className="text-sm text-gray-600">Club files and resources</p>
              </div>
              {canUpload && (
                <Button onClick={() => setShowUploadModal(true)} size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload
                </Button>
              )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-64">
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
                className="w-32"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-32"
              >
                <option value="name">Name</option>
                <option value="date">Date</option>
                <option value="size">Size</option>
                <option value="downloads">Downloads</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-6xl mx-auto">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => {
              setViewMode('folders')
              setCurrentFolder(null)
              setFolderPath([])
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'folders' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📁 Folders
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'all' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📄 All Files
          </button>
          <button
            onClick={() => setViewMode('recent')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'recent' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🕒 Recent
          </button>
          <button
            onClick={() => setViewMode('popular')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'popular' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📈 Popular
          </button>
        </div>

        {/* Breadcrumb */}
        {viewMode === 'folders' && (
          <div className="flex items-center gap-2 mb-6 text-sm">
            <button
              onClick={() => handleFolderNavigation(-1)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              📁 Root
            </button>
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <button
                  onClick={() => handleFolderNavigation(index)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {folder.icon} {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {/* Folders (only in folder view) */}
          {viewMode === 'folders' && currentFolders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Folders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentFolders.map(folder => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={handleFolderClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {currentDocuments.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Documents ({currentDocuments.length})
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {currentDocuments.map(document => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onClick={handleDocumentClick}
                    showFolder={viewMode !== 'folders'}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No documents found' : 'No documents yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? `No documents match "${searchQuery}"`
                    : 'Start by uploading your first document'
                  }
                </p>
                {canUpload && !searchQuery && (
                  <Button onClick={() => setShowUploadModal(true)}>
                    Upload Document
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Document Viewer */}
        <DocumentViewer
          document={selectedDocument}
          isOpen={showDocumentViewer}
          onClose={() => setShowDocumentViewer(false)}
          onDownload={handleDocumentDownload}
          onApprove={handleDocumentApprove}
          onReject={handleDocumentReject}
        />

        {/* Upload Modal */}
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleDocumentUpload}
          initialFolderId={currentFolder?.id}
        />
      </div>
    </div>
  )
}