import { useState, useEffect } from 'react'
import { supabase } from './supabase'

/**
 * useCurrentMember Hook
 * 
 * Returns the current authenticated member from the "members" table
 * by matching the auth user's ID to the auth_user_id column.
 * 
 * @returns {Object} { member, loading, error }
 */
export function useCurrentMember() {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      
      try {
        // Step 1: Get the current authentication session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        // Step 2: If no session exists, user is not logged in
        if (sessionError || !sessionData?.session) {
          if (mounted) {
            setMember(null)
            setError(null)
            setLoading(false)
          }
          return
        }

        const userId = sessionData.session.user.id

        // Step 3: Query the "members" table using auth_user_id
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('auth_user_id', userId)
          .maybeSingle()

        // Step 4: Handle query errors
        if (memberError && memberError.code !== 'PGRST116') {
          console.warn('[useCurrentMember] Error fetching member:', memberError)
          throw memberError
        }

        // Step 5: Return the member data (or null if not found)
        if (mounted) {
          setMember(memberData || null)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        // Step 6: Basic error handling
        console.error('[useCurrentMember] Unexpected error:', err)
        if (mounted) {
          setError(err)
          setMember(null)
          setLoading(false)
        }
      }
    }

    load()

    return () => { mounted = false }
  }, [])

  return { member, loading, error }
}

export default useCurrentMember
