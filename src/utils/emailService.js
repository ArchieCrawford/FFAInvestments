import { supabase } from '../lib/supabase'

export async function queueClubEmail({ to, subject, message, createdBy }) {
  const { data, error } = await supabase
    .from('email_queue')
    .insert([
      {
        recipient: to,
        subject,
        body: message,
        created_by: createdBy || null,
        status: 'pending'
      }
    ])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
