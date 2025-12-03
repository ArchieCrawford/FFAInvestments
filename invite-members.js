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

  for (const m of members) {
    const email = (m.email || '').trim().toLowerCase()

    if (!email) {
      results.push({
        member_id: m.id,
        email: m.email,
        auth_user_id: '',
        status: 'skipped',
        error: 'empty email after trim',
      })
      continue
    }

        try {
      let userId = null
      let usedExistingUser = false

      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: false,
      })

      if (!createErr && created?.user?.id) {
        userId = created.user.id
      } else {
        console.error('Create user error for', email, JSON.stringify(createErr, null, 2))

        // Always try lookup by email on any create error
        const { data: existing, error: lookupErr } = await supabase.auth.admin.getUserByEmail(email)

        if (lookupErr) {
          results.push({
            member_id: m.id,
            email,
            auth_user_id: '',
            status: 'error_create_or_lookup',
            error: lookupErr?.message || `create error: ${createErr?.message || String(createErr)}`,
          })
          continue
        }

        if (!existing?.user || (existing.user.email || '').toLowerCase() !== email) {
          results.push({
            member_id: m.id,
            email,
            auth_user_id: '',
            status: 'error_create_or_lookup',
            error:
              createErr?.message ||
              'could not find existing user after create error',
          })
          continue
        }

        userId = existing.user.id
        usedExistingUser = true
      }


      if (!userId) {
        results.push({
          member_id: m.id,
          email,
          auth_user_id: '',
          status: 'error_create_or_lookup',
          error: 'no user id available after create/lookup',
        })
        continue
      }

      const { error: updateError } = await supabase
        .from('members')
        .update({ auth_user_id: userId })
        .eq('id', m.id)

      if (updateError) {
        const msg = updateError.message || String(updateError)
        const isDuplicateAuthUserId =
          msg.includes('duplicate key value') && msg.includes('uq_members_auth_user_id')

        results.push({
          member_id: m.id,
          email,
          auth_user_id: userId,
          status: isDuplicateAuthUserId ? 'duplicate_auth_user_id' : 'created_but_update_failed',
          error: msg,
        })
        continue
      }

      console.log(`Linked member ${m.id} (${email}) -> auth_user_id ${userId}`)
      results.push({
        member_id: m.id,
        email,
        auth_user_id: userId,
        status: usedExistingUser ? 'linked_existing_user' : 'invited',
        error: '',
      })
    } catch (err) {
      console.error(`Unexpected error for ${email}:`, err)
      results.push({
        member_id: m.id,
        email,
        auth_user_id: '',
        status: 'error_create_or_lookup',
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
