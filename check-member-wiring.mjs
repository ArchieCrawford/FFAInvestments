import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const emailToCheck = process.env.CHECK_EMAIL

if (!supabaseUrl || !supabaseKey || !emailToCheck) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or CHECK_EMAIL in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Checking wiring for email:', emailToCheck)

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  })

  if (usersError) {
    console.error('Error fetching users:', usersError)
    process.exit(1)
  }

  const user = usersPage.users.find(u => u.email === emailToCheck)

  if (!user) {
    console.log('No auth user found for that email.')
    process.exit(0)
  }

  console.log('Auth user id:', user.id)

  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', user.id)

  if (membersError) {
    console.error('Error fetching members:', membersError)
    process.exit(1)
  }

  console.log('Members linked via members.auth_user_id:')
  console.log(JSON.stringify(members, null, 2))

  const member = members[0]

  const { data: linkRows, error: linkError } = await supabase
    .from('member_to_auth')
    .select('*')
    .eq('auth_user_id', user.id)

  if (linkError && linkError.code !== '42P01') {
    console.error('Error fetching member_to_auth rows:', linkError)
    process.exit(1)
  }

  if (linkError && linkError.code === '42P01') {
    console.log('member_to_auth table not found, skipping that check.')
  } else {
    console.log('Rows in member_to_auth for this auth user:')
    console.log(JSON.stringify(linkRows, null, 2))
  }

  if (!member) {
    console.log('No member row linked to this auth user; stopping before snapshot/history checks.')
    process.exit(0)
  }

  const memberId = member.id
  console.log('Using member_id:', memberId)

  const { data: latestSnapshot, error: latestError } = await supabase
    .from('member_latest_snapshot')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle()

  if (latestError && latestError.code !== 'PGRST116') {
    console.error('Error fetching latest snapshot:', latestError)
    process.exit(1)
  }

  console.log('member_latest_snapshot for this member:')
  console.log(JSON.stringify(latestSnapshot, null, 2))

  const { data: history, error: historyError } = await supabase
    .from('member_growth_over_time')
    .select('*')
    .eq('member_id', memberId)
    .order('report_month', { ascending: true })

  if (historyError && historyError.code !== 'PGRST116') {
    console.error('Error fetching growth history:', historyError)
    process.exit(1)
  }

  console.log('member_growth_over_time rows for this member:')
  console.log(JSON.stringify(history, null, 2))

  console.log('Done.')
}

main().catch(e => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
