import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestTable() {
  console.log('Creating test table...')
  
  // Create table
  const { data, error } = await supabase.rpc('create_test_table', {})
  
  if (error) {
    console.log('Creating table with direct SQL...')
    const { error: sqlError } = await supabase
      .from('_sql')
      .select('*')
      .limit(0)
    
    // Try direct SQL approach
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        test1 TEXT,
        test2 TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    console.log('SQL:', createTableSQL)
    console.log('Note: You may need to run this SQL manually in Supabase dashboard')
  }
  
  // Insert test data
  console.log('Inserting test data...')
  const { data: insertData, error: insertError } = await supabase
    .from('test_table')
    .insert([
      { test1: 'Hello', test2: 'World' }
    ])
    .select()
  
  if (insertError) {
    console.error('Insert error:', insertError)
  } else {
    console.log('Inserted data:', insertData)
  }
  
  // Verify data
  const { data: selectData, error: selectError } = await supabase
    .from('test_table')
    .select('*')
  
  if (selectError) {
    console.error('Select error:', selectError)
  } else {
    console.log('Table data:', selectData)
  }
}

createTestTable().catch(console.error)