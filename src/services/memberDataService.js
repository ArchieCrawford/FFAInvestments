import { supabase } from '../lib/supabase.js';
import { getMemberTimeline } from '../lib/ffaApi';

/**
 * Member Data Service
 * Handles all database operations for member-related data including:
 * - Basic member information
 * - Dues and payment tracking
 * - Unit values and portfolio data
 * - Club-wide metrics
 */

// =============================================================================
// MEMBERS TABLE OPERATIONS
// =============================================================================

export async function createMember(memberData) {
  try {
    const { data, error } = await supabase
      .from('members')
      .insert([{
        member_name: memberData.member_name,
        email: memberData.email,
        phone: memberData.phone,
        join_date: memberData.join_date || new Date().toISOString().split('T')[0],
        status: memberData.status || 'Active'
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating member:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllMembers() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('member_name');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching members:', error);
    return { success: false, error: error.message };
  }
}

export async function getMemberById(memberId) {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching member:', error);
    return { success: false, error: error.message };
  }
}

export async function updateMember(memberId, updates) {
  try {
    const { data, error } = await supabase
      .from('members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating member:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// MEMBER DUES OPERATIONS
// =============================================================================

export async function saveMemberDues(memberDuesData) {
  try {
    const { data, error } = await supabase
      .from('member_dues')
      .upsert(memberDuesData.map(dues => ({
        member_id: dues.member_id,
        payment_status: dues.payment_status,
        latest_amount_owed: dues.latest_amount_owed,
        total_payments: dues.total_payments,
        total_contribution: dues.total_contribution,
        last_payment_date: dues.last_payment_date,
        due_date: dues.due_date,
        notes: dues.notes,
        updated_at: new Date().toISOString()
      })), { 
        onConflict: 'member_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving member dues:', error);
    return { success: false, error: error.message };
  }
}

export async function getMemberDuesWithNames() {
  try {
    const { data, error } = await supabase
      .from('member_dues')
      .select(`
        *,
        members (
          member_name,
          email,
          status
        )
      `)
      .order('members(member_name)');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching member dues:', error);
    return { success: false, error: error.message };
  }
}

export async function updateMemberDues(memberId, duesUpdate) {
  try {
    const { data, error } = await supabase
      .from('member_dues')
      .update({ ...duesUpdate, updated_at: new Date().toISOString() })
      .eq('member_id', memberId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating member dues:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// MEMBER UNIT VALUES OPERATIONS
// =============================================================================

export async function saveMemberUnitValues(unitValuesData) {
  try {
    // Migrate to use member_monthly_balances (normalized)
    const { data, error } = await supabase
      .from('member_monthly_balances')
      .upsert(unitValuesData.map(unit => ({
        member_id: unit.member_id,
        report_date: unit.valuation_date || unit.report_date,
        portfolio_value: unit.total_value || unit.portfolio_value,
        total_units: unit.total_units,
        updated_at: new Date().toISOString()
      })), { 
        onConflict: 'member_id,report_date',
        ignoreDuplicates: false 
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving member unit values:', error);
    return { success: false, error: error.message };
  }
}

export async function getMemberUnitValues(valuationDate = null) {
  try {
    let query = supabase
      .from('member_monthly_balances')
      .select(`
        *,
        members (
          member_name,
          status
        )
      `);

    if (valuationDate) {
      query = query.eq('report_date', valuationDate);
    }

    const { data, error } = await query.order('report_date', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching member unit values:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// MEMBER PERSONAL DATA OPERATIONS
// =============================================================================

export async function saveMemberPersonalData(memberId, personalData) {
  try {
    const { data, error } = await supabase
      .from('member_personal_data')
      .upsert({
        member_id: memberId,
        ...personalData,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'member_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving member personal data:', error);
    return { success: false, error: error.message };
  }
}

export async function getMemberPersonalData(memberId) {
  try {
    const { data, error } = await supabase
      .from('member_personal_data')
      .select('*')
      .eq('member_id', memberId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return { success: true, data: data || null };
  } catch (error) {
    console.error('Error fetching member personal data:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// MEMBER PORTFOLIO DATA OPERATIONS
// =============================================================================

export async function saveMemberPortfolioData(portfolioData) {
  try {
    // Member portfolio data is now surfaced via RPC/view (api_get_member_timeline / v_member_positions_as_of).
    // For compatibility, we do not support direct upserts to portfolio positions via the frontend service.
    return { success: false, error: 'Direct portfolio upserts are not supported in the migrated schema. Use backend jobs or admin tools.' };
  } catch (error) {
    console.error('Error saving member portfolio data:', error);
    return { success: false, error: error.message };
  }
}

export async function getMemberPortfolioData(memberId) {
  try {
    // Use RPC to retrieve member timeline and positions
    const data = await getMemberTimeline(memberId)
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching member portfolio data:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllPortfolioData() {
  try {
    // Portfolio positions are now provided by the RPC/view v_member_positions_as_of or api_get_member_timeline.
    console.warn('getAllPortfolioData is deprecated; use the server RPC api_get_member_timeline or v_member_positions_as_of instead.')
    return { success: false, error: 'Deprecated — use api_get_member_timeline or v_member_positions_as_of' };
  } catch (error) {
    console.error('Error fetching all portfolio data:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// CLUB VALUES OPERATIONS
// =============================================================================

// =============================================================================
// NEW: CLUB UNIT VALUATIONS (replaces club_values / valuations tables)
// =============================================================================
export async function upsertClubUnitValuation(valuation) {
  try {
    const { data, error } = await supabase
      .from('club_unit_valuations')
      .upsert({
        valuation_date: valuation.valuation_date,
        total_value: valuation.total_value,
        total_units_outstanding: valuation.total_units_outstanding,
        unit_value: valuation.unit_value,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'valuation_date',
        ignoreDuplicates: false
      })
      .select()
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error upserting club unit valuation:', error);
    return { success: false, error: error.message };
  }
}

export async function getClubUnitValuations(limit = 12) {
  try {
    const { data, error } = await supabase
      .from('club_unit_valuations')
      .select('valuation_date, total_value, total_units_outstanding, unit_value')
      .order('valuation_date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching club unit valuations:', error);
    return { success: false, error: error.message };
  }
}

export async function getLatestClubUnitValuation() {
  try {
    const { data, error } = await supabase
      .from('club_unit_valuations')
      .select('valuation_date, total_value, total_units_outstanding, unit_value')
      .order('valuation_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data: data || null };
  } catch (error) {
    console.error('Error fetching latest club unit valuation:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// PAYMENT HISTORY OPERATIONS
// =============================================================================

export async function addPaymentHistory(paymentData) {
  try {
    const { data, error } = await supabase
      .from('payment_history')
      .insert([{
        member_id: paymentData.member_id,
        amount: paymentData.amount,
        payment_type: paymentData.payment_type,
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
        description: paymentData.description,
        processed_by: paymentData.processed_by
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adding payment history:', error);
    return { success: false, error: error.message };
  }
}

export async function getPaymentHistory(memberId = null, limit = 100) {
  try {
    let query = supabase
      .from('payment_history')
      .select(`
        *,
        members (
          member_name
        )
      `)
      .order('payment_date', { ascending: false })
      .limit(limit);

    if (memberId) {
      query = query.eq('member_id', memberId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// BULK DATA OPERATIONS
// =============================================================================

export async function importExcelDataToDatabase(excelData) {
  try {
    console.log('Starting Excel data import to database...');
    
    // First, create/update members
    const memberPromises = excelData.map(async (row) => {
      const memberResult = await supabase
        .from('members')
        .upsert({
          member_name: row["Member Name"],
          status: 'Active'
        }, { 
          onConflict: 'member_name',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      
      return memberResult;
    });

    const memberResults = await Promise.all(memberPromises);
    
    // Then, create/update dues for each member
    const duesData = excelData.map((row, index) => {
      const memberResult = memberResults[index];
      if (!memberResult.data) {
        console.error('Failed to create/find member:', row["Member Name"]);
        return null;
      }

      return {
        member_id: memberResult.data.id,
        payment_status: row["Payment Status"],
        latest_amount_owed: parseFloat(row["Latest Amount Owed"]) || 0,
        total_payments: parseFloat(row["Total Payments"]) || 0,
        total_contribution: parseFloat(row["Total Contribution"]) || 0,
        last_payment_date: null, // You can add this to your Excel if needed
        due_date: null, // You can add this to your Excel if needed
        notes: `Imported from Excel on ${new Date().toISOString().split('T')[0]}`
      };
    }).filter(Boolean);

    const duesResult = await saveMemberDues(duesData);

    console.log(`Successfully imported ${memberResults.length} members and ${duesData.length} dues records`);
    
    return { 
      success: true, 
      membersImported: memberResults.length,
      duesImported: duesData.length,
      data: { members: memberResults, dues: duesResult }
    };
  } catch (error) {
    console.error('Error importing Excel data to database:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export async function getMemberByName(memberName) {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('member_name', memberName)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data: data || null };
  } catch (error) {
    console.error('Error fetching member by name:', error);
    return { success: false, error: error.message };
  }
}

export async function getDashboardData() {
  try {
    const [membersResult, duesResult, latestValuationResult] = await Promise.all([
      getAllMembers(),
      getMemberDuesWithNames(),
      getLatestClubUnitValuation()
    ]);

    if (!membersResult.success || !duesResult.success) {
      throw new Error('Failed to fetch dashboard data');
    }

    const v = latestValuationResult.data || {};
    const dashboardData = {
      totalMembers: membersResult.data?.length || 0,
      activeMembers: membersResult.data?.filter(m => m.status === 'Active').length || 0,
      totalClubValue: v.total_value || 0,
      currentUnitValue: v.unit_value || 0,
      totalUnitsOutstanding: v.total_units_outstanding || 0,
      membersWithCreditBalance: duesResult.data?.filter(d => d.payment_status === 'Credit Balance').length || 0,
      membersOwingMoney: duesResult.data?.filter(d => d.payment_status === 'Owes Money').length || 0,
      membersCurrent: duesResult.data?.filter(d => d.payment_status === 'Current').length || 0
    };

    return { success: true, data: dashboardData };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { success: false, error: error.message };
  }
}