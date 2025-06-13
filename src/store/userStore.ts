import { create } from 'zustand'
import type { User } from '@/types/user'
import { currentUser } from '@/data/mockUsers'

interface UserStore {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  isAuthenticated: boolean
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: currentUser, // Mock logged-in user
  setCurrentUser: (user) => set({ currentUser: user }),
  isAuthenticated: true
}))