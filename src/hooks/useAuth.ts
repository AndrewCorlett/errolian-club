import { useEffect, useState } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile, UserWithRole } from '@/types/supabase'

interface UseAuthReturn {
  user: User | null
  profile: UserWithRole | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  sendPasswordResetEmail: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
}

// Role-based permissions
const getPermissions = (role: string) => {
  switch (role) {
    case 'super-admin':
      return {
        canCreateEvents: true,
        canEditAllEvents: true,
        canDeleteAllEvents: true,
        canApproveEvents: true,
        canCreateExpenses: true,
        canEditAllExpenses: true,
        canDeleteAllExpenses: true,
        canSettleExpenses: true,
        canUploadDocuments: true,
        canApproveDocuments: true,
        canDeleteAllDocuments: true,
        canManageFolders: true,
        canInviteUsers: true,
        canManageUserRoles: true,
        canDeactivateUsers: true,
        canModifySettings: true,
        canViewAnalytics: true,
        canExportData: true
      }
    case 'commodore':
      return {
        canCreateEvents: true,
        canEditAllEvents: true,
        canDeleteAllEvents: true,
        canApproveEvents: true,
        canCreateExpenses: true,
        canEditAllExpenses: true,
        canDeleteAllExpenses: true,
        canSettleExpenses: true,
        canUploadDocuments: true,
        canApproveDocuments: true,
        canDeleteAllDocuments: true,
        canManageFolders: true,
        canInviteUsers: true,
        canManageUserRoles: true,
        canDeactivateUsers: true,
        canModifySettings: false,
        canViewAnalytics: true,
        canExportData: true
      }
    case 'officer':
      return {
        canCreateEvents: true,
        canEditAllEvents: false,
        canDeleteAllEvents: false,
        canApproveEvents: true,
        canCreateExpenses: true,
        canEditAllExpenses: false,
        canDeleteAllExpenses: false,
        canSettleExpenses: true,
        canUploadDocuments: true,
        canApproveDocuments: true,
        canDeleteAllDocuments: false,
        canManageFolders: true,
        canInviteUsers: false,
        canManageUserRoles: false,
        canDeactivateUsers: false,
        canModifySettings: false,
        canViewAnalytics: false,
        canExportData: false
      }
    default: // 'member'
      return {
        canCreateEvents: true,
        canEditAllEvents: false,
        canDeleteAllEvents: false,
        canApproveEvents: false,
        canCreateExpenses: true,
        canEditAllExpenses: false,
        canDeleteAllExpenses: false,
        canSettleExpenses: false,
        canUploadDocuments: true,
        canApproveDocuments: false,
        canDeleteAllDocuments: false,
        canManageFolders: false,
        canInviteUsers: false,
        canManageUserRoles: false,
        canDeactivateUsers: false,
        canModifySettings: false,
        canViewAnalytics: false,
        canExportData: false
      }
  }
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserWithRole | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Development auth bypass
  const checkAuthBypass = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.has('bypass') && import.meta.env.DEV
  }


  useEffect(() => {
    // Check for development auth bypass
    if (checkAuthBypass()) {
      console.log('🚀 Development auth bypass activated - God mode enabled!')

      // Create mock user with god permissions
      const mockUser = {
        id: 'dev-bypass-user',
        email: 'dev@bypass.local',
        user_metadata: { name: 'Dev Bypass User' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated'
      } as User

      const mockProfile: UserWithRole = {
        id: 'dev-bypass-user',
        email: 'dev@bypass.local',
        name: 'Dev Bypass User',
        role: 'super-admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        permissions: getPermissions('super-admin')
      }

      setUser(mockUser)
      setProfile(mockProfile)
      setSession({
        access_token: 'dev-bypass-token',
        refresh_token: 'dev-bypass-refresh',
        expires_at: Date.now() / 1000 + 3600, // 1 hour from now
        token_type: 'bearer',
        user: mockUser
      } as Session)
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      }

      setLoading(false)
    }

    getInitialSession()

    // Skip auth state change listener if using bypass
    if (checkAuthBypass()) {
      return () => {}
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('Auth state changed:', event, session?.user?.email)

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    // Set up periodic session health checks (every 5 minutes)
    const healthCheckInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession) {
        const now = Date.now() / 1000
        if (currentSession.expires_at && currentSession.expires_at < now) {
          console.log('Session expired, redirecting to login')
          window.location.href = '/auth/login'
        }
      }
    }, 5 * 60 * 1000) // 5 minutes

    // Set up visibility change handler to check session when user returns
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          const now = Date.now() / 1000
          if (currentSession.expires_at && currentSession.expires_at < now) {
            console.log('Session expired on focus, redirecting to login')
            window.location.href = '/auth/login'
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      clearInterval(healthCheckInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        if (error.code === 'PGRST116') {
          console.log('No profile found for user - this is normal for new users')
        }
        return
      }

      if (data) {
        console.log('User profile found:', data)
        const profileWithPermissions: UserWithRole = {
          ...data,
          permissions: getPermissions(data.role)
        }
        setProfile(profileWithPermissions)
      } else {
        console.log('No profile data returned for user')
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    return { error }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    })
    
    return { error }
  }

  const signOut = async () => {
    // Handle bypass mode sign out
    if (checkAuthBypass()) {
      setUser(null)
      setProfile(null)
      setSession(null)
      // Remove bypass parameter from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('bypass')
      window.history.replaceState({}, '', url.toString())
      return { error: null }
    }

    const { error } = await supabase.auth.signOut()

    if (!error) {
      setUser(null)
      setProfile(null)
      setSession(null)
    }

    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    return { error }
  }

  const sendPasswordResetEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    
    return { error }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        return { error }
      }

      // Refresh profile data
      await fetchUserProfile(user.id)
      
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  return {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    sendPasswordResetEmail,
    updateProfile
  }
}