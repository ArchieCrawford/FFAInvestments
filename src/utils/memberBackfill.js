import { supabase } from '../lib/supabase'

/**
 * Member Balance Backfill Utility
 * 
 * This utility updates member_monthly_balances rows that have null member_id
 * by matching them to the correct member using email or member_name.
 * 
 * Use case: When CSV imports don't include member_id foreign keys
 * 
 * @returns {Object} { success: boolean, updated: number, errors: Array }
 */
export async function backfillMemberBalances() {
  console.log('[Backfill] Starting member balance backfill...')
  
  const results = {
    success: true,
    updated: 0,
    errors: []
  }

  try {
    // Step 1: Query all rows from member_monthly_balances where member_id is null
    const { data: balanceRows, error: balanceError } = await supabase
      .from('member_monthly_balances')
      .select('*')
      .is('member_id', null)

    if (balanceError) {
      console.error('[Backfill] Error fetching balances:', balanceError)
      throw balanceError
    }

    if (!balanceRows || balanceRows.length === 0) {
      console.log('[Backfill] No rows with null member_id found')
      return results
    }

    console.log(`[Backfill] Found ${balanceRows.length} rows with null member_id`)

    // Step 2: For each row, find the matching member
    for (const row of balanceRows) {
      try {
        let memberId = null

        // Try to match by email first
        if (row.email) {
          const { data: memberByEmail, error: emailError } = await supabase
            .from('members')
            .select('member_id, id')
            .eq('email', row.email)
            .maybeSingle()

          if (emailError && emailError.code !== 'PGRST116') {
            console.warn(`[Backfill] Error looking up member by email ${row.email}:`, emailError)
          }

          if (memberByEmail) {
            memberId = memberByEmail.member_id || memberByEmail.id
            console.log(`[Backfill] Matched by email: ${row.email} → member_id: ${memberId}`)
          }
        }

        // Fallback: Try to match by member_name if email didn't work
        if (!memberId && row.member_name) {
          const { data: memberByName, error: nameError } = await supabase
            .from('members')
            .select('member_id, id')
            .eq('member_name', row.member_name)
            .maybeSingle()

          if (nameError && nameError.code !== 'PGRST116') {
            console.warn(`[Backfill] Error looking up member by name ${row.member_name}:`, nameError)
          }

          if (memberByName) {
            memberId = memberByName.member_id || memberByName.id
            console.log(`[Backfill] Matched by name: ${row.member_name} → member_id: ${memberId}`)
          }
        }

        // Step 3: Update the row if we found a matching member
        if (memberId) {
          const { error: updateError } = await supabase
            .from('member_monthly_balances')
            .update({ member_id: memberId })
            .eq('id', row.id)

          if (updateError) {
            console.error(`[Backfill] Error updating row ${row.id}:`, updateError)
            results.errors.push({
              rowId: row.id,
              email: row.email,
              memberName: row.member_name,
              error: updateError.message
            })
          } else {
            results.updated++
            console.log(`[Backfill] Updated row ${row.id} with member_id ${memberId}`)
          }
        } else {
          console.warn(`[Backfill] No member found for row ${row.id} (email: ${row.email}, name: ${row.member_name})`)
          results.errors.push({
            rowId: row.id,
            email: row.email,
            memberName: row.member_name,
            error: 'No matching member found'
          })
        }
      } catch (err) {
        console.error(`[Backfill] Unexpected error processing row ${row.id}:`, err)
        results.errors.push({
          rowId: row.id,
          error: err.message
        })
      }
    }

    if (results.errors.length > 0) {
      results.success = false
    }

    console.log(`[Backfill] Completed. Updated: ${results.updated}, Errors: ${results.errors.length}`)
    return results

  } catch (err) {
    console.error('[Backfill] Fatal error:', err)
    results.success = false
    results.errors.push({
      error: err.message,
      fatal: true
    })
    return results
  }
}

/**
 * Example usage:
 * 
 * import { backfillMemberBalances } from '@/utils/memberBackfill'
 * 
 * const results = await backfillMemberBalances()
 * console.log('Backfill results:', results)
 */
