/**
 * Simple Authentication Test using fetch API
 * Tests sign-up directly with Supabase API
 */

const SUPABASE_URL = 'https://wynbgrgmrygkodcdumii.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bmJncmdtcnlna29kY2R1bWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTQ1MTgsImV4cCI6MjA3Nzg3MDUxOH0.ufstFd_BUpM-fVvv-PC8cuXX5x0gHB01CRVaQ98qnq4'

async function testSignUp() {
  const testUser = {
    email: 'newuser@example.com',
    password: 'testpassword123'
  }
  
  console.log('🧪 Testing sign-up with fetch API...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    })
    
    const data = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('✅ Sign-up API call successful!')
      
      if (data.user && !data.user.email_confirmed_at) {
        console.log('📧 Email confirmation required')
        console.log('✉️ User should check email for confirmation link')
      }
      
      if (data.user && data.user.email_confirmed_at) {
        console.log('✅ Email already confirmed - user can sign in immediately')
      }
    } else {
      console.log('❌ Sign-up failed:', data.message || 'Unknown error')
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

async function testEmailConfig() {
  console.log('\n🔧 Testing email configuration...')
  
  try {
    // Try to get auth settings
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (response.ok) {
      const settings = await response.json()
      console.log('Auth settings:', JSON.stringify(settings, null, 2))
    } else {
      console.log('⚠️ Cannot access auth settings (expected with anon key)')
    }
  } catch (error) {
    console.log('⚠️ Auth settings not accessible:', error.message)
  }
}

async function main() {
  await testSignUp()
  await testEmailConfig()
}

main().catch(console.error)