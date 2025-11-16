import { supabase } from '../lib/supabase.js';

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
    const { data, error } = await supabase
      .from('member_unit_values')
      .upsert(unitValuesData.map(unit => ({
        member_id: unit.member_id,
        unit_value: unit.unit_value,
        total_units: unit.total_units,
        total_value: unit.total_value,
        valuation_date: unit.valuation_date,
        updated_at: new Date().toISOString()
      })), { 
        onConflict: 'member_id,valuation_date',
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
      .from('member_unit_values')
      .select(`
        *,
        members (
          member_name,
          status
        )
      `);

    if (valuationDate) {
      query = query.eq('valuation_date', valuationDate);
    }

    const { data, error } = await query.order('valuation_date', { ascending: false });

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
    const { data, error } = await supabase
      .from('member_portfolio_data')
      .upsert(portfolioData.map(portfolio => ({
        member_id: portfolio.member_id,
        symbol: portfolio.symbol,
        company_name: portfolio.company_name,
        shares: portfolio.shares,
        purchase_price: portfolio.purchase_price,
        current_price: portfolio.current_price,
        market_value: portfolio.market_value,
        gain_loss: portfolio.gain_loss,
        gain_loss_percent: portfolio.gain_loss_percent,
        purchase_date: portfolio.purchase_date,
        last_updated: new Date().toISOString()
      })), { 
        onConflict: 'member_id,symbol',
        ignoreDuplicates: false 
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving member portfolio data:', error);
    return { success: false, error: error.message };
  }
}

export async function getMemberPortfolioData(memberId) {
  try {
    const { data, error } = await supabase
      .from('member_portfolio_data')
      .select('*')
      .eq('member_id', memberId)
      .order('symbol');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching member portfolio data:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllPortfolioData() {
  try {
    const { data, error } = await supabase
      .from('member_portfolio_data')
      .select(`
        *,
        members (
          member_name
        )
      `)
      .order('symbol');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching all portfolio data:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// CLUB VALUES OPERATIONS
// =============================================================================

export async function saveClubValues(clubValuesData) {
  try {
    const { data, error } = await supabase
      .from('club_values')
      .upsert({
        valuation_date: clubValuesData.valuation_date,
        total_club_value: clubValuesData.total_club_value,
        unit_value: clubValuesData.unit_value,
        total_units_outstanding: clubValuesData.total_units_outstanding,
        total_cash: clubValuesData.total_cash,
        total_investments: clubValuesData.total_investments,
        monthly_return_percent: clubValuesData.monthly_return_percent,
        ytd_return_percent: clubValuesData.ytd_return_percent,
        total_members: clubValuesData.total_members,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'valuation_date',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving club values:', error);
    return { success: false, error: error.message };
  }
}

export async function getClubValues(limit = 12) {
  try {
    const { data, error } = await supabase
      .from('club_values')
      .select('*')
      .order('valuation_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching club values:', error);
    return { success: false, error: error.message };
  }
}

export async function getLatestClubValues() {
  try {
    const { data, error } = await supabase
      .from('club_values')
      .select('*')
      .order('valuation_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data: data || null };
  } catch (error) {
    console.error('Error fetching latest club values:', error);
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
    const [membersResult, duesResult, clubValuesResult] = await Promise.all([
      getAllMembers(),
      getMemberDuesWithNames(),
      getLatestClubValues()
    ]);

    if (!membersResult.success || !duesResult.success) {
      throw new Error('Failed to fetch dashboard data');
    }

    const dashboardData = {
      totalMembers: membersResult.data?.length || 0,
      activeMembers: membersResult.data?.filter(m => m.status === 'Active').length || 0,
      totalClubValue: clubValuesResult.data?.total_club_value || 0,
      currentUnitValue: clubValuesResult.data?.unit_value || 0,
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