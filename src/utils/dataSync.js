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
      
      // Transform to Supabase member_accounts format
      const memberAccounts = base44Users.map(user => ({
        member_name: user.name,
        email: user.email,
        current_units: parseFloat(user.currentUnits || 0),
        total_contributions: parseFloat(user.totalContributions || 0),
        current_value: parseFloat(user.currentValue || 0),
        ownership_percentage: parseFloat(user.ownershipPercentage || 0),
        is_active: user.status === 'active'
      }))
      
      // Clear existing member accounts
      await supabase.from('member_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      // Insert new data
      const { data, error } = await supabase
        .from('member_accounts')
        .insert(memberAccounts)
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
      
      // Clear existing timeline data
      await supabase.from('ffa_timeline').delete().neq('id', 0)
      
      // Insert new data
      const { data, error } = await supabase
        .from('ffa_timeline')
        .insert(csvData)
        .select()
      
      if (error) {
        console.error('Error syncing timeline data:', error)
        return { success: false, error }
      }
      
      console.log(`Successfully synced ${data.length} timeline records to Supabase`)
      return { success: true, data }
      
    } catch (error) {
      console.error('Error in syncTimelineData:', error)
      return { success: false, error }
    }
  },

  // Get member data from Supabase with fallback to base44
  getMemberData: async (memberId = null) => {
    try {
      // Try Supabase first
      let query = supabase.from('member_accounts').select('*')
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
      let query = supabase
        .from('ffa_timeline')
        .select('*')
        .order('report_date', { ascending: true })
      
      if (memberName) {
        query = query.eq('member_name', memberName)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error getting timeline data:', error)
        return { data: [], error }
      }
      
      return { data, error: null }
      
    } catch (error) {
      console.error('Error in getTimelineData:', error)
      return { data: [], error }
    }
  },

  // Create or update member account in Supabase
  upsertMemberAccount: async (memberData) => {
    try {
      const { data, error } = await supabase
        .from('member_accounts')
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
      const { data, error } = await supabase
        .from('unit_prices')
        .upsert({
          price_date: date,
          unit_price: price,
          total_portfolio_value: totalValue,
          total_units: totalUnits
        }, { onConflict: 'price_date' })
        .select()
        .single()
      
      if (error) {
        console.error('Error upserting unit price:', error)
        return { success: false, error }
      }
      
      // Recalculate member values with new unit price
      await dataSyncUtils.recalculateMemberValues()
      
      return { success: true, data }
      
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
    // Check if we have any member accounts
    const { data, error } = await supabase
      .from('member_accounts')
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