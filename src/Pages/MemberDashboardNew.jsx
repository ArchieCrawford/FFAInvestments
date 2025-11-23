import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'
import { getMemberTimeline } from '../lib/ffaApi'
import { 
  DollarSign, TrendingUp, TrendingDown, Users, 
  Activity, BookOpen, Calendar, Target,
  ArrowUpRight, ArrowDownRight, Wallet
} from 'lucide-react';

const MemberDashboard = () => {
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMemberData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      const authUser = authData?.user
      if (!authUser?.email) {
        setMemberData(null)
        setError('No authenticated user found.')
        return
      }

      const { data: account, error: accountError } = await supabase
        .from('member_accounts')
        .select(`
          id,
          member_name,
          email,
          current_units,
          total_contributions,
          current_value,
          ownership_percentage,
          is_active
        `)
        .eq('email', authUser.email)
        .limit(1)
        .maybeSingle()

      if (accountError) throw accountError
      if (!account) {
        setMemberData(null)
        setError('Member profile not found. Please contact an administrator.')
        return
      }

      let timeline = []
      try {
        timeline = await getMemberTimeline(account.id)
      } catch (err) {
        console.warn('Could not load member timeline:', err)
      }

      const latest = (timeline && timeline.length > 0) ? timeline[timeline.length - 1] : null

      setMemberData({
        ...account,
        timeline,
        calculated_current_value: latest?.portfolio_value || account.current_value || 0,
        current_units: latest?.total_units || account.current_units || 0,
        total_contributions: account.total_contributions || 0,
        ownership_percentage: account.ownership_percentage || 0,
        total_gain_loss: latest?.portfolio_growth_amount || 0,
        return_percentage: latest?.portfolio_growth || 0,
        current_unit_price: latest && latest.total_units ? (latest.portfolio_value / latest.total_units) : null,
        unit_price_date: latest?.report_date || null
      })
    } catch (err) {
      console.error('Error fetching member data:', err)
      setMemberData(null)
      setError(err.message || 'Failed to load member data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMemberData()
  }, [fetchMemberData])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (percent) => {
    const value = percent || 0;
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-red-400 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Access Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">No member data available</div>
      </div>
    );
  }

  const isPositiveReturn = (memberData.return_percentage || 0) >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {memberData.member_name || memberData.email || 'Member'}!
          </h1>
          <p className="text-blue-200">Here's your investment portfolio overview</p>
        </div>

        {/* Main Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Value */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Portfolio Value</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(memberData.calculated_current_value || memberData.current_value)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          {/* Units Owned */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Units Owned</p>
                <p className="text-2xl font-bold text-white">
                  {(memberData.current_units || 0).toFixed(4)}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </div>

          {/* Total Return */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Total Return</p>
                <p className={`text-2xl font-bold ${isPositiveReturn ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(memberData.total_gain_loss)}
                </p>
                <p className={`text-sm ${isPositiveReturn ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(memberData.return_percentage)}
                </p>
              </div>
              {isPositiveReturn ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
            </div>
          </div>

          {/* Total Contributed */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Total Contributed</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(memberData.total_contributions)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Unit Price */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Current Unit Price</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(memberData.current_unit_price)}
                </p>
                <p className="text-xs text-gray-400">
                  As of {formatDate(memberData.unit_price_date)}
                </p>
              </div>
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          {/* Ownership Percentage */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Club Ownership</p>
                <p className="text-xl font-bold text-white">
                  {((memberData.ownership_percentage || 0) * 100).toFixed(2)}%
                </p>
                <p className="text-xs text-gray-400">
                  Of total club assets
                </p>
              </div>
              <Users className="w-6 h-6 text-green-400" />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Total Transactions</p>
                <p className="text-xl font-bold text-white">
                  {memberData.total_transactions || 0}
                </p>
                <p className="text-xs text-gray-400">
                  Last: {formatDate(memberData.last_transaction_date)}
                </p>
              </div>
              <ArrowUpRight className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Member Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Status */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Account Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  memberData.is_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {memberData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Email</span>
                <span className="text-white font-semibold">
                  {memberData.email || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Member Name</span>
                <span className="text-white font-semibold">{memberData.member_name}</span>
              </div>
            </div>
          </div>

          {/* Education Progress */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Education Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Completed Lessons</span>
                <span className="text-white font-semibold">
                  {memberData.completed_lessons || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Time Spent Learning</span>
                <span className="text-white font-semibold">
                  {Math.round((memberData.total_time_spent || 0) / 60)} hours
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Average Score</span>
                <span className="text-white font-semibold">
                  {memberData.average_score ? `${Math.round(memberData.average_score)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Timeline */}
        {memberData.last_report_date && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Latest Portfolio Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-200">Report Date</p>
                <p className="text-lg font-semibold text-white">{formatDate(memberData.last_report_date)}</p>
              </div>
              <div>
                <p className="text-sm text-blue-200">Portfolio Value</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(memberData.latest_portfolio_value)}</p>
              </div>
              <div>
                <p className="text-sm text-blue-200">Portfolio Growth</p>
                <p className={`text-lg font-semibold ${
                  (memberData.portfolio_growth || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(memberData.portfolio_growth)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
