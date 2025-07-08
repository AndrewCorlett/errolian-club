import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useDarkMode } from '@/hooks/useDarkMode'

export default function Account() {
  const { user, profile, loading, signOut, updateProfile } = useAuth()
  const { isDark, setTheme } = useDarkMode()
  const [isEditing, setIsEditing] = useState(false)
  const [notifications, setNotifications] = useState({
    events: true,
    expenses: true,
    documents: false,
    system: true
  })
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: user?.email || ''
  })

  // Update form data when profile loads
  useEffect(() => {
    if (profile && user) {
      setFormData({
        name: profile.name,
        email: user.email || ''
      })
    }
  }, [profile, user])

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading account information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  const memberSinceDate = profile?.member_since ? format(new Date(profile.member_since), 'MMMM yyyy') : 'Unknown'
  const permissions = profile?.permissions ? 'Full access' : 'Member access'

  const handleSaveProfile = async () => {
    try {
      const { error } = await updateProfile({
        name: formData.name
      })
      
      if (error) {
        alert('Error updating profile: ' + error.message)
      } else {
        alert('Profile updated successfully!')
        setIsEditing(false)
      }
    } catch (error) {
      alert('Error updating profile')
      console.error('Profile update error:', error)
    }
  }

  const handleCancelEdit = () => {
    setFormData({
      name: profile?.name || '',
      email: user?.email || ''
    })
    setIsEditing(false)
  }

  const getRoleDisplayName = (role: string) => {
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'super-admin': 'bg-red-100 text-red-800 border-red-200',
      'commodore': 'bg-blue-100 text-blue-800 border-blue-200',
      'officer': 'bg-green-100 text-green-800 border-green-200',
      'member': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[role] || colors.member
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-50 via-primary-50 to-accent-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-primary-200 shadow-sm">
        <div className="px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-xl font-bold text-primary-900">Account</h1>
            <p className="text-sm text-primary-600">Manage your profile and preferences</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* Authentication Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">
                      {user ? 'Authenticated' : 'Not Authenticated'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {user ? `Logged in as ${user.email}` : 'Using mock authentication'}
                  </p>
                  {profile && (
                    <p className="text-sm text-gray-600">
                      Role: <span className="font-medium">{getRoleDisplayName(profile.role)}</span>
                    </p>
                  )}
                </div>
                {user && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      const { error } = await signOut()
                      if (error) {
                        alert('Error signing out: ' + error.message)
                      } else {
                        alert('Signed out successfully')
                      }
                    }}
                  >
                    Sign Out
                  </Button>
                )}
              </div>
              {user && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Session Info:</strong> 
                  <br />User ID: {user.id}
                  <br />Last Sign In: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Profile Information</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveProfile}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.name}
                      className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-blue-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </span>
                    </div>
                  )}
                  {isEditing && (
                    <button className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile?.name || 'Loading...'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile?.email || 'Loading...'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Club Role
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg border text-sm font-medium ${getRoleColor(profile?.role || 'member')}`}>
                        {getRoleDisplayName(profile?.role || 'member')}
                      </span>
                      <span className="text-sm text-gray-500">• {permissions}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900 font-medium">{memberSinceDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Events Joined</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Expense Records</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {profile?.member_since ? Math.floor((Date.now() - new Date(profile.member_since).getTime()) / (1000 * 60 * 60 * 24)) : 0}
              </div>
              <div className="text-sm text-gray-600">Days as Member</div>
            </CardContent>
          </Card>
        </div>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Appearance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Appearance
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    !isDark 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                    <span className="text-sm font-medium">Light</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    isDark 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-800 rounded"></div>
                    <span className="text-sm font-medium">Dark</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setTheme('system')}
                  className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-white to-gray-800 border border-gray-300 rounded"></div>
                    <span className="text-sm font-medium">System</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Notifications
              </label>
              <div className="space-y-3">
                {Object.entries(notifications).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {key === 'events' ? 'Event Updates' :
                         key === 'expenses' ? 'Expense Notifications' :
                         key === 'documents' ? 'Document Alerts' :
                         'System Notifications'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {key === 'events' ? 'New events, cancellations, and updates' :
                         key === 'expenses' ? 'Payment requests and settlements' :
                         key === 'documents' ? 'New documents and approvals' :
                         'App updates and maintenance notices'}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [key]: !enabled }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Change Password</p>
                <p className="text-xs text-gray-500">Update your account password</p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Privacy Settings</p>
                <p className="text-xs text-gray-500">Control who can see your information</p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-800">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-900">Export Data</p>
                <p className="text-xs text-red-600">Download all your club data</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-900">Delete Account</p>
                <p className="text-xs text-red-600">Permanently delete your account and data</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}