import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Member {
  id: string
  member_name: string
}

interface InviteMemberButtonProps {
  member: Member
}

export const InviteMemberButton = ({ member }: InviteMemberButtonProps) => {
  const [loading, setLoading] = useState(false)

  const handleSendInvite = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('invite-member', {
        body: { member_id: member.id }
      })

      if (error) {
        alert(`Error: ${error.message}`)
        return
      }

      if (data?.queued) {
        alert(`Invite sent to ${data.to_email}`)
      }
    } catch (err) {
      alert(`Failed to send invite: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleSendInvite} 
      disabled={loading}
      className="btn-primary-soft"
    >
      {loading ? 'Sending...' : 'Send Invite'}
    </button>
  )
}
