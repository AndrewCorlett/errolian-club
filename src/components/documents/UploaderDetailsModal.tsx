import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import type { Document } from '@/types/documents'

interface UploaderDetailsModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
}

// Mock function to get detailed user information - will be replaced with actual API call
const getUserDetails = (userId: string) => {
  const users = {
    'user_1': { 
      id: 'user_1', 
      name: 'John Smith', 
      email: 'john.smith@example.com',
      role: 'Officer',
      avatar: null,
      memberSince: '2023-01-15',
      phone: '+1 (555) 123-4567',
      bio: 'Experienced sailor and technology enthusiast. Passionate about sailing and club activities.',
      achievements: ['Certified Sailing Instructor', 'Race Committee Member', 'Safety Officer'],
      specialties: ['Navigation', 'Weather Routing', 'Boat Maintenance'],
      totalDocuments: 23,
      totalDownloads: 456,
      joinDate: '2023-01-15',
      lastActive: '2024-01-14T16:30:00Z',
      location: 'San Francisco, CA'
    },
    'user_2': { 
      id: 'user_2', 
      name: 'Sarah Johnson', 
      email: 'sarah.johnson@example.com', 
      role: 'Admin',
      avatar: null,
      memberSince: '2022-08-20',
      phone: '+1 (555) 987-6543',
      bio: 'Club administrator with over 10 years of sailing experience. Dedicated to maintaining high standards.',
      achievements: ['Club Administrator', 'Regatta Organizer', 'Youth Program Director'],
      specialties: ['Club Management', 'Event Planning', 'Youth Training'],
      totalDocuments: 67,
      totalDownloads: 1234,
      joinDate: '2022-08-20',
      lastActive: '2024-01-15T09:15:00Z',
      location: 'Berkeley, CA'
    },
  }
  return users[userId as keyof typeof users] || { 
    id: userId, 
    name: 'Unknown User', 
    email: 'unknown@example.com',
    role: 'Member',
    avatar: null,
    memberSince: 'Unknown',
    phone: 'Not available',
    bio: 'No bio available',
    achievements: [],
    specialties: [],
    totalDocuments: 0,
    totalDownloads: 0,
    joinDate: 'Unknown',
    lastActive: null,
    location: 'Unknown'
  }
}

// Mock function to get user's recent documents
const getUserRecentDocuments = () => {
  return [
    {
      id: 'doc_1',
      name: 'Racing Rules Update 2024.pdf',
      uploadedAt: '2024-01-10T14:30:00Z',
      status: 'approved',
      downloads: 23
    },
    {
      id: 'doc_2', 
      name: 'Safety Protocol Revision.docx',
      uploadedAt: '2024-01-08T11:15:00Z',
      status: 'pending',
      downloads: 8
    },
    {
      id: 'doc_3',
      name: 'Club Event Calendar.pdf', 
      uploadedAt: '2024-01-05T16:45:00Z',
      status: 'approved',
      downloads: 45
    }
  ]
}

export default function UploaderDetailsModal({
  document,
  isOpen,
  onClose
}: UploaderDetailsModalProps) {
  const [uploaderDetails, setUploaderDetails] = useState<any>(null)
  const [recentDocuments, setRecentDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (document && isOpen) {
      setLoading(true)
      // Simulate API call
      setTimeout(() => {
        const details = getUserDetails(document.uploadedBy)
        const recent = getUserRecentDocuments()
        setUploaderDetails(details)
        setRecentDocuments(recent)
        setLoading(false)
      }, 300)
    }
  }, [document, isOpen])

  if (!isOpen || !document) return null

  const handleContactUser = () => {
    if (uploaderDetails?.email) {
      window.location.href = `mailto:${uploaderDetails.email}?subject=Regarding: ${document.name}`
    }
  }

  const handleViewProfile = () => {
    // This would navigate to the user's full profile page
    console.log('View profile for user:', uploaderDetails?.id)
    alert(`View profile for ${uploaderDetails?.name} - this would navigate to their profile page`)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">Loading uploader details...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!uploaderDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="text-red-500">Failed to load uploader details</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                {uploaderDetails.avatar ? (
                  <img 
                    src={uploaderDetails.avatar} 
                    alt={uploaderDetails.name} 
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-blue-600">
                    {uploaderDetails.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                )}
              </div>
              <div>
                <CardTitle>{uploaderDetails.name}</CardTitle>
                <p className="text-sm text-gray-600">
                  {uploaderDetails.role} • Uploaded "{document.name}"
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleContactUser}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact
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
            {/* Basic Information */}
            <div className="border-b">
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Contact Information</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">{uploaderDetails.email}</span>
                </div>
                {uploaderDetails.phone !== 'Not available' && (
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">{uploaderDetails.phone}</span>
                  </div>
                )}
                {uploaderDetails.location !== 'Unknown' && (
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{uploaderDetails.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Member Information */}
            <div className="border-b">
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Membership Details</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Role:</span>
                    <div className="font-medium">{uploaderDetails.role}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Member Since:</span>
                    <div className="font-medium">
                      {format(new Date(uploaderDetails.joinDate), 'MMMM d, yyyy')}
                    </div>
                  </div>
                  {uploaderDetails.lastActive && (
                    <>
                      <div>
                        <span className="text-gray-600">Last Active:</span>
                        <div className="font-medium">
                          {format(new Date(uploaderDetails.lastActive), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Documents:</span>
                        <div className="font-medium">{uploaderDetails.totalDocuments}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {uploaderDetails.bio !== 'No bio available' && (
              <div className="border-b">
                <div className="px-6 py-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">About</h3>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-700">{uploaderDetails.bio}</p>
                </div>
              </div>
            )}

            {/* Achievements */}
            {uploaderDetails.achievements.length > 0 && (
              <div className="border-b">
                <div className="px-6 py-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Achievements</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {uploaderDetails.achievements.map((achievement: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {achievement}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Specialties */}
            {uploaderDetails.specialties.length > 0 && (
              <div className="border-b">
                <div className="px-6 py-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Specialties</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {uploaderDetails.specialties.map((specialty: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Document Upload Details */}
            <div className="border-b">
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Upload Details</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Uploaded:</span>
                    <div className="font-medium">
                      {format(document.uploadedAt, 'MMMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Version:</span>
                    <div className="font-medium">v{document.version}</div>
                  </div>
                </div>
                {document.description && (
                  <div>
                    <span className="text-gray-600 text-sm">Upload Notes:</span>
                    <div className="text-sm mt-1 p-3 bg-gray-50 rounded">
                      {document.description}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Documents */}
            <div>
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Recent Documents</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-3">
                  {recentDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{doc.name}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(doc.uploadedAt), 'MMM d, yyyy')} • {doc.downloads} downloads
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        doc.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : doc.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Total Downloads: {uploaderDetails.totalDownloads} • Total Documents: {uploaderDetails.totalDocuments}
            </div>
            <Button
              onClick={handleViewProfile}
              variant="outline"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              View Full Profile
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}