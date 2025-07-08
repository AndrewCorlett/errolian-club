import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import FolderCard from '@/components/documents/FolderCard'
import DocumentCard from '@/components/documents/DocumentCard'
import DocumentViewer from '@/components/documents/DocumentViewer'
import DocumentUploadModal from '@/components/documents/DocumentUploadModal'
import FolderMoveModal from '@/components/documents/FolderMoveModal'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { roleBasedUI, filterByPermissions } from '@/utils/roleBasedUI'
import { documentService } from '@/lib/database'
import type { Document, DocumentFolder } from '@/types/documents'
import type { 
  Document as DocumentRow, 
  DocumentFolder as DocumentFolderRow
} from '@/types/supabase'
import { useAuth } from '@/hooks/useAuth'
import { lockDocument, unlockDocument, validateLockForOperation } from '@/utils/documentLocking'
import { documentLockNotifications, documentGeneralNotifications } from '@/utils/notifications'
import { useDocumentRealTime } from '@/hooks/useDocumentRealTime'
import RealTimeStatusIndicator from '@/components/documents/RealTimeStatusIndicator'

// Helper function to get proper document URL
const getDocumentUrl = async (storagePath: string, _documentId: string, isPublic: boolean = false): Promise<string> => {
  console.log('getDocumentUrl called with:', { storagePath, isPublic })
  
  try {
    // Always use signed URLs for better reliability and access control
    // This avoids issues with bucket public access configuration
    console.log('Generating signed URL for storage path:', storagePath)
    const { fileStorage } = await import('@/lib/fileStorage')
    const signedUrl = await fileStorage.createSignedUrl(storagePath, 3600) // 1 hour expiry
    console.log('Signed URL generated:', signedUrl)
    return signedUrl
  } catch {
    console.log(`File not found in storage: ${storagePath}`)
    
    // Return a placeholder URL for missing files
    const placeholderData = `File not found: ${storagePath}`
    return `data:text/plain;charset=utf-8,${encodeURIComponent(placeholderData)}`
  }
}

// Helper functions to convert database types to frontend types
const convertDocumentRowToDocument = async (row: DocumentRow): Promise<Document> => {
  // Get proper URL for the document
  const url = await getDocumentUrl(row.storage_path, row.id, row.is_public)
  
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    size: row.size_bytes,
    mimeType: row.mime_type,
    url: url, // Now using proper URL instead of just storage path
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
  }
}

const convertDocumentFolderRowToFolder = (row: DocumentFolderRow): DocumentFolder => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  parentId: row.parent_id, // Keep as null for top-level folders to match filter logic
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  isPublic: row.is_public,
  color: row.color || undefined,
  icon: row.icon || undefined,
})

export default function Documents() {
  const { profile } = useAuth()
  const [currentFolder, setCurrentFolder] = useState<DocumentFolder | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [folderPath, setFolderPath] = useState<DocumentFolder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  
  // Folder management state
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null)

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
        
        console.log('Documents: Converting document rows to documents...')
        const convertedDocuments = await Promise.all(
          documentsResponse.map(row => convertDocumentRowToDocument(row))
        )
        console.log('Documents: Converted documents:', convertedDocuments.length)
        
        // Filter out documents with placeholder URLs (missing files)  
        const validDocuments = convertedDocuments.filter(doc => {
          const isValid = !doc.url.startsWith('data:text/plain')
          if (!isValid) {
            console.log(`Filtering out document with missing file: ${doc.name}`)
          }
          return isValid
        })
        console.log('Documents: Valid documents after filtering:', validDocuments.length)
        
        setDocuments(validDocuments)
        
        let allFolders = foldersResponse.map(convertDocumentFolderRowToFolder)
        
        // Check if we need to seed default folders (only in root and if no folders exist)
        if (!currentFolder && allFolders.filter(f => !f.parentId).length === 0 && profile) {
          // Create default folders
          const defaultFolders = [
            { name: 'Board of Command', icon: '👑' },
            { name: 'Administrative Officer', icon: '📋' },
            { name: 'Miscellaneous', icon: '📦' }
          ]
          
          for (const folderData of defaultFolders) {
            try {
              await documentService.createFolder({
                name: folderData.name,
                icon: folderData.icon,
                parent_id: null,
                is_public: true,
                created_by: profile.id
              })
            } catch (err) {
              console.error('Failed to create default folder:', folderData.name, err)
            }
          }
          
          // Reload folders
          const updatedFolders = await documentService.getFolders()
          allFolders = updatedFolders.map(convertDocumentFolderRowToFolder)
        }
        
        setFolders(allFolders)
      } catch (err) {
        console.error('Failed to load documents:', err)
        setError('Failed to load documents')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentFolder, profile])

  // Get current documents
  const getCurrentDocuments = () => {
    let filteredDocuments = documents

    // Apply role-based permission filtering
    if (profile) {
      filteredDocuments = filterByPermissions(filteredDocuments, profile.role, profile.id, 'document')
    }

    return filteredDocuments.sort((a, b) => a.name.localeCompare(b.name))
  }

  const getCurrentFolders = () => {
    let filteredFolders = folders.filter(folder => 
      folder.parentId === (currentFolder?.id || null)
    )
    
    // Apply role-based permission filtering
    if (profile) {
      filteredFolders = filterByPermissions(filteredFolders, profile.role, profile.id, 'folder')
    }
    
    return filteredFolders.sort((a, b) => a.name.localeCompare(b.name))
  }

  const handleFolderClick = (folder: DocumentFolder) => {
    if (renamingFolder === folder.id) return // Don't navigate if renaming
    setCurrentFolder(folder)
    setFolderPath(prev => [...prev, folder])
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
      console.log('Document uploaded:', documentData)
      
      // Check if uploaded document belongs to current folder context
      const uploadedToCurrentFolder = (
        (currentFolder?.id === documentData.folderId) || 
        (!currentFolder && !documentData.folderId)
      )
      
      if (uploadedToCurrentFolder) {
        // Document belongs to current context - add to local state
        setDocuments(prev => [documentData, ...prev])
        console.log('Document added to current folder view')
      } else {
        // Document uploaded to different folder - provide navigation option
        const targetFolder = folders.find(f => f.id === documentData.folderId)
        const folderName = targetFolder?.name || 'Root'
        
        const shouldNavigate = confirm(
          `Document "${documentData.name}" was uploaded to "${folderName}" folder. ` +
          `Would you like to navigate there to see it?`
        )
        
        if (shouldNavigate) {
          if (documentData.folderId) {
            // Navigate to target folder
            const targetFolderObj = folders.find(f => f.id === documentData.folderId)
            if (targetFolderObj) {
              handleFolderClick(targetFolderObj)
            }
          } else {
            // Navigate to root
            handleFolderNavigation(-1)
          }
        } else {
          // Just reload current folder to maintain consistency
          const documentsResponse = await documentService.getDocuments(currentFolder?.id)
          const convertedDocs = await Promise.all(
            documentsResponse.map(row => convertDocumentRowToDocument(row))
          )
          setDocuments(convertedDocs)
        }
      }
      
      // Send notification
      if (profile) {
        documentGeneralNotifications.uploaded(documentData.name, profile.name, documentData.id)
      }
      
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
    console.log('View version history:', document.name)
  }

  const handleViewMetadata = (document: Document) => {
    console.log('View metadata:', document.name)
  }

  const handleViewUploaderDetails = (document: Document) => {
    console.log('View uploader details:', document.name)
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
    console.log('Move document to folder:', document.name)
    alert(`Move "${document.name}" to folder - this would open a folder selection modal`)
  }


  const handleCreateFolder = async () => {
    if (!profile || !canCreateFolder) return
    
    try {
      console.log('Creating new folder for user:', profile.id, 'in folder:', currentFolder?.id || 'root')
      const newFolder = await documentService.createFolder({
        name: 'New folder',
        parent_id: currentFolder?.id || null,
        is_public: true,
        created_by: profile.id,
        icon: '📁'
      })
      console.log('Successfully created folder:', newFolder)
      
      // Add to local state and start rename
      const folder = convertDocumentFolderRowToFolder(newFolder)
      setFolders(prev => [...prev, folder])
      setRenamingFolder(folder.id)
      setNewFolderName('New folder')
    } catch (err) {
      console.error('Failed to create folder:', err)
      alert('Failed to create folder: ' + (err as Error).message)
    }
  }

  // Cleanup function to remove orphaned document records
  const handleCleanupOrphanedDocuments = async () => {
    if (!profile) return
    
    const confirmCleanup = confirm(
      'This will remove document records from the database that reference missing files. ' +
      'This action cannot be undone. Continue?'
    )
    
    if (!confirmCleanup) return
    
    try {
      console.log('Starting cleanup of orphaned documents...')
      
      // Get all documents across all folders
      const allDocumentsPromises = []
      
      // Get documents in root (no folder)
      allDocumentsPromises.push(documentService.getDocuments())
      
      // Get documents in each folder
      for (const folder of folders) {
        allDocumentsPromises.push(documentService.getDocuments(folder.id))
      }
      
      const allDocumentArrays = await Promise.all(allDocumentsPromises)
      const allDocuments = allDocumentArrays.flat()
      
      console.log('Found', allDocuments.length, 'total documents in database across all folders')
      
      let removedCount = 0
      for (const doc of allDocuments) {
        try {
          // Test if the file exists by trying to create a signed URL
          const { fileStorage } = await import('@/lib/fileStorage')
          await fileStorage.createSignedUrl(doc.storage_path, 60) // Short expiry for test
          console.log('✅ File exists:', doc.storage_path)
        } catch {
          console.log('❌ File missing, removing database record:', doc.name, 'at', doc.storage_path)
          // File doesn't exist, remove the database record
          await documentService.deleteDocument(doc.id)
          removedCount++
        }
      }
      
      alert(`Cleanup complete! Removed ${removedCount} orphaned document records.`)
      
      // Reload the current folder view
      const documentsResponse = await documentService.getDocuments(currentFolder?.id)
      const convertedDocs = await Promise.all(
        documentsResponse.map(row => convertDocumentRowToDocument(row))
      )
      const validDocs = convertedDocs.filter(doc => !doc.url.startsWith('data:text/plain'))
      setDocuments(validDocs)
      
    } catch (err) {
      console.error('Cleanup failed:', err)
      alert('Cleanup failed: ' + (err as Error).message)
    }
  }


  const handleRenameFolder = async (folder: DocumentFolder) => {
    if (!newFolderName.trim() || newFolderName === folder.name) {
      setRenamingFolder(null)
      return
    }
    
    try {
      await documentService.updateFolder(folder.id, { name: newFolderName.trim() })
      setFolders(prev => prev.map(f => 
        f.id === folder.id ? { ...f, name: newFolderName.trim() } : f
      ))
      setRenamingFolder(null)
      setNewFolderName('')
    } catch (err) {
      console.error('Failed to rename folder:', err)
      alert('Failed to rename folder')
    }
  }

  const handleDeleteFolder = async (folder: DocumentFolder) => {
    if (!window.confirm(`Are you sure you want to delete folder "${folder.name}" and all its contents? This action cannot be undone.`)) {
      return
    }
    
    try {
      await documentService.deleteFolder(folder.id)
      setFolders(prev => prev.filter(f => f.id !== folder.id))
      // If we deleted the current folder, go back to parent
      if (currentFolder?.id === folder.id) {
        const parentIndex = folderPath.findIndex(f => f.id === folder.id) - 1
        handleFolderNavigation(parentIndex)
      }
    } catch (err) {
      console.error('Failed to delete folder:', err)
      alert('Failed to delete folder')
    }
  }

  const handleFolderContextMenuAction = (action: string, folder: DocumentFolder) => {
    switch (action) {
      case 'rename':
        setRenamingFolder(folder.id)
        setNewFolderName(folder.name)
        break
      case 'move':
        setSelectedFolder(folder)
        setShowMoveModal(true)
        break
      case 'delete':
        handleDeleteFolder(folder)
        break
    }
  }

  const handleMoveFolder = async (targetFolderId: string | null) => {
    if (!selectedFolder) return
    
    try {
      await documentService.updateFolder(selectedFolder.id, { 
        parent_id: targetFolderId 
      })
      
      // Update local state
      setFolders(prev => prev.map(f => 
        f.id === selectedFolder.id ? { ...f, parentId: targetFolderId || undefined } : f
      ))
      
      setShowMoveModal(false)
      setSelectedFolder(null)
    } catch (err) {
      console.error('Failed to move folder:', err)
      alert('Failed to move folder')
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Documents</h1>
                <p className="text-sm text-gray-600">Club files and resources</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <RealTimeStatusIndicator 
                  isConnected={isConnected}
                  connectionStatus={connectionStatus}
                  isRecovering={isRecovering}
                  onManualReconnect={manualReconnect}
                />
                {canUpload && (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setShowUploadModal(true)} size="sm" className="flex-shrink-0">
                      <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="hidden sm:inline">Upload</span>
                    </Button>
                    {canCreateFolder && (
                      <>
                        <Button 
                          onClick={handleCreateFolder}
                          variant="outline" 
                          size="sm"
                          className="flex-shrink-0"
                        >
                          <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="hidden sm:inline">Create Folder</span>
                        </Button>
                        <div className="hidden md:flex gap-2">
                          <Button 
                            onClick={handleCleanupOrphanedDocuments}
                            variant="outline" 
                            size="sm"
                            className="bg-red-100 text-red-800 border-red-300 flex-shrink-0"
                          >
                            🧹 <span className="hidden lg:inline ml-1">Cleanup DB</span>
                          </Button>
                          <Button 
                            onClick={async () => {
                              try {
                                const { fileStorage } = await import('@/lib/fileStorage')
                                const result = await fileStorage.testStorageBucket()
                                alert(`Storage Test Results:\nExists: ${result.exists}\nAccessible: ${result.accessible}\nCan Create Signed URLs: ${result.canCreateSignedUrls}\nError: ${result.error || 'None'}`)
                              } catch (err) {
                                alert('Storage test failed: ' + (err as Error).message)
                              }
                            }}
                            variant="outline" 
                            size="sm"
                            className="bg-blue-100 text-blue-800 border-blue-300 flex-shrink-0"
                          >
                            🔧 <span className="hidden lg:inline ml-1">Test Storage</span>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm overflow-x-auto pb-1">
            {currentFolder && (
              <button
                onClick={() => handleFolderNavigation(folderPath.length - 2)}
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-md hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <button
              onClick={() => handleFolderNavigation(-1)}
              className="text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0 px-2 py-1 rounded-md hover:bg-blue-50"
            >
              📁 <span className="hidden xs:inline">Root</span>
            </button>
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <button
                  onClick={() => handleFolderNavigation(index)}
                  className="text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0 px-2 py-1 rounded-md hover:bg-blue-50 max-w-[120px] truncate"
                  title={`${folder.icon} ${folder.name}`}
                >
                  <span className="hidden xs:inline">{folder.icon} </span>
                  <span className="truncate">{folder.name}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content - Root Drop Zone */}
        <div 
          {...getDropProps(currentFolder?.id || null)}
          className={`space-y-6 min-h-[400px] rounded-lg transition-colors ${
            isDraggedOver(currentFolder?.id || null) ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
          }`}
        >
          {/* Show only folders on root level, folders and documents on other levels */}
          {currentFolder === null ? (
            // Root level - only show folders
            <div>
              {currentFolders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {currentFolders.map(folder => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={handleFolderClick}
                      onContextMenuAction={handleFolderContextMenuAction}
                      onRename={renamingFolder === folder.id ? handleRenameFolder : undefined}
                      isRenaming={renamingFolder === folder.id}
                      renamingValue={renamingFolder === folder.id ? newFolderName : undefined}
                      onRenamingChange={setNewFolderName}
                      dragProps={getDragProps('folder', folder.id, folder)}
                      dropProps={getDropProps(folder.id)}
                      isDraggedOver={isDraggedOver(folder.id)}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No folders yet</h3>
                    <p className="text-gray-600 mb-4">Create your first folder to organize documents</p>
                    {canCreateFolder && (
                      <Button onClick={handleCreateFolder}>
                        Create Folder
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Inside a folder - show both folders and documents
            <>
              {/* Sub-folders */}
              {currentFolders.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Folders</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentFolders.map(folder => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        onClick={handleFolderClick}
                        onContextMenuAction={handleFolderContextMenuAction}
                        onRename={renamingFolder === folder.id ? handleRenameFolder : undefined}
                        isRenaming={renamingFolder === folder.id}
                        renamingValue={renamingFolder === folder.id ? newFolderName : undefined}
                        onRenamingChange={setNewFolderName}
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
                        showFolder={false}
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
                currentFolders.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Empty folder</h3>
                      <p className="text-gray-600 mb-4">This folder is empty. Upload a document to get started.</p>
                      {canUpload && (
                        <Button onClick={() => setShowUploadModal(true)}>
                          Upload Document
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </>
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
          availableFolders={folders}
        />

        {/* Folder Move Modal */}
        {showMoveModal && selectedFolder && (
          <FolderMoveModal
            folder={selectedFolder}
            currentParentId={selectedFolder.parentId}
            availableFolders={folders.filter(f => f.id !== selectedFolder.id)}
            onClose={() => {
              setShowMoveModal(false)
              setSelectedFolder(null)
            }}
            onMove={handleMoveFolder}
          />
        )}
      </div>
    </div>
  )
}