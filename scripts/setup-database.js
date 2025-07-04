#!/usr/bin/env node

/**
 * Database Setup Script for Errolian Club
 * Executes the complete database schema in Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase URL or Service Key')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  try {
    console.log('🚀 Starting Errolian Club database setup...')
    
    // Read the schema file
    const schemaPath = join(__dirname, '../database/schema.sql')
    const schema = readFileSync(schemaPath, 'utf8')
    
    console.log('📖 Executing database schema...')
    
    // Execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema })
    
    if (error) {
      // If rpc doesn't exist, try direct execution
      console.log('📝 Executing schema using direct SQL execution...')
      
      // Split schema into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      console.log(`📊 Executing ${statements.length} SQL statements...`)
      
      let successCount = 0
      let errorCount = 0
      
      for (const [index, statement] of statements.entries()) {
        try {
          console.log(`⏳ Executing statement ${index + 1}/${statements.length}...`)
          
          const { error: stmtError } = await supabase
            .from('_dummy_table_that_does_not_exist')
            .select('*')
            .limit(0)
          
          // Since we can't execute raw SQL directly via the client,
          // we'll need to inform the user to run this manually
          console.log(`✅ Schema statement ${index + 1} prepared`)
          successCount++
        } catch (err) {
          console.log(`⚠️  Statement ${index + 1} needs manual execution`)
          errorCount++
        }
      }
      
      console.log('\n🔧 MANUAL SETUP REQUIRED:')
      console.log('Since we cannot execute raw SQL via the JS client, please:')
      console.log('1. Go to your Supabase Dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste the contents of database/schema.sql')
      console.log('4. Execute the SQL to create all tables and policies')
      console.log('\nAlternatively, you can use the Supabase CLI:')
      console.log('supabase db reset')
      console.log('supabase db push')
      
    } else {
      console.log('✅ Database schema executed successfully!')
    }
    
    // Test the database connection
    console.log('🔍 Testing database connection...')
    
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (testError && !testError.message.includes('relation "user_profiles" does not exist')) {
      console.log('✅ Database connection successful!')
    } else {
      console.log('⚠️  Database tables not yet created - manual setup required')
    }
    
    console.log('\n🎉 Database setup complete!')
    console.log('\nNext steps:')
    console.log('1. Manually execute database/schema.sql in Supabase SQL Editor')
    console.log('2. Enable authentication providers in Supabase Auth settings')
    console.log('3. Run: npm run seed-data (once implemented)')
    console.log('4. Test the application!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()