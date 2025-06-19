import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import FolderCard from '@/components/documents/FolderCard'
import DocumentCard from '@/components/documents/DocumentCard'
import DocumentViewer from '@/components/documents/DocumentViewer'
import DocumentUploadModal from '@/components/documents/DocumentUploadModal'
import DocumentVersionHistory from '@/components/documents/DocumentVersionHistory'
import DocumentVersionComparison from '@/components/documents/DocumentVersionComparison'
import DocumentMetadataModal from '@/components/documents/DocumentMetadataModal'
import UploaderDetailsModal from '@/components/documents/UploaderDetailsModal'
import FolderManagementModal, { type FolderFormData } from '@/components/documents/FolderManagementModal'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { roleBasedUI, filterByPermissions } from '@/utils/roleBasedUI'
import { documentService } from '@/lib/database'
import type { Document, DocumentFolder } from '@/types/documents'
import type { 
  Document as DocumentRow, 
  DocumentFolder as DocumentFolderRow, 
  DocumentStatus 
} from '@/types/supabase'
import { useAuth } from '@/hooks/useAuth'
import { lockDocument, unlockDocument, validateLockForOperation } from '@/utils/documentLocking'
import { documentLockNotifications, documentGeneralNotifications } from '@/utils/notifications'
import { useDocumentRealTime } from '@/hooks/useDocumentRealTime'
import RealTimeStatusIndicator from '@/components/documents/RealTimeStatusIndicator'

type ViewMode = 'folders' | 'all' | 'recent' | 'popular'
type SortOption = 'name' | 'date' | 'size' | 'downloads'

// Helper functions to convert database types to frontend types
const convertDocumentRowToDocument = (row: DocumentRow): Document => ({
  id: row.id,
  name: row.name,
  type: row.type,
  size: row.size_bytes,
  mimeType: row.mime_type,
  url: row.storage_path, // This might need to be converted to a full URL
  thumbnailUrl: row.thumbnail_path || undefined,
  folderId: row.folder_id || undefined,
  uploadedBy: row.uploaded_by,
  uploadedAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  status: row.status,
  approvedBy: row.approved_by || undefined,
  approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
  rejectedReason: row.rejected_reason || undefined,
  description: row.description || undefined,
  tags: row.tags,
  isPublic: row.is_public,
  downloadCount: row.download_count,
  version: row.version,
  parentDocumentId: row.parent_document_id || undefined,
  // Document locking fields
  isLocked: row.is_locked || false,
  lockedBy: row.locked_by || undefined,
  lockedAt: row.locked_at ? new Date(row.locked_at) : undefined,
  // Document signature fields
  requiresSignatures: row.requires_signatures || false,
  signatures: (row.signatures as any) || [],
  signatureDeadline: row.signature_deadline ? new Date(row.signature_deadline) : undefined,
})

const convertDocumentFolderRowToFolder = (row: DocumentFolderRow): DocumentFolder => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  parentId: row.parent_id || undefined,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  isPublic: row.is_public,
  color: row.color || undefined,
  icon: row.icon || undefined,
})

export default function Documents() {
  const { profile } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('folders')
  const [currentFolder, setCurrentFolder] = useState<DocumentFolder | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showVersionComparison, setShowVersionComparison] = useState(false)
  const [showMetadataModal, setShowMetadataModal] = useState(false)
  const [showUploaderDetails, setShowUploaderDetails] = useState(false)
  const [comparisonVersions, setComparisonVersions] = useState<{ version1Id?: string, version2Id?: string }>({})
  const [folderPath, setFolderPath] = useState<DocumentFolder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Folder management state
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'rename' | 'move'>('create')
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null)
  const [parentFolder, setParentFolder] = useState<DocumentFolder | null>(null)

  // Role-based permissions
  const canUpload = profile && roleBasedUI.canShowUploadButton(profile.role)
  const canCreateFolder = profile && roleBasedUI.canShowCreateFolderButton(profile.role)

  // Enhanced folder navigation handlers (defined early for drag-drop hook)
  const handleMoveDocumentToFolder = async (documentId: string, targetFolderId: string | null) => {
    console.log('Moving document', documentId, 'to folder', targetFolderId)
    // TODO: Implement actual document move logic
    alert(`Moving document to ${targetFolderId ? 'folder' : 'root'}`)
  }

  const handleMoveFolderToFolder = async (folderId: string, targetFolderId: string | null) => {
    console.log('Moving folder', folderId, 'to folder', targetFolderId)
    // TODO: Implement actual folder move logic
    alert(`Moving folder to ${targetFolderId ? 'folder' : 'root'}`)
  }

  // Drag and drop integration
  const { getDragProps, getDropProps, isDraggedOver } = useDragAndDrop({
    onMoveDocument: handleMoveDocumentToFolder,
    onMoveFolder: handleMoveFolderToFolder
  })

  // Real-time updates integration
  const { isConnected, connectionStatus, isRecovering, manualReconnect } = useDocumentRealTime({
    onDocumentUpdate: (updatedDocument) => {
      setDocuments(prev => 
        prev.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
      )
    },
    onDocumentLock: (document) => {
      // Update document lock status in state
      setDocuments(prev => 
        prev.map(doc => doc.id === document.id ? { ...doc, ...document } : doc)
      )
    },
    onDocumentUnlock: (document) => {
      // Update document unlock status in state
      setDocuments(prev => 
        prev.map(doc => doc.id === document.id ? { ...doc, ...document } : doc)
      )
    },
    onSignatureUpdate: (signature) => {
      // Update document signatures in state
      setDocuments(prev => 
        prev.map(doc => {
          if (doc.id === signature.documentId) {
            const updatedSignatures = [...(doc.signatures || []), signature]
            return { ...doc, signatures: updatedSignatures }
          }
          return doc
        })
      )
    },
    onDocumentDelete: (documentId) => {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    }
  })

  // Load documents and folders
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [documentsResponse, foldersResponse] = await Promise.all([
          documentService.getDocuments(currentFolder?.id),
          documentService.getFolders()
        ])
        
        setDocuments(documentsResponse.map(convertDocumentRowToDocument))
        setFolders(foldersResponse.map(convertDocumentFolderRowToFolder))
      } catch (err) {
        console.error('Failed to load documents:', err)
        setError('Failed to load documents')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentFolder])

  // Get current documents based on view mode and filters
  const getCurrentDocuments = () => {
    let filteredDocuments = documents

    // Apply role-based permission filtering
    if (profile) {
      filteredDocuments = filterByPermissions(filteredDocuments, profile.role, profile.id, 'document')
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredDocuments = filteredDocuments.filter(doc => doc.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort documents
    switch (sortBy) {
      case 'name':
        return filteredDocuments.sort((a, b) => a.name.localeCompare(b.name))
      case 'date':
        return filteredDocuments.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      case 'size':
        return filteredDocuments.sort((a, b) => b.size - a.size)
      case 'downloads':
        return filteredDocuments.sort((a, b) => b.downloadCount - a.downloadCount)
      default:
        return filteredDocuments
    }
  }

  const getCurrentFolders = () => {
    let filteredFolders = folders.filter(folder => folder.parentId === (currentFolder?.id || null))
    
    // Apply role-based permission filtering
    if (profile) {
      filteredFolders = filterByPermissions(filteredFolders, profile.role, profile.id, 'folder')
    }
    
    return filteredFolders
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

  const handleDocumentUpload = async (documentData: Document) => {
    try {
      // The document has already been created by DocumentUploadModal's createDocumentWithFile()
      // We just need to add it to local state and handle UI updates
      
      console.log('Document uploaded:', documentData)
      
      // Add to local state to update UI immediately
      setDocuments(prev => [documentData, ...prev])
      
      // Send notification
      if (profile) {
        documentGeneralNotifications.uploaded(documentData.name, profile.name, documentData.id)
      }
      
      alert(`Document "${documentData.name}" uploaded successfully!`)
    } catch (error) {
      console.error('Failed to handle uploaded document:', error)
      alert('Failed to handle uploaded document. Please try again.')
    }
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

  const handleDocumentLock = (document: Document) => {
    if (!profile) return

    const result = lockDocument(document, profile.id, profile.role)
    
    if (result.success && result.document) {
      console.log('Document locked:', result.document)
      
      // Send notification
      documentLockNotifications.locked(document.name, profile.name, document.id)
      
      // Update the document in the list
      setDocuments(prev => prev.map(doc => 
        doc.id === document.id ? result.document! : doc
      ))
    } else {
      alert(result.error || 'Failed to lock document')
    }
  }

  const handleDocumentUnlock = (document: Document) => {
    if (!profile) return

    const result = unlockDocument(document, profile.id, profile.role)
    
    if (result.success && result.document) {
      console.log('Document unlocked:', result.document)
      
      // Send notification
      documentLockNotifications.unlocked(document.name, profile.name, document.id)
      
      // Update the document in the list
      setDocuments(prev => prev.map(doc => 
        doc.id === document.id ? result.document! : doc
      ))
    } else {
      alert(result.error || 'Failed to unlock document')
    }
  }

  const handleDocumentEditWithValidation = (document: Document) => {
    if (!profile) return

    // Validate lock status before editing
    const validation = validateLockForOperation(document, profile.id, 'edit')
    
    if (!validation.valid) {
      // Send notification for blocked edit
      documentLockNotifications.editBlocked(document.name, document.lockedBy || 'another user', document.id)
      return
    }

    // Proceed with edit
    console.log('Edit document:', document.name)
    alert(`Editing "${document.name}" - this would open the edit modal`)
  }

  const handleDocumentDeleteWithValidation = (document: Document) => {
    if (!profile) return

    // Validate lock status before deleting
    const validation = validateLockForOperation(document, profile.id, 'delete')
    
    if (!validation.valid) {
      // Send notification for blocked delete
      documentLockNotifications.editBlocked(document.name, document.lockedBy || 'another user', document.id)
      return
    }

    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete "${document.name}"?`)) {
      console.log('Delete document:', document.name)
      alert(`Document "${document.name}" deleted!`)
      
      // Remove from list
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))
      setShowDocumentViewer(false)
    }
  }

  // Context menu handlers
  const handleViewVersionHistory = (document: Document) => {
    setSelectedDocument(document)
    setShowVersionHistory(true)
  }

  const handleViewMetadata = (document: Document) => {
    setSelectedDocument(document)
    setShowMetadataModal(true)
  }

  const handleViewUploaderDetails = (document: Document) => {
    setSelectedDocument(document)
    setShowUploaderDetails(true)
  }

  const handleCopyLink = (document: Document) => {
    const link = `${window.location.origin}/documents/${document.id}`
    navigator.clipboard.writeText(link).then(() => {
      alert(`Link copied to clipboard: ${link}`)
    }).catch(err => {
      console.error('Failed to copy link:', err)
      alert('Failed to copy link to clipboard')
    })
  }

  const handleMoveToFolder = (document: Document) => {
    // This would open a folder selection modal
    console.log('Move document to folder:', document.name)
    alert(`Move "${document.name}" to folder - this would open a folder selection modal`)
  }

  const handleVersionRestore = (versionId: string) => {
    console.log('Restore version:', versionId)
    alert(`Restoring version ${versionId} - this would create a new version based on the selected one`)
  }

  const handleVersionDownload = (versionId: string) => {
    console.log('Download version:', versionId)
    alert(`Downloading version ${versionId}`)
  }

  const handleVersionCompare = (version1Id: string, version2Id: string) => {
    setComparisonVersions({ version1Id, version2Id })
    setShowVersionComparison(true)
  }


  const handleFolderContextMenuAction = (action: string, folder: DocumentFolder) => {
    switch (action) {
      case 'create-subfolder':
        setParentFolder(folder)
        setFolderModalMode('create')
        setShowFolderModal(true)
        break
      case 'rename':
        setSelectedFolder(folder)
        setFolderModalMode('rename')
        setShowFolderModal(true)
        break
      case 'move':
        setSelectedFolder(folder)
        setFolderModalMode('move')
        setShowFolderModal(true)
        break
      case 'delete':
        if (window.confirm(`Are you sure you want to delete folder "${folder.name}"? This action cannot be undone.`)) {
          console.log('Deleting folder:', folder.name)
          // TODO: Implement actual folder deletion
          alert(`Folder "${folder.name}" deleted`)
        }
        break
      case 'view-details':
        console.log('Viewing folder details:', folder.name)
        alert(`Viewing details for folder "${folder.name}"`)
        break
    }
  }

  const handleFolderManagement = async (data: FolderFormData) => {
    try {
      if (folderModalMode === 'create') {
        console.log('Creating folder:', data)
        // TODO: Implement actual folder creation
        alert(`Folder "${data.name}" created successfully!`)
      } else if (folderModalMode === 'rename' && selectedFolder) {
        console.log('Renaming folder:', selectedFolder.name, 'to', data.name)
        // TODO: Implement actual folder renaming
        alert(`Folder renamed to "${data.name}"`)
      } else if (folderModalMode === 'move' && selectedFolder) {
        console.log('Moving folder:', selectedFolder.name, 'to parent', data.parentId)
        // TODO: Implement actual folder moving
        alert(`Folder moved successfully`)
      }
    } catch (error) {
      console.error('Folder operation failed:', error)
      alert('Operation failed. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading documents...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  const currentDocuments = getCurrentDocuments()
  const currentFolders = getCurrentFolders()

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-primary-50 to-accent-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Documents</h1>
                <p className="text-sm text-gray-600">Club files and resources</p>
              </div>
              <div className="flex items-center gap-4">
                <RealTimeStatusIndicator 
                  isConnected={isConnected}
                  connectionStatus={connectionStatus}
                  isRecovering={isRecovering}
                  onManualReconnect={manualReconnect}
                />
                {canUpload && (
                  <>
                    <Button onClick={() => setShowUploadModal(true)} size="sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload
                    </Button>
                    {viewMode === 'folders' && canCreateFolder && (
                      <Button 
                        onClick={() => {
                          setParentFolder(currentFolder)
                          setFolderModalMode('create')
                          setShowFolderModal(true)
                        }} 
                        variant="outline" 
                        size="sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Folder
                      </Button>
                    )}
                  </>
                )}
              </div>
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
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Popular
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

        {/* Content - Root Drop Zone */}
        <div 
          {...getDropProps(currentFolder?.id || null)}
          className={`space-y-6 min-h-[400px] rounded-lg transition-colors ${
            isDraggedOver(currentFolder?.id || null) ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
          }`}
        >
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
                    onContextMenuAction={handleFolderContextMenuAction}
                    dragProps={getDragProps('folder', folder.id, folder)}
                    dropProps={getDropProps(folder.id)}
                    isDraggedOver={isDraggedOver(folder.id)}
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
                    onViewVersionHistory={handleViewVersionHistory}
                    onViewMetadata={handleViewMetadata}
                    onViewUploaderDetails={handleViewUploaderDetails}
                    onCopyLink={handleCopyLink}
                    onMoveToFolder={handleMoveToFolder}
                    onDelete={handleDocumentDeleteWithValidation}
                    onEdit={handleDocumentEditWithValidation}
                    onDownload={handleDocumentDownload}
                    dragProps={getDragProps('document', document.id, document)}
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
          onEdit={handleDocumentEditWithValidation}
          onDelete={handleDocumentDeleteWithValidation}
          onApprove={handleDocumentApprove}
          onReject={handleDocumentReject}
          onLock={handleDocumentLock}
          onUnlock={handleDocumentUnlock}
        />

        {/* Upload Modal */}
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleDocumentUpload}
          initialFolderId={currentFolder?.id}
        />

        {/* Version History Modal */}
        <DocumentVersionHistory
          document={selectedDocument!}
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          onRestoreVersion={handleVersionRestore}
          onDownloadVersion={handleVersionDownload}
          onCompareVersions={handleVersionCompare}
        />

        {/* Version Comparison Modal */}
        <DocumentVersionComparison
          documentId={selectedDocument?.id || ''}
          version1Id={comparisonVersions.version1Id}
          version2Id={comparisonVersions.version2Id}
          isOpen={showVersionComparison}
          onClose={() => setShowVersionComparison(false)}
          onDownloadVersion={handleVersionDownload}
        />

        {/* Document Metadata Modal */}
        <DocumentMetadataModal
          document={selectedDocument}
          isOpen={showMetadataModal}
          onClose={() => setShowMetadataModal(false)}
        />

        {/* Uploader Details Modal */}
        <UploaderDetailsModal
          document={selectedDocument}
          isOpen={showUploaderDetails}
          onClose={() => setShowUploaderDetails(false)}
        />

        {/* Folder Management Modal */}
        <FolderManagementModal
          isOpen={showFolderModal}
          mode={folderModalMode}
          folder={selectedFolder || undefined}
          parentFolder={parentFolder || undefined}
          availableFolders={folders}
          onClose={() => {
            setShowFolderModal(false)
            setSelectedFolder(null)
            setParentFolder(null)
          }}
          onConfirm={handleFolderManagement}
        />
      </div>
    </div>
  )
}