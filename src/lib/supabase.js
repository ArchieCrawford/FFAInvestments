import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging helper
const debugLog = (message, data = null) => {
  console.log(`[SUPABASE DEBUG] ${message}`, data || '')
}

// Validation and initialization
console.log('🔧 Initializing Supabase client...')
console.log('Environment variables check:')
console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = []
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY')
  
  console.error('❌ Missing required Supabase environment variables:', missingVars)
  throw new Error(`Missing Supabase environment variables: ${missingVars.join(', ')}. Please check your .env file.`)
}

// Validate URL format
try {
  new URL(supabaseUrl)
  console.log('✅ Supabase URL format is valid')
} catch (error) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl)
  throw new Error('Invalid VITE_SUPABASE_URL format. Expected format: https://your-project.supabase.co')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: true // Enable auth debugging
  },
  global: {
    headers: {
      'X-Client-Info': 'ffa-investments-app'
    }
  }
})

console.log('✅ Supabase client initialized successfully')

// Test connection on initialization
supabase.from('profiles').select('count(*)').then(({ data, error }) => {
  if (error) {
    console.error('❌ Initial connection test failed:', error)
  } else {
    console.log('✅ Initial Supabase connection successful')
  }
}).catch(err => {
  console.error('❌ Connection test error:', err)
})

// Auth helper functions with enhanced error handling
export const auth = {
  signUp: async (email, password) => {
    debugLog('Attempting sign up', { email, hasPassword: !!password })
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        console.error('❌ Sign up error:', {
          message: error.message,
          status: error.status,
          statusCode: error.status,
          details: error
        })
        return { data: null, error }
      }
      
      console.log('✅ Sign up successful:', {
        userId: data.user?.id,
        email: data.user?.email,
        confirmed: data.user?.email_confirmed_at ? 'Yes' : 'No'
      })
      
      return { data, error: null }
    } catch (error) {
      console.error('❌ Unexpected sign up error:', error)
      return { data: null, error: { message: 'Unexpected error during sign up' } }
    }
  },

  signIn: async (email, password) => {
    debugLog('Attempting sign in', { email, hasPassword: !!password })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('❌ Sign in error:', {
          message: error.message,
          status: error.status,
          statusCode: error.status,
          code: error.code || 'unknown',
          details: error
        })
        
        // Provide user-friendly error messages
        let userFriendlyMessage = error.message
        if (error.message?.includes('Invalid login credentials')) {
          userFriendlyMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (error.message?.includes('Email not confirmed')) {
          userFriendlyMessage = 'Please check your email and click the confirmation link before signing in.'
        } else if (error.message?.includes('Too many requests')) {
          userFriendlyMessage = 'Too many login attempts. Please wait a few minutes and try again.'
        }
        
        return { data: null, error: { ...error, userFriendlyMessage } }
      }
      
      console.log('✅ Sign in successful:', {
        userId: data.user?.id,
        email: data.user?.email,
        role: data.user?.user_metadata?.role || 'unknown',
        sessionPresent: !!data.session
      })
      
      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.warn('⚠️ Profile lookup warning:', profileError.message)
      } else {
        console.log('✅ User profile found:', {
          displayName: profile.display_name,
          role: profile.role,
          createdAt: profile.created_at
        })
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error)
      return { data: null, error: { message: 'Unexpected error during sign in' } }
    }
  },

  signInWithMagicLink: async (email) => {
    debugLog('Attempting magic link sign in', { email })
    
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`
        }
      })
      
      if (error) {
        console.error('❌ Magic link error:', error)
        return { data: null, error }
      }
      
      console.log('✅ Magic link sent successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Unexpected magic link error:', error)
      return { data: null, error: { message: 'Unexpected error sending magic link' } }
    }
  },

  signOut: async () => {
    debugLog('Attempting sign out')
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign out error:', error)
        return { error }
      }
      
      console.log('✅ Sign out successful')
      return { error: null }
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error)
      return { error: { message: 'Unexpected error during sign out' } }
    }
  },

  getCurrentUser: async () => {
    debugLog('Getting current user')
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('❌ Get user error:', error)
        return { user: null, error }
      }
      
      if (user) {
        console.log('✅ Current user found:', {
          userId: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at ? 'Yes' : 'No'
        })
      } else {
        console.log('ℹ️ No current user found')
      }
      
      return { user, error: null }
    } catch (error) {
      console.error('❌ Unexpected get user error:', error)
      return { user: null, error }
    }
  },

  onAuthStateChange: (callback) => {
    debugLog('Setting up auth state listener')
    
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', {
        event,
        userId: session?.user?.id || 'none',
        email: session?.user?.email || 'none',
        timestamp: new Date().toISOString()
      })
      
      callback(event, session)
    })
  }
}

// Database helper functions
export const db = {
  // Timeline helpers (migrated) - use backend RPCs / new views
  insertTimelineData: async () => {
    throw new Error('Inserting timeline data from the frontend is disabled. Use backend import tools or admin scripts.')
  },

  getTimelineData: async (memberId = null) => {
    // Prefer RPC api_get_member_timeline for member timelines; clients should use src/lib/ffaApi.getMemberTimeline
    console.warn('db.getTimelineData is deprecated; use src/lib/ffaApi.getMemberTimeline instead.')
    return { data: [], error: new Error('Deprecated — use ffaApi.getMemberTimeline') }
  },

  getMembersList: async () => {
    console.warn('db.getMembersList is deprecated; use src/lib/ffaApi.getMembers instead.')
    return { data: [], error: new Error('Deprecated — use ffaApi.getMembers') }
  },

  // Organization operations
  createOrg: async (name) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'User not authenticated' }

    const { data, error } = await supabase
      .from('orgs')
      .insert({ name, created_by: user.id })
      .select()
      .single()
    
    if (data && !error) {
      // Add creator as owner
      await supabase
        .from('org_members')
        .insert({ 
          org_id: data.id, 
          user_id: user.id, 
          role: 'owner' 
        })
    }
    
    return { data, error }
  },

  getUserOrgs: async () => {
    const { data, error } = await supabase
      .from('orgs')
      .select(`
        *,
        org_members!inner(role)
      `)
    return { data, error }
  },

  addOrgMember: async (orgId, userId, role = 'member') => {
    const { data, error } = await supabase
      .from('org_members')
      .insert({ org_id: orgId, user_id: userId, role })
      .select()
      .single()
    return { data, error }
  }
}