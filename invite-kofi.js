// invite-kofi.js
// One-off script: create an auth user for Kofi (kadih1@msn.com) and link to public.members row.
//
// Usage (PowerShell):
//   $env:SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
//   node invite-kofi.js

import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const TARGET_EMAIL = 'kadih1@msn.com'

async function main() {
  console.log('🔍 Looking up member for', TARGET_EMAIL)

  // 1) Load the member row for this email
  const { data: member, error: memberErr } = await supabase
    .from('members')
    .select('id, member_name, email, auth_user_id, claimed_at')
    .eq('email', TARGET_EMAIL)
    .maybeSingle()

  if (memberErr) {
    console.error('❌ Failed to query members table:', memberErr)
    process.exit(1)
  }

  if (!member) {
    console.error('❌ No member found with email:', TARGET_EMAIL)
    process.exit(1)
  }

  console.log('✅ Found member row:', {
    id: member.id,
    member_name: member.member_name,
    email: member.email,
    auth_user_id: member.auth_user_id,
    claimed_at: member.claimed_at,
  })

  if (member.auth_user_id) {
    console.log('ℹ️ Member already has auth_user_id, nothing to do.')
    process.exit(0)
  }

  // 2) Create the auth user (this may send an invite/confirmation email depending on your Supabase settings)
  console.log('🧑‍💻 Creating auth user via admin.createUser...')

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: TARGET_EMAIL,
    email_confirm: false, // let Supabase send invite / confirmation according to your config
  })

  if (createErr) {
    console.error('❌ Failed to create auth user:', {
      message: createErr.message,
      status: createErr.status,
    })
    process.exit(1)
  }

  const userId = created?.user?.id
  if (!userId) {
    console.error('❌ No user id returned from createUser')
    process.exit(1)
  }

  console.log('✅ Created auth user:', {
    id: userId,
    email: created.user.email,
  })

  // 3) Link the member row to this auth user
  console.log('🔗 Updating members.auth_user_id...')

  const { error: updateErr } = await supabase
    .from('members')
    .update({ auth_user_id: userId })
    .eq('id', member.id)
    .is('auth_user_id', null) // safety: only link if still null

  if (updateErr) {
    console.error('❌ Failed to update member with auth_user_id:', updateErr)
    process.exit(1)
  }

  console.log('✅ Successfully linked member to auth user.')
  console.log('Done.')
}

main().catch((err) => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
