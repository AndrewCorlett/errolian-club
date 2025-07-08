import { supabase, getSupabaseAdmin } from './supabase'
import type { UserProfile, UserProfileInsert } from '@/types/supabase'

export const authService = {
  async createUserProfile(userId: string, email: string, name: string): Promise<UserProfile | null> {
    try {
      const profileData: UserProfileInsert = {
        id: userId,
        email,
        name,
        role: 'member'
      }

      // First try with regular client
      let { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      // If RLS blocks regular client, try with admin client
      if (error && error.code === '42501') {
        console.log('RLS blocked profile creation, trying with admin client...')
        const adminClient = getSupabaseAdmin()
        const result = await adminClient
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single()
        
        data = result.data
        error = result.error
      }

      if (error) {
        console.error('Error creating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      return null
    }
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserProfile:', error)
      return null
    }
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateUserProfile:', error)
      return null
    }
  },

  async deleteUserProfile(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Error deleting user profile:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteUserProfile:', error)
      return false
    }
  }
}