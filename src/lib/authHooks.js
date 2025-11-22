import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// Lightweight hook to load the current member row from the members table
export function useCurrentMember() {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser()

        // Treat the missing-session message as a non-error (logged out)
        if (userErr && userErr.message === 'Auth session missing!') {
          if (mounted) {
            setMember(null)
            setError(null)
            setLoading(false)
          }
          return
        }

        if (userErr) throw userErr

        const user = userData?.user
        if (!user) {
          if (mounted) {
            setMember(null)
            setError(null)
            setLoading(false)
          }
          return
        }

        const { data: members, error: memberErr } = await supabase
          .from('members')
          .select('id, member_name, email, role')
          .eq('auth_user_id', user.id)
          .limit(1)

        if (memberErr) throw memberErr

        if (mounted) {
          setMember((members && members.length) ? members[0] : null)
          setLoading(false)
        }
      } catch (err) {
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
