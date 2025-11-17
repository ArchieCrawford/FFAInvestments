/**
 * Check Database Schema
 * Verify the profiles table exists and has the correct structure
 */

const SUPABASE_URL = 'https://wynbgrgmrygkodcdumii.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bmJncmdtcnlna29kY2R1bWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTQ1MTgsImV4cCI6MjA3Nzg3MDUxOH0.ufstFd_BUpM-fVvv-PC8cuXX5x0gHB01CRVaQ98qnq4'

async function checkDatabase() {
  console.log('🔍 Checking database schema...')
  
  try {
    // Check if profiles table exists and is accessible
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Profiles table response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Profiles table accessible')
      console.log('Sample data:', data)
    } else {
      const errorData = await response.json()
      console.log('❌ Profiles table error:', errorData)
    }
    
  } catch (error) {
    console.error('💥 Database check error:', error)
  }
}

async function checkTables() {
  console.log('\n📊 Checking available tables...')
  
  const tables = [
    'profiles',
    'audit_logs', 
    'statements',
    'ledger_entries',
    'unit_prices',
    'education_lessons',
    'education_progress',
    'announcements'
  ]
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count()&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        console.log(`✅ ${table} - accessible`)
      } else {
        console.log(`❌ ${table} - error (${response.status})`)
      }
    } catch (error) {
      console.log(`❌ ${table} - error: ${error.message}`)
    }
  }
}

async function main() {
  await checkDatabase()
  await checkTables()
}

main().catch(console.error)