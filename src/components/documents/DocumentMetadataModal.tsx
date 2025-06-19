import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import type { Document } from '@/types/documents'
import { getDocumentTypeIcon, getDocumentStatusColor, formatFileSize } from '@/types/documents'
import { useAuth } from '@/hooks/useAuth'

interface DocumentMetadataModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
}

// Mock function to get user by ID - will be replaced with actual API call
const getUserById = (userId: string) => {
  const users = {
    'user_1': { 
      id: 'user_1', 
      name: 'John Smith', 
      email: 'john.smith@example.com',
      role: 'Officer',
      avatar: null,
      memberSince: '2023-01-15'
    },
    'user_2': { 
      id: 'user_2', 
      name: 'Sarah Johnson', 
      email: 'sarah.johnson@example.com', 
      role: 'Admin',
      avatar: null,
      memberSince: '2022-08-20'
    },
  }
  return users[userId as keyof typeof users] || { 
    id: userId, 
    name: 'Unknown User', 
    email: 'unknown@example.com',
    role: 'Member',
    avatar: null,
    memberSince: 'Unknown'
  }
}

export default function DocumentMetadataModal({
  document,
  isOpen,
  onClose
}: DocumentMetadataModalProps) {
  const { user } = useAuth()
  const [uploader, setUploader] = useState<any>(null)
  const [approver, setApprover] = useState<any>(null)
  const [locker, setLocker] = useState<any>(null)

  useEffect(() => {
    if (document) {
      setUploader(getUserById(document.uploadedBy))
      if (document.approvedBy) {
        setApprover(getUserById(document.approvedBy))
      }
      if (document.lockedBy) {
        setLocker(getUserById(document.lockedBy))
      }
    }
  }, [document])

  if (!isOpen || !document) return null

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} copied to clipboard!`)
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err)
      alert('Failed to copy to clipboard')
    })
  }

  const copyAllMetadata = () => {
    const metadata = `Document Metadata:
Name: ${document.name}
ID: ${document.id}
Type: ${document.mimeType}
Size: ${formatFileSize(document.size)}
Version: ${document.version}
Status: ${document.status}
Public: ${document.isPublic ? 'Yes' : 'No'}
Locked: ${document.isLocked ? 'Yes' : 'No'}
Requires Signatures: ${document.requiresSignatures ? 'Yes' : 'No'}
Uploaded: ${format(document.uploadedAt, 'MMMM d, yyyy h:mm a')}
Updated: ${format(document.updatedAt, 'MMMM d, yyyy h:mm a')}
Uploader: ${uploader?.name} (${uploader?.email})
Downloads: ${document.downloadCount}
Tags: ${document.tags.join(', ')}
${document.description ? `Description: ${document.description}` : ''}
${document.parentDocumentId ? `Parent Document: ${document.parentDocumentId}` : ''}
Storage Path: ${document.url}`

    copyToClipboard(metadata, 'All metadata')
  }

  const metadataItems = [
    {
      category: 'Basic Information',
      items: [
        { label: 'File Name', value: document.name, copyable: true },
        { label: 'Document ID', value: document.id, copyable: true, monospace: true },
        { label: 'File Type', value: document.mimeType, copyable: true },
        { label: 'File Size', value: formatFileSize(document.size) },
        { label: 'Version', value: `${document.version}` },
        { label: 'Status', value: document.status, badge: true },
        { label: 'Storage Path', value: document.url, copyable: true, monospace: true }
      ]
    },
    {
      category: 'Dates & Times',
      items: [
        { 
          label: 'Created', 
          value: format(document.uploadedAt, 'MMMM d, yyyy'),
          subtitle: format(document.uploadedAt, 'h:mm a')
        },
        { 
          label: 'Last Modified', 
          value: format(document.updatedAt, 'MMMM d, yyyy'),
          subtitle: format(document.updatedAt, 'h:mm a')
        },
        ...(document.approvedAt ? [{
          label: 'Approved', 
          value: format(document.approvedAt, 'MMMM d, yyyy'),
          subtitle: format(document.approvedAt, 'h:mm a')
        }] : []),
        ...(document.lockedAt ? [{
          label: 'Locked', 
          value: format(document.lockedAt, 'MMMM d, yyyy'),
          subtitle: format(document.lockedAt, 'h:mm a')
        }] : [])
      ]
    },
    {
      category: 'People',
      items: [
        { 
          label: 'Uploaded By', 
          value: uploader?.name,
          subtitle: `${uploader?.email} • ${uploader?.role}`,
          avatar: uploader?.avatar
        },
        ...(approver ? [{
          label: 'Approved By', 
          value: approver?.name,
          subtitle: `${approver?.email} • ${approver?.role}`,
          avatar: approver?.avatar
        }] : []),
        ...(locker ? [{
          label: 'Locked By', 
          value: locker?.name,
          subtitle: `${locker?.email} • ${locker?.role}`,
          avatar: locker?.avatar
        }] : [])
      ]
    },
    {
      category: 'Properties',
      items: [
        { label: 'Visibility', value: document.isPublic ? 'Public' : 'Private' },
        { label: 'Download Count', value: `${document.downloadCount}` },
        { label: 'Locked', value: document.isLocked ? 'Yes' : 'No' },
        { label: 'Requires Signatures', value: document.requiresSignatures ? 'Yes' : 'No' },
        { label: 'Signature Count', value: `${document.signatures.length}` },
        ...(document.parentDocumentId ? [{
          label: 'Parent Document', 
          value: document.parentDocumentId,
          copyable: true,
          monospace: true
        }] : []),
        ...(document.folderId ? [{
          label: 'Folder ID', 
          value: document.folderId,
          copyable: true,
          monospace: true
        }] : [])
      ]
    },
    ...(document.tags.length > 0 ? [{
      category: 'Tags',
      items: [
        { label: 'Tags', value: document.tags.join(', '), copyable: true }
      ]
    }] : []),
    ...(document.description ? [{
      category: 'Description',
      items: [
        { label: 'Description', value: document.description, copyable: true, multiline: true }
      ]
    }] : []),
    ...(document.rejectedReason ? [{
      category: 'Rejection Details',
      items: [
        { label: 'Rejection Reason', value: document.rejectedReason, copyable: true, multiline: true }
      ]
    }] : [])
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getDocumentTypeIcon(document.type)}</span>
              <div>
                <CardTitle>Document Metadata</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {document.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={copyAllMetadata}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All
              </Button>
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
          <div className="max-h-[60vh] overflow-y-auto">
            {metadataItems.map((category, categoryIndex) => (
              <div key={categoryIndex} className="border-b last:border-b-0">
                <div className="px-6 py-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">{category.category}</h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          {item.label}
                        </div>
                        <div className="flex items-start gap-3">
                          {'avatar' in item && item.avatar !== undefined && (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              {item.avatar ? (
                                <img 
                                  src={item.avatar} 
                                  alt={item.value || ''} 
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <span className="text-sm font-medium text-blue-600">
                                  {item.value?.split(' ').map((n: string) => n[0]).join('')}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className={`text-sm ${
                              'badge' in item && item.badge 
                                ? `inline-flex px-2 py-1 rounded-md ${getDocumentStatusColor(item.value || '')}`
                                : 'monospace' in item && item.monospace 
                                  ? 'font-mono bg-gray-100 px-2 py-1 rounded text-xs'
                                  : 'multiline' in item && item.multiline
                                    ? 'whitespace-pre-wrap'
                                    : ''
                            }`}>
                              {item.value || 'N/A'}
                            </div>
                            {'subtitle' in item && item.subtitle && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {'copyable' in item && item.copyable && item.value && (
                        <Button
                          onClick={() => copyToClipboard(item.value || '', item.label)}
                          variant="ghost"
                          size="sm"
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              Generated on {format(new Date(), 'MMMM d, yyyy h:mm a')}
            </div>
            <div>
              Viewing as: {user?.email} (User)
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}