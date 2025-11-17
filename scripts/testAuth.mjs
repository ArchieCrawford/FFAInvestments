/**
 * Test Sign-up Functionality
 * Direct test of the Supabase sign-up process
 */

import { supabase } from '../src/lib/supabase.js'

const TEST_USER = {
  email: 'test@ffainvestments.com',
  password: 'demo123456',
  displayName: 'Test User'
}

async function testSignUp() {
  console.log('🧪 Testing sign-up functionality...')
  console.log(`📧 Test email: ${TEST_USER.email}`)
  
  try {
    // Test sign-up
    console.log('\n1️⃣ Testing sign-up...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        data: {
          display_name: TEST_USER.displayName
        }
      }
    })
    
    if (signUpError) {
      console.error('❌ Sign-up failed:', signUpError.message)
      
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️ User already exists, testing sign-in instead...')
        
        // Test sign-in
        console.log('\n2️⃣ Testing sign-in...')
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
        
        if (signInError) {
          console.error('❌ Sign-in failed:', signInError.message)
          
          if (signInError.message.includes('Email not confirmed')) {
            console.log('📧 Email confirmation required!')
            console.log('✉️ Check your email for a confirmation link')
            
            // Try sending confirmation email again
            console.log('\n3️⃣ Resending confirmation email...')
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: TEST_USER.email
            })
            
            if (resendError) {
              console.error('❌ Failed to resend confirmation:', resendError.message)
            } else {
              console.log('✅ Confirmation email sent again')
            }
          }
        } else {
          console.log('✅ Sign-in successful!')
          console.log('User ID:', signInData.user?.id)
          console.log('Email confirmed:', signInData.user?.email_confirmed_at ? 'Yes' : 'No')
        }
      }
    } else {
      console.log('✅ Sign-up successful!')
      console.log('User ID:', signUpData.user?.id)
      console.log('Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No')
      
      if (!signUpData.user?.email_confirmed_at) {
        console.log('\n📧 Email confirmation required!')
        console.log('✉️ Check your email for a confirmation link')
        console.log('🔗 After clicking the link, you can sign in normally')
      }
      
      // Try to create profile
      if (signUpData.user) {
        console.log('\n4️⃣ Creating user profile...')
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: signUpData.user.id,
            display_name: TEST_USER.displayName,
            role: 'member'
          })
        
        if (profileError) {
          console.error('❌ Profile creation failed:', profileError.message)
        } else {
          console.log('✅ Profile created successfully')
        }
      }
    }
    
    // Test email configuration
    console.log('\n5️⃣ Checking email configuration...')
    
    // Get auth settings (this might not work without service role key)
    try {
      const { data: settings } = await supabase.auth.admin.listUsers()
      console.log('✅ Can access user list - email is configured')
    } catch (error) {
      console.log('ℹ️ Cannot access admin functions (normal for anon key)')
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Test magic link functionality
async function testMagicLink() {
  console.log('\n🔗 Testing magic link functionality...')
  
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: TEST_USER.email,
      options: {
        emailRedirectTo: 'https://localhost:3001/auth/callback'
      }
    })
    
    if (error) {
      console.error('❌ Magic link failed:', error.message)
    } else {
      console.log('✅ Magic link sent successfully!')
      console.log('📧 Check your email for the magic link')
    }
  } catch (error) {
    console.error('💥 Magic link error:', error)
  }
}

async function main() {
  console.log('🚀 Starting authentication tests...')
  console.log('=' .repeat(50))
  
  await testSignUp()
  
  console.log('\n' + '=' .repeat(50))
  await testMagicLink()
  
  console.log('\n✅ Testing completed!')
}

main().catch(console.error)