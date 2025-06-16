import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/lib/auth'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { UserProfile, UserWithRole } from '@/types/supabase'

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  useEffect(() => {
    if (auth.user && !auth.profile) {
      const createProfile = async () => {
        const profile = await authService.createUserProfile(
          auth.user!.id,
          auth.user!.email!,
          auth.user!.user_metadata?.name || auth.user!.email!
        )
        
        if (profile) {
          console.log('User profile created successfully')
        }
      }

      createProfile()
    }
  }, [auth.user, auth.profile])

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

// Helper hook for checking permissions
export function usePermissions() {
  const { profile } = useAuthContext()
  return profile?.permissions || {}
}

// Helper hook for checking specific roles
export function useRole() {
  const { profile } = useAuthContext()
  
  const isAdmin = profile?.role === 'super-admin'
  const isCommodore = profile?.role === 'commodore'
  const isOfficer = profile?.role === 'officer'
  const isMember = profile?.role === 'member'
  
  const isStaff = isAdmin || isCommodore || isOfficer
  
  return {
    role: profile?.role,
    isAdmin,
    isCommodore,
    isOfficer,
    isMember,
    isStaff
  }
}