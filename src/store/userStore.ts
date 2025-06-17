import { create } from 'zustand'

// DEPRECATED: This store is deprecated. Use useAuth hook instead.
// This is kept for backward compatibility during migration.

interface UserStore {
  currentUser: any | null
  setCurrentUser: (user: any | null) => void
  isAuthenticated: boolean
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null, // No longer using mock data
  setCurrentUser: (user) => set({ currentUser: user }),
  isAuthenticated: false // Auth handled by useAuth hook
}))