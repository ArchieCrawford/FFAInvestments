/**
 * FFA Investments - Supabase Connection Test
 * This script tests basic Supabase connectivity without authentication
 * Run this in browser console to diagnose connection issues
 */

console.log('🔧 FFA Investments - Supabase Diagnostics Starting...')

// Check environment variables
console.log('\n📋 Environment Variables Check:')
console.log('VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL || 'MISSING')
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? 'SET (hidden for security)' : 'MISSING')
console.log('VITE_APP_URL:', import.meta.env?.VITE_APP_URL || 'MISSING')

// Import Supabase client
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('\n🔗 Supabase Connection Test:')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables. Check your .env file.')
  console.log('\nExpected format in .env:')
  console.log('VITE_SUPABASE_URL=https://your-project.supabase.co')
  console.log('VITE_SUPABASE_ANON_KEY=your_anon_key_here')
  console.log('VITE_APP_URL=http://localhost:3001')
} else {
  console.log('✅ Environment variables are present')
  
  // Test URL format
  try {
    const url = new URL(SUPABASE_URL)
    console.log('✅ Supabase URL format is valid:', url.origin)
  } catch (error) {
    console.error('❌ Invalid Supabase URL format:', SUPABASE_URL)
  }
  
  // Create client
  console.log('\n🚀 Creating Supabase client...')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
  
  console.log('✅ Supabase client created')
  
  // Test basic connection
  console.log('\n📡 Testing connection...')
  supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .then(({ error, count }) => {
      if (error) {
        console.error('❌ Connection test failed:', error)
        console.log('\n🔍 Possible issues:')
        console.log('1. Check if your Supabase project is active')
        console.log('2. Verify the project URL and API key')
        console.log('3. Check if RLS (Row Level Security) is properly configured')
        console.log('4. Ensure the profiles table exists')
      } else {
        console.log('✅ Connection successful!')
        console.log('📊 Profiles count (exact):', typeof count === 'number' ? count : 'N/A')
      }
    })
    .catch(err => {
      console.error('❌ Connection error:', err)
    })
  
  // Test auth functionality
  console.log('\n🔐 Testing auth system...')
  supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      console.log('ℹ️ No authenticated user (this is expected for fresh setup)')
    } else {
      console.log('👤 Current user:', data.user?.email || 'None')
    }
  }).catch(err => {
    console.error('❌ Auth test error:', err)
  })
}

console.log('\n🎯 Quick Setup Checklist:')
console.log('□ Created Supabase project at https://supabase.com')
console.log('□ Updated .env file with real project URL and keys')
console.log('□ Ran the SQL schema in Supabase dashboard')
console.log('□ Configured authentication settings in Supabase')
console.log('□ Set up redirect URLs for localhost:3001')

console.log('\n📞 If issues persist:')
console.log('1. Check browser network tab for failed requests')
console.log('2. Verify Supabase dashboard shows your project as active')
console.log('3. Test with a simple magic link authentication')
console.log('4. Check Supabase logs in the dashboard')

export default {}