import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Document } from '@/types/documents'
import { getFileTypeFromMime, formatFileSize } from '@/types/documents'
import { mockFolders } from '@/data/mockDocuments'
import { useUserStore } from '@/store/userStore'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (documentData: Omit<Document, 'id' | 'uploadedAt' | 'updatedAt' | 'downloadCount' | 'version'>) => void
  initialFolderId?: string
}

interface FileWithPreview extends File {
  preview?: string
}

export default function DocumentUploadModal({ 
  isOpen, 
  onClose, 
  onUpload, 
  initialFolderId 
}: DocumentUploadModalProps) {
  const { currentUser } = useUserStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const [formData, setFormData] = useState({
    folderId: initialFolderId || '',
    description: '',
    tags: '',
    isPublic: true
  })
  const [dragActive, setDragActive] = useState(false)

  if (!isOpen || !currentUser) return null

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: FileWithPreview[] = Array.from(files).map(file => {
      const fileWithPreview = file as FileWithPreview
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file)
      }
      
      return fileWithPreview
    })

    setSelectedFiles(prev => [...prev, ...newFiles])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev]
      // Revoke object URL to prevent memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to upload')
      return
    }

    const tags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

    selectedFiles.forEach((file) => {
      const documentData: Omit<Document, 'id' | 'uploadedAt' | 'updatedAt' | 'downloadCount' | 'version'> = {
        name: file.name,
        type: getFileTypeFromMime(file.type),
        size: file.size,
        mimeType: file.type,
        url: `/uploads/${file.name}`, // In real app, this would be set after upload
        thumbnailUrl: file.preview,
        folderId: formData.folderId || undefined,
        uploadedBy: currentUser.id,
        status: 'pending',
        description: formData.description || undefined,
        tags,
        isPublic: formData.isPublic
      }

      onUpload(documentData)
    })

    // Reset form
    setSelectedFiles([])
    setFormData({
      folderId: initialFolderId || '',
      description: '',
      tags: '',
      isPublic: true
    })
    
    onClose()
  }

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
  const maxSize = 10 * 1024 * 1024 // 10MB limit

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Files
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Maximum file size: 10MB per file
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.txt"
                />
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Selected Files ({selectedFiles.length})
                  </h3>
                  <div className="text-sm text-gray-600">
                    Total: {formatFileSize(totalSize)}
                    {totalSize > maxSize && (
                      <span className="text-red-600 ml-2">Exceeds 10MB limit</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {file.preview ? (
                        <img 
                          src={file.preview} 
                          alt={file.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Document Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folder
                </label>
                <Select
                  value={formData.folderId}
                  onChange={(e) => setFormData(prev => ({ ...prev, folderId: e.target.value }))}
                >
                  <option value="">No folder (root)</option>
                  {mockFolders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.icon} {folder.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the documents (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <Input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Comma-separated tags (e.g., safety, equipment, training)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tags help organize and search for documents
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make documents public (visible to all club members)
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={selectedFiles.length === 0 || totalSize > maxSize}
              >
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : 'Files'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}