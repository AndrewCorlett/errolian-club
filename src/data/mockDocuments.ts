import type { Document, DocumentFolder, DocumentVersion } from '@/types/documents'

export const mockFolders: DocumentFolder[] = [
  {
    id: 'f1',
    name: 'Event Planning',
    description: 'Documents related to event planning and coordination',
    createdBy: '1',
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-06-20T14:30:00'),
    isPublic: true,
    color: 'blue',
    icon: 'calendar'
  },
  {
    id: 'f2',
    name: 'Safety & Training',
    description: 'Safety protocols, training materials, and certifications',
    createdBy: '2',
    createdAt: new Date('2024-02-10T09:00:00'),
    updatedAt: new Date('2024-05-15T16:45:00'),
    isPublic: true,
    color: 'red',
    icon: 'shield'
  },
  {
    id: 'f3',
    name: 'Club Administration',
    description: 'Meeting minutes, policies, and administrative documents',
    parentId: undefined,
    createdBy: '1',
    createdAt: new Date('2024-01-20T11:00:00'),
    updatedAt: new Date('2024-07-01T13:20:00'),
    isPublic: false,
    color: 'green',
    icon: 'clipboard'
  },
  {
    id: 'f4',
    name: 'Equipment Manuals',
    description: 'User manuals and maintenance guides for club equipment',
    parentId: 'f2',
    createdBy: '3',
    createdAt: new Date('2024-03-05T14:00:00'),
    updatedAt: new Date('2024-06-10T10:15:00'),
    isPublic: true,
    color: 'purple',
    icon: '🔧'
  },
  {
    id: 'f5',
    name: 'Photos & Videos',
    description: 'Event photos, promotional videos, and club memories',
    createdBy: '4',
    createdAt: new Date('2024-02-28T16:00:00'),
    updatedAt: new Date('2024-07-02T12:00:00'),
    isPublic: true,
    color: 'pink',
    icon: '📸'
  }
]

export const mockDocuments: Document[] = [
  {
    id: 'd1',
    name: 'Blue Mountains Risk Assessment.pdf',
    type: 'pdf',
    size: 2547892,
    mimeType: 'application/pdf',
    url: '/docs/blue-mountains-risk-assessment.pdf',
    folderId: 'f1',
    uploadedBy: '2',
    uploadedAt: new Date('2024-06-10T14:30:00'),
    updatedAt: new Date('2024-06-10T14:30:00'),
    status: 'approved',
    approvedBy: '1',
    approvedAt: new Date('2024-06-11T09:00:00'),
    description: 'Risk assessment for the Blue Mountains hiking adventure',
    tags: ['risk-assessment', 'hiking', 'blue-mountains'],
    isPublic: true,
    downloadCount: 12,
    version: 1,
    isLocked: false,
    requiresSignatures: false,
    signatures: []
  },
  {
    id: 'd2',
    name: 'Climbing Safety Guidelines.pdf',
    type: 'pdf',
    size: 1892456,
    mimeType: 'application/pdf',
    url: '/docs/climbing-safety-guidelines.pdf',
    folderId: 'f2',
    uploadedBy: '3',
    uploadedAt: new Date('2024-05-20T11:15:00'),
    updatedAt: new Date('2024-06-15T10:30:00'),
    status: 'approved',
    approvedBy: '2',
    approvedAt: new Date('2024-05-21T08:45:00'),
    description: 'Comprehensive safety guidelines for rock climbing activities',
    tags: ['safety', 'climbing', 'guidelines'],
    isPublic: true,
    downloadCount: 28,
    version: 2,
    isLocked: false,
    requiresSignatures: false,
    signatures: []
  },
  {
    id: 'd3',
    name: 'Club Constitution 2024.pdf',
    type: 'pdf',
    size: 892145,
    mimeType: 'application/pdf',
    url: '/docs/club-constitution-2024.pdf',
    folderId: 'f3',
    uploadedBy: '1',
    uploadedAt: new Date('2024-01-30T16:20:00'),
    updatedAt: new Date('2024-03-15T14:10:00'),
    status: 'approved',
    approvedBy: '1',
    approvedAt: new Date('2024-01-30T16:20:00'),
    description: 'Official club constitution and bylaws for 2024',
    tags: ['constitution', 'bylaws', 'official'],
    isPublic: false,
    downloadCount: 45,
    version: 3,
    isLocked: false,
    requiresSignatures: false,
    signatures: []
  },
  {
    id: 'd4',
    name: 'Equipment Checklist.xlsx',
    type: 'spreadsheet',
    size: 156789,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    url: '/docs/equipment-checklist.xlsx',
    folderId: 'f2',
    uploadedBy: '4',
    uploadedAt: new Date('2024-04-12T09:45:00'),
    updatedAt: new Date('2024-06-20T15:30:00'),
    status: 'approved',
    approvedBy: '3',
    approvedAt: new Date('2024-04-13T10:00:00'),
    description: 'Complete checklist of club equipment and maintenance schedules',
    tags: ['equipment', 'checklist', 'maintenance'],
    isPublic: true,
    downloadCount: 34,
    version: 4,
    isLocked: false,
    requiresSignatures: false,
    signatures: []
  },
  {
    id: 'd5',
    name: 'Blue Mountains Trip Photos.zip',
    type: 'other',
    size: 45678912,
    mimeType: 'application/zip',
    url: '/docs/blue-mountains-photos.zip',
    thumbnailUrl: '/images/blue-mountains-thumb.jpg',
    folderId: 'f5',
    uploadedBy: '6',
    uploadedAt: new Date('2024-07-18T20:30:00'),
    updatedAt: new Date('2024-07-18T20:30:00'),
    status: 'pending',
    description: 'Photo collection from the Blue Mountains hiking trip',
    tags: ['photos', 'blue-mountains', 'trip'],
    isPublic: true,
    downloadCount: 0,
    version: 1,
    isLocked: false,
    requiresSignatures: false,
    signatures: []
  },
  {
    id: 'd6',
    name: 'Kayak Maintenance Manual.pdf',
    type: 'pdf',
    size: 3245678,
    mimeType: 'application/pdf',
    url: '/docs/kayak-maintenance-manual.pdf',
    folderId: 'f4',
    uploadedBy: '2',
    uploadedAt: new Date('2024-03-25T13:15:00'),
    updatedAt: new Date('2024-03-25T13:15:00'),
    status: 'approved',
    approvedBy: '3',
    approvedAt: new Date('2024-03-26T09:30:00'),
    description: 'Complete maintenance guide for club kayaks',
    tags: ['kayak', 'maintenance', 'manual'],
    isPublic: true,
    downloadCount: 19,
    version: 1,
    isLocked: false,
    requiresSignatures: false,
    signatures: []
  },
  {
    id: 'd7',
    name: 'Emergency Contact List.docx',
    type: 'doc',
    size: 67890,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    url: '/docs/emergency-contacts.docx',
    folderId: 'f2',
    uploadedBy: '1',
    uploadedAt: new Date('2024-02-14T11:00:00'),
    updatedAt: new Date('2024-06-30T16:45:00'),
    status: 'approved',
    approvedBy: '1',
    approvedAt: new Date('2024-02-14T11:00:00'),
    description: 'Emergency contact information for all club activities',
    tags: ['emergency', 'contacts', 'safety'],
    isPublic: false,
    downloadCount: 23,
    version: 2,
    isLocked: false,
    requiresSignatures: false,
    signatures: []
  },
  {
    id: 'd8',
    name: 'Event Proposal Template.docx',
    type: 'doc',
    size: 234567,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    url: '/docs/event-proposal-template.docx',
    folderId: 'f1',
    uploadedBy: '3',
    uploadedAt: new Date('2024-05-05T14:20:00'),
    updatedAt: new Date('2024-05-05T14:20:00'),
    status: 'approved',
    approvedBy: '2',
    approvedAt: new Date('2024-05-06T10:15:00'),
    description: 'Template for submitting new event proposals',
    tags: ['template', 'event', 'proposal'],
    isPublic: true,
    downloadCount: 15,
    version: 1,
    isLocked: false,
    requiresSignatures: false,
    signatures: []
  }
]

export const mockDocumentVersions: DocumentVersion[] = [
  {
    id: 'v1',
    documentId: 'd2',
    version: 1,
    name: 'Climbing Safety Guidelines v1.pdf',
    size: 1756234,
    url: '/docs/versions/climbing-safety-guidelines-v1.pdf',
    uploadedBy: '3',
    uploadedAt: new Date('2024-05-20T11:15:00'),
    changeLog: 'Initial version'
  },
  {
    id: 'v2',
    documentId: 'd2',
    version: 2,
    name: 'Climbing Safety Guidelines v2.pdf',
    size: 1892456,
    url: '/docs/climbing-safety-guidelines.pdf',
    uploadedBy: '3',
    uploadedAt: new Date('2024-06-15T10:30:00'),
    changeLog: 'Added helmet requirements and updated emergency procedures'
  },
  {
    id: 'v3',
    documentId: 'd3',
    version: 1,
    name: 'Club Constitution 2024 v1.pdf',
    size: 745823,
    url: '/docs/versions/club-constitution-2024-v1.pdf',
    uploadedBy: '1',
    uploadedAt: new Date('2024-01-30T16:20:00'),
    changeLog: 'Initial 2024 constitution'
  },
  {
    id: 'v4',
    documentId: 'd3',
    version: 2,
    name: 'Club Constitution 2024 v2.pdf',
    size: 823456,
    url: '/docs/versions/club-constitution-2024-v2.pdf',
    uploadedBy: '1',
    uploadedAt: new Date('2024-02-28T14:15:00'),
    changeLog: 'Updated membership criteria and voting procedures'
  },
  {
    id: 'v5',
    documentId: 'd3',
    version: 3,
    name: 'Club Constitution 2024 v3.pdf',
    size: 892145,
    url: '/docs/club-constitution-2024.pdf',
    uploadedBy: '1',
    uploadedAt: new Date('2024-03-15T14:10:00'),
    changeLog: 'Added digital meeting provisions and updated officer responsibilities'
  }
]

export function getDocumentById(id: string): Document | undefined {
  return mockDocuments.find(doc => doc.id === id)
}

export function getFolderById(id: string): DocumentFolder | undefined {
  return mockFolders.find(folder => folder.id === id)
}

export function getDocumentsByFolder(folderId?: string): Document[] {
  return mockDocuments.filter(doc => doc.folderId === folderId)
}

export function getFoldersByParent(parentId?: string): DocumentFolder[] {
  return mockFolders.filter(folder => folder.parentId === parentId)
}

export function getDocumentVersions(documentId: string): DocumentVersion[] {
  return mockDocumentVersions.filter(version => version.documentId === documentId)
    .sort((a, b) => b.version - a.version)
}

export function searchDocuments(query: string): Document[] {
  const lowercaseQuery = query.toLowerCase()
  return mockDocuments.filter(doc =>
    doc.name.toLowerCase().includes(lowercaseQuery) ||
    doc.description?.toLowerCase().includes(lowercaseQuery) ||
    doc.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

export function getRecentDocuments(limit: number = 10): Document[] {
  return mockDocuments
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit)
}

export function getPopularDocuments(limit: number = 10): Document[] {
  return mockDocuments
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, limit)
}