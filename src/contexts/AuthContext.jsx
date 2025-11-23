import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState({})

  const updateDebugInfo = (key, value) => {
    setDebugInfo(prev => ({ ...prev, [key]: value, lastUpdate: new Date().toISOString() }))
  }

  useEffect(() => {
    console.log('🔧 AuthProvider: Initializing...')
    updateDebugInfo('status', 'Initializing auth provider')
    
    // Check if user is logged in on mount
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 AuthProvider: Auth state change detected', { event, hasSession: !!session })
      updateDebugInfo('lastAuthEvent', { event, timestamp: new Date().toISOString() })
      
      if (session?.user) {
        console.log('👤 AuthProvider: User session found', { 
          userId: session.user.id, 
          email: session.user.email 
        })
        setUser(session.user)
        await fetchProfile(session.user.id)
        updateDebugInfo('userStatus', 'Authenticated')
      } else {
        console.log('👤 AuthProvider: No user session')
        setUser(null)
        setProfile(null)
        updateDebugInfo('userStatus', 'Not authenticated')
      }
      setLoading(false)
    })

    return () => {
      console.log('🔧 AuthProvider: Cleaning up auth listener')
      subscription?.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    console.log('🔍 AuthProvider: Checking current user...')
    updateDebugInfo('status', 'Checking current user')
    
    try {
      const { user: currentUser, error: userError } = await auth.getCurrentUser()
      
      if (userError) {
        const missingSession = userError.message?.toLowerCase().includes('session missing')
        if (missingSession) {
          console.log('ℹ️ AuthProvider: No active session (initial load)')
          setUser(null)
          setProfile(null)
          updateDebugInfo('userStatus', 'Not authenticated (no session)')
        } else {
          console.error('❌ AuthProvider: Error checking user:', userError)
          setError(`Error checking user: ${userError.message}`)
          updateDebugInfo('checkUserError', userError.message)
        }
        return
      }
      
      if (currentUser) {
        console.log('👤 AuthProvider: Current user found', { 
          userId: currentUser.id, 
          email: currentUser.email 
        })
        setUser(currentUser)
        await fetchProfile(currentUser.id)
        updateDebugInfo('userStatus', 'Authenticated (from check)')
      } else {
        console.log('👤 AuthProvider: No current user found')
        updateDebugInfo('userStatus', 'Not authenticated (from check)')
      }
    } catch (error) {
      console.error('❌ AuthProvider: Unexpected error checking user:', error)
      setError(`Unexpected error: ${error.message}`)
      updateDebugInfo('checkUserError', error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async (userId) => {
    console.log('📝 AuthProvider: Fetching profile for user:', userId)
    updateDebugInfo('status', `Fetching profile for ${userId}`)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('❌ AuthProvider: Profile fetch error:', error)
        
        // Handle case where profile doesn't exist yet
        if (error.code === 'PGRST116') {
          console.log('ℹ️ AuthProvider: Profile not found, creating default profile')
          updateDebugInfo('profileStatus', 'Profile not found, needs creation')
          
          // Create a default profile
          const defaultProfile = {
            id: userId,
            display_name: 'New User',
            role: 'member'
          }
          
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([defaultProfile])
            .select()
            .single()
          
          if (createError) {
            console.error('❌ AuthProvider: Failed to create profile:', createError)
            setError(`Failed to create profile: ${createError.message}`)
            updateDebugInfo('profileError', createError.message)
          } else {
            console.log('✅ AuthProvider: Profile created successfully')
            setProfile(createdProfile)
            updateDebugInfo('profileStatus', 'Profile created')
          }
        } else {
          setError(`Profile error: ${error.message}`)
          updateDebugInfo('profileError', error.message)
        }
      } else {
        console.log('✅ AuthProvider: Profile fetched successfully', { 
          displayName: data.display_name, 
          role: data.role 
        })
        setProfile(data)
        updateDebugInfo('profileStatus', 'Profile loaded')
      }
    } catch (error) {
      console.error('❌ AuthProvider: Unexpected profile fetch error:', error)
      setError(`Unexpected profile error: ${error.message}`)
      updateDebugInfo('profileError', error.message)
    }
  }

  const signIn = async (email, password) => {
    console.log('🔑 AuthProvider: Attempting sign in for:', email)
    
    try {
      setLoading(true)
      setError(null)
      updateDebugInfo('status', `Signing in ${email}`)
      
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        const errorMessage = error.userFriendlyMessage || error.message || 'Sign in failed'
        console.error('❌ AuthProvider: Sign in failed:', errorMessage)
        setError(errorMessage)
        updateDebugInfo('signInError', errorMessage)
        return { data: null, error }
      }
      
      console.log('✅ AuthProvider: Sign in successful')
      updateDebugInfo('status', 'Sign in successful')
      return { data, error: null }
    } catch (err) {
      const errorMessage = 'Unexpected sign in error'
      console.error('❌ AuthProvider: Unexpected sign in error:', err)
      setError(errorMessage)
      updateDebugInfo('signInError', errorMessage)
      return { data: null, error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, displayName) => {
    console.log('📝 AuthProvider: Attempting sign up for:', email)
    
    try {
      setLoading(true)
      setError(null)
      updateDebugInfo('status', `Signing up ${email}`)
      
      const { data, error } = await auth.signUp(email, password)
      
      if (error) {
        const errorMessage = error.message || 'Sign up failed'
        console.error('❌ AuthProvider: Sign up failed:', errorMessage)
        setError(errorMessage)
        updateDebugInfo('signUpError', errorMessage)
        return { data: null, error }
      }
      
      // Update profile with display name if provided
      if (data.user && displayName) {
        console.log('📝 AuthProvider: Updating profile with display name')
        await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', data.user.id)
      }
      
      console.log('✅ AuthProvider: Sign up successful')
      updateDebugInfo('status', 'Sign up successful')
      return { data, error: null }
    } catch (err) {
      const errorMessage = 'Unexpected sign up error'
      console.error('❌ AuthProvider: Unexpected sign up error:', err)
      setError(errorMessage)
      updateDebugInfo('signUpError', errorMessage)
      return { data: null, error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signInWithMagicLink = async (email) => {
    console.log('🔗 AuthProvider: Sending magic link to:', email)
    
    try {
      setLoading(true)
      setError(null)
      updateDebugInfo('status', `Sending magic link to ${email}`)
      
      const { data, error } = await auth.signInWithMagicLink(email)
      
      if (error) {
        const errorMessage = error.message || 'Magic link failed'
        console.error('❌ AuthProvider: Magic link failed:', errorMessage)
        setError(errorMessage)
        updateDebugInfo('magicLinkError', errorMessage)
        return { data: null, error }
      }
      
      console.log('✅ AuthProvider: Magic link sent successfully')
      updateDebugInfo('status', 'Magic link sent')
      return { data, error: null }
    } catch (err) {
      const errorMessage = 'Unexpected magic link error'
      console.error('❌ AuthProvider: Unexpected magic link error:', err)
      setError(errorMessage)
      updateDebugInfo('magicLinkError', errorMessage)
      return { data: null, error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    console.log('👋 AuthProvider: Signing out user')
    
    try {
      setLoading(true)
      updateDebugInfo('status', 'Signing out')
      
      const { error } = await auth.signOut()
      
      if (error) {
        console.error('❌ AuthProvider: Sign out error:', error)
        setError(`Sign out error: ${error.message}`)
        updateDebugInfo('signOutError', error.message)
      } else {
        console.log('✅ AuthProvider: Sign out successful')
        setUser(null)
        setProfile(null)
        updateDebugInfo('status', 'Signed out')
      }
    } catch (err) {
      console.error('❌ AuthProvider: Unexpected sign out error:', err)
      setError('Unexpected sign out error')
      updateDebugInfo('signOutError', err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    console.log('📝 AuthProvider: Updating profile')
    
    try {
      if (!user) throw new Error('No user logged in')
      
      updateDebugInfo('status', 'Updating profile')
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ AuthProvider: Profile update error:', error)
        setError(`Profile update error: ${error.message}`)
        updateDebugInfo('profileUpdateError', error.message)
        return { data: null, error }
      }
      
      console.log('✅ AuthProvider: Profile updated successfully')
      setProfile(data)
      updateDebugInfo('status', 'Profile updated')
      return { data, error: null }
    } catch (err) {
      const errorMessage = err.message || 'Unexpected profile update error'
      console.error('❌ AuthProvider: Unexpected profile update error:', err)
      setError(errorMessage)
      updateDebugInfo('profileUpdateError', errorMessage)
      return { data: null, error: { message: errorMessage } }
    }
  }

  const isAdmin = () => {
    const adminStatus = profile?.role === 'admin'
    console.log('🔍 AuthProvider: Admin check:', { role: profile?.role, isAdmin: adminStatus })
    return adminStatus
  }

  const isMember = () => {
    const memberStatus = profile?.role === 'member'
    console.log('🔍 AuthProvider: Member check:', { role: profile?.role, isMember: memberStatus })
    return memberStatus
  }

  const clearError = () => {
    console.log('🧹 AuthProvider: Clearing error')
    setError(null)
    updateDebugInfo('lastError', null)
  }

  const value = {
    user,
    profile,
    loading,
    error,
    debugInfo, // Expose debug info for troubleshooting
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    updateProfile,
    isAdmin,
    isMember,
    clearError
  }

  // Log current state periodically for debugging
  useEffect(() => {
    const logCurrentState = () => {
      console.log('📊 AuthProvider State:', {
        hasUser: !!user,
        hasProfile: !!profile,
        loading,
        error: error || 'none',
        userEmail: user?.email || 'none',
        userRole: profile?.role || 'unknown'
      })
    }
    
    const interval = setInterval(logCurrentState, 30000) // Log every 30 seconds
    return () => clearInterval(interval)
  }, [user, profile, loading, error])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
