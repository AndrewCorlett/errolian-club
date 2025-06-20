// Debug script to check folders in Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sbmgfptxdrvhqgaqnuhe.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibWdmcHR4ZHJ2aHFnYXFudWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MjYyNjYsImV4cCI6MjA1MjQwMjI2Nn0.CZVSyMDUbfmkh74RpPFZqWrJG5N8wdUQfMUpLMIL-Yo'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugFolders() {
  console.log('Checking folders in database...')
  
  try {
    const { data: folders, error } = await supabase
      .from('document_folders')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching folders:', error)
      return
    }

    console.log(`Found ${folders?.length || 0} folders:`)
    
    if (folders) {
      folders.forEach(folder => {
        console.log(`- "${folder.name}": id=${folder.id}, isPublic=${folder.is_public}, createdBy=${folder.created_by}, parentId=${folder.parent_id}`)
      })
    }

    // Also check current user
    const { data: { user } } = await supabase.auth.getUser()
    console.log('\nCurrent user:', user?.id || 'Not authenticated')
    
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (profileError) {
        console.error('Error fetching user profile:', profileError)
      } else {
        console.log('User profile:', profile)
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

debugFolders()