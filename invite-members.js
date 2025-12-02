// Bulk invite script: run locally with SUPABASE_SERVICE_ROLE_KEY to create real auth users and send emails.
// Usage example:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... PROCESS_LIMIT=20 node invite-members.js
// WARNING: This will create actual Supabase auth users and trigger invite emails via your configured SMTP provider.

import fs from 'fs'
import path from 'path'
import { createObjectCsvWriter } from 'csv-writer'
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PROCESS_LIMIT } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const limit = Number.isFinite(Number(PROCESS_LIMIT)) && Number(PROCESS_LIMIT) > 0 ? Number(PROCESS_LIMIT) : 1000
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const tmpDir = '/tmp'
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const outPath = path.join(tmpDir, `invite_results_${timestamp}.csv`)

try {
  fs.mkdirSync(tmpDir, { recursive: true })
} catch (err) {
  console.warn('Unable to ensure /tmp directory exists:', err)
}

const csvWriter = createObjectCsvWriter({
  path: outPath,
  header: [
    { id: 'member_id', title: 'member_id' },
    { id: 'email', title: 'email' },
    { id: 'auth_user_id', title: 'auth_user_id' },
    { id: 'status', title: 'status' },
    { id: 'error', title: 'error' },
  ],
})

async function main() {
  console.log('Starting invite process...')

  const { data: members, error } = await supabase
    .from('members')
    .select('id, email, auth_user_id')
    .is('auth_user_id', null)
    .not('email', 'is', null)
    .neq('email', '')
    .limit(limit)

  if (error) {
    console.error('Failed to query members:', error)
    process.exit(1)
  }

  if (!members || members.length === 0) {
    console.log('No members found to invite.')
    return
  }

  const results = []

  for (const member of members) {
    try {
      const rawEmail = member.email || ''
      const normalizedEmail = rawEmail.trim().toLowerCase()

      if (!normalizedEmail) {
        results.push({
          member_id: member.id,
          email: rawEmail,
          auth_user_id: member.auth_user_id || '',
          status: 'skipped',
          error: 'empty email after trim',
        })
        continue
      }

      const { data: userData, error: createErr } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: false,
      })

      if (createErr) {
        console.error(`Create user error for ${normalizedEmail}:`, createErr.message)
        const { data: existingUsers, error: lookupErr } = await supabase.auth.admin.listUsers({
          search: normalizedEmail,
          limit: 1,
        })

        if (lookupErr) {
          results.push({
            member_id: member.id,
            email: normalizedEmail,
            auth_user_id: '',
            status: 'error',
            error: createErr.message || 'create user failed',
          })
          continue
        }

        if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
          const existing = existingUsers.users[0]
          const { error: updateExistingErr } = await supabase
            .from('members')
            .update({ auth_user_id: existing.id })
            .eq('id', member.id)

          if (updateExistingErr) {
            results.push({
              member_id: member.id,
              email: normalizedEmail,
              auth_user_id: existing.id,
              status: 'update_failed',
              error: updateExistingErr.message,
            })
          } else {
            console.log(`Linked existing user for ${normalizedEmail} -> ${existing.id}`)
            results.push({
              member_id: member.id,
              email: normalizedEmail,
              auth_user_id: existing.id,
              status: 'linked_existing_user',
              error: '',
            })
          }
          continue
        }

        results.push({
          member_id: member.id,
          email: normalizedEmail,
          auth_user_id: '',
          status: 'error',
          error: createErr.message || 'create user failed',
        })
        continue
      }

      const newUser = userData?.user ?? userData
      const userId = newUser?.id

      if (!userId) {
        results.push({
          member_id: member.id,
          email: normalizedEmail,
          auth_user_id: '',
          status: 'error',
          error: 'no user id returned',
        })
        continue
      }

      const { error: updateError } = await supabase
        .from('members')
        .update({ auth_user_id: userId })
        .eq('id', member.id)

      if (updateError) {
        console.error(`Failed to update member ${member.id} with user ${userId}:`, updateError)
        results.push({
          member_id: member.id,
          email: normalizedEmail,
          auth_user_id: userId,
          status: 'created_but_update_failed',
          error: updateError.message,
        })
        continue
      }

      console.log(`Invited ${normalizedEmail} -> auth_user_id ${userId}`)
      results.push({
        member_id: member.id,
        email: normalizedEmail,
        auth_user_id: userId,
        status: 'invited',
        error: '',
      })
    } catch (err) {
      console.error(`Unexpected error for member ${member.id}:`, err)
      results.push({
        member_id: member.id,
        email: member.email || '',
        auth_user_id: member.auth_user_id || '',
        status: 'error',
        error: err?.message || String(err),
      })
    }
  }

  await csvWriter.writeRecords(results)
  console.log(`Results written to ${outPath}`)
  console.log('Done.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
