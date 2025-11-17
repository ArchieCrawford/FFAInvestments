/**
 * Demo User Creation Script for FFA Investments
 * Run this script to create demo users for testing
 */

import { supabase } from '../src/lib/supabase.js'

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
        password: demoUser.password,
        options: {
          data: {
            display_name: demoUser.displayName,
            role: demoUser.role
          }
        }
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
  
  process.exit(0)
}

// Check if we can connect to Supabase
async function checkConnection() {
  console.log('🔍 Checking Supabase connection...')
  
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      process.exit(1)
    }
    
    console.log('✅ Supabase connection successful')
  } catch (error) {
    console.error('💥 Failed to connect to Supabase:', error)
    process.exit(1)
  }
}

// Main execution
async function main() {
  await checkConnection()
  await createDemoUsers()
}

main().catch(console.error)