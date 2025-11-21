import { supabase } from '../lib/supabase.js'
import { base44 } from '../api/base44Client.js'

/**
 * Data synchronization utilities between base44 mock system and Supabase
 * This allows for gradual migration while maintaining existing functionality
 */

export const dataSyncUtils = {
  // Sync member data from base44 to Supabase
  syncMembersToSupabase: async () => {
    try {
      console.log('Syncing members from base44 to Supabase...')
      
      // Get all users from base44
      const base44Users = await base44.entities.User.list()
      
      // Transform to normalized members table
      const members = base44Users.map(user => ({
        member_name: user.name,
        email: user.email,
        status: user.status === 'active' ? 'Active' : 'Inactive',
        external_short_id: user.shortId || null
      }))

      // Upsert into members
      const { data, error } = await supabase
        .from('members')
        .upsert(members, { onConflict: 'email' })
        .select()
      
      if (error) {
        console.error('Error syncing members:', error)
        return { success: false, error }
      }
      
      console.log(`Successfully synced ${data.length} members to Supabase`)
      return { success: true, data }
      
    } catch (error) {
      console.error('Error in syncMembersToSupabase:', error)
      return { success: false, error }
    }
  },

  // Load FFA timeline data from CSV and sync to Supabase
  syncTimelineData: async (csvData) => {
    try {
      console.log('Syncing timeline data to Supabase...')
      // Timeline ingestion is now handled by backend import tools or admin scripts.
      throw new Error('syncTimelineData is deprecated. Use the backend import process to load historical timeline data into the normalized schema.')
      
    } catch (error) {
      console.error('Error in syncTimelineData:', error)
      return { success: false, error }
    }
  },

  // Get member data from Supabase with fallback to base44
  getMemberData: async (memberId = null) => {
    try {
      // Try Supabase first
      let query = supabase.from('members').select('*')
      if (memberId) {
        query = query.eq('id', memberId)
      }
      
      const { data: supabaseData, error: supabaseError } = await query
      
      if (supabaseData && supabaseData.length > 0) {
        return { source: 'supabase', data: supabaseData }
      }
      
      // Fallback to base44
      console.log('Falling back to base44 for member data...')
      const base44Data = await base44.entities.User.list()
      return { source: 'base44', data: base44Data }
      
    } catch (error) {
      console.error('Error getting member data:', error)
      return { source: 'error', data: [], error }
    }
  },

  // Get timeline data from Supabase
  getTimelineData: async (memberName = null) => {
    try {
      // Use RPC api_get_member_timeline instead. This helper is deprecated.
      console.warn('dataSyncUtils.getTimelineData is deprecated; use the server RPC api_get_member_timeline or src/lib/ffaApi.getMemberTimeline')
      return { data: [], error: new Error('Deprecated — use ffaApi.getMemberTimeline') }
      
    } catch (error) {
      console.error('Error in getTimelineData:', error)
      return { data: [], error }
    }
  },

  // Create or update member account in Supabase
  upsertMemberAccount: async (memberData) => {
    try {
  // Write into the normalized members table (replacing the older accounts table design)
      const { data, error } = await supabase
        .from('members')
        .upsert(memberData, { onConflict: 'email' })
        .select()
        .single()
      
      if (error) {
        console.error('Error upserting member account:', error)
        return { success: false, error }
      }
      
      return { success: true, data }
      
    } catch (error) {
      console.error('Error in upsertMemberAccount:', error)
      return { success: false, error }
    }
  },

  // Record a transaction in Supabase
  recordTransaction: async (transactionData) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single()
      
      if (error) {
        console.error('Error recording transaction:', error)
        return { success: false, error }
      }
      
      // Update member account values after transaction
      await dataSyncUtils.recalculateMemberValues()
      
      return { success: true, data }
      
    } catch (error) {
      console.error('Error in recordTransaction:', error)
      return { success: false, error }
    }
  },

  // Recalculate all member account values
  recalculateMemberValues: async () => {
    try {
      // Call the SQL function to recalculate values
      const { data, error } = await supabase.rpc('recalculate_member_values')
      
      if (error) {
        console.error('Error recalculating member values:', error)
        return { success: false, error }
      }
      
      return { success: true, data }
      
    } catch (error) {
      console.error('Error in recalculateMemberValues:', error)
      return { success: false, error }
    }
  },

  // Get or create unit price entry
  upsertUnitPrice: async (date, price, totalValue, totalUnits) => {
    try {
      // Unit price is now derived from member_monthly_balances. This helper is deprecated.
      throw new Error('upsertUnitPrice is deprecated. Unit prices are calculated from member_monthly_balances and should not be upserted from the frontend.')
      
    } catch (error) {
      console.error('Error in upsertUnitPrice:', error)
      return { success: false, error }
    }
  },

  // Initialize Supabase with existing data
  initializeSupabaseData: async () => {
    try {
      console.log('Initializing Supabase with existing data...')
      
      // 1. Sync member accounts
      const memberSync = await dataSyncUtils.syncMembersToSupabase()
      if (!memberSync.success) {
        throw new Error(`Failed to sync members: ${memberSync.error}`)
      }
      
      // 2. Initialize with latest unit price (from your data: $35.68)
      const unitPriceSync = await dataSyncUtils.upsertUnitPrice(
        new Date().toISOString().split('T')[0], // Today's date
        35.68, // Current unit price from your data
        null, // Will be calculated
        null  // Will be calculated
      )
      
      if (!unitPriceSync.success) {
        console.warn('Failed to set initial unit price:', unitPriceSync.error)
      }
      
      console.log('Supabase initialization completed successfully!')
      return { success: true }
      
    } catch (error) {
      console.error('Error initializing Supabase data:', error)
      return { success: false, error }
    }
  }
}

// Auto-initialize on first load
let initializationAttempted = false

export const ensureSupabaseInitialized = async () => {
  if (initializationAttempted) return
  initializationAttempted = true
  
  try {
    // Check if we have any members
    const { data, error } = await supabase
      .from('members')
      .select('id')
      .limit(1)
    
    if (error) {
      console.warn('Could not check Supabase initialization status:', error)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('No member accounts found, initializing Supabase...')
      await dataSyncUtils.initializeSupabaseData()
    } else {
      console.log('Supabase already initialized with member data')
    }
  } catch (error) {
    console.error('Error checking Supabase initialization:', error)
  }
}