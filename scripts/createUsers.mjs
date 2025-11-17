/**
 * Demo User Creation Script for FFA Investments
 * Creates demo users in Supabase for testing the login system
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = 'https://wynbgrgmrygkodcdumii.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bmJncmdtcnlna29kY2R1bWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTQ1MTgsImV4cCI6MjA3Nzg3MDUxOH0.ufstFd_BUpM-fVvv-PC8cuXX5x0gHB01CRVaQ98qnq4'

const supabase = createClient(supabaseUrl, supabaseKey)

const DEMO_USERS = [
  {
    email: 'admin@ffainvestments.com',
    password: 'demo123456',
    displayName: 'FFA Admin',
    role: 'admin'
  },
  {
    email: 'member@ffainvestments.com', 
    password: 'demo123456',
    displayName: 'John Member',
    role: 'member'
  },
  {
    email: 'demo@ffainvestments.com',
    password: 'demo123456', 
    displayName: 'Demo User',
    role: 'member'
  }
]

async function createDemoUsers() {
  console.log('🚀 Starting demo user creation...')
  
  for (const demoUser of DEMO_USERS) {
    try {
      console.log(`\n👤 Creating user: ${demoUser.email}`)
      
      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: demoUser.email,
        password: demoUser.password
      })
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          console.log(`ℹ️  User ${demoUser.email} already exists, skipping...`)
          continue
        } else {
          console.error(`❌ Failed to create ${demoUser.email}:`, signUpError.message)
          continue
        }
      }
      
      console.log(`✅ Successfully created user: ${demoUser.email}`)
      
      // Create/update profile if user was created
      if (signUpData.user) {
        console.log(`📝 Creating profile for: ${demoUser.email}`)
        
        // Wait a bit for the user to be fully created
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: signUpData.user.id,
            display_name: demoUser.displayName,
            role: demoUser.role
          })
        
        if (profileError) {
          console.error(`❌ Failed to create profile for ${demoUser.email}:`, profileError.message)
        } else {
          console.log(`✅ Profile created for: ${demoUser.email}`)
        }
      }
      
    } catch (error) {
      console.error(`💥 Unexpected error creating ${demoUser.email}:`, error)
    }
  }
  
  console.log('\n🎉 Demo user creation completed!')
  console.log('\n📋 Demo Users Created:')
  DEMO_USERS.forEach(user => {
    console.log(`   • ${user.email} (${user.role}) - Password: ${user.password}`)
  })
}

// Check if we can connect to Supabase
async function checkConnection() {
  console.log('🔍 Checking Supabase connection...')
  
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('💥 Failed to connect to Supabase:', error)
    return false
  }
}

// Main execution
async function main() {
  const connected = await checkConnection()
  if (!connected) {
    console.log('\n⚠️ Could not connect to Supabase. Please check your configuration.')
    return
  }
  
  await createDemoUsers()
}

main().catch(console.error)