import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { 
  DollarSign, TrendingUp, TrendingDown, Users, 
  Activity, BookOpen, Calendar, Target,
  ArrowUpRight, ArrowDownRight, Wallet
} from 'lucide-react';
import { Page } from '../components/Page'

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
          member_id,
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
      if (account.member_id) {
        const { data: timelineData, error: timelineError } = await supabase
          .from('member_monthly_balances')
          .select(`
            report_date,
            portfolio_value,
            total_units,
            total_contribution,
            growth_amount,
            growth_pct
          `)
          .eq('member_id', account.member_id)
          .order('report_date', { ascending: true })
        if (timelineError) {
          console.warn('Could not load member history:', timelineError)
        } else {
          timeline = timelineData || []
        }
      }

      const latest = (timeline && timeline.length > 0) ? timeline[timeline.length - 1] : null

      setMemberData({
        ...account,
        timeline,
        calculated_current_value: latest?.portfolio_value || account.current_value || 0,
        current_units: latest?.total_units || account.current_units || 0,
        total_contributions: account.total_contributions || 0,
        ownership_percentage: account.ownership_percentage || 0,
        total_gain_loss: (typeof latest?.growth_amount === 'number' ? latest.growth_amount : latest?.portfolio_growth_amount) || 0,
        return_percentage: (typeof latest?.growth_pct === 'number' ? latest.growth_pct : latest?.portfolio_growth) || 0,
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

  const timelineChartData = useMemo(() => {
    if (!memberData?.timeline) return []
    return memberData.timeline.map((entry) => ({
      date: entry.report_date
        ? new Date(entry.report_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Unknown',
      portfolio_value: Number(entry.portfolio_value || 0),
    }))
  }, [memberData?.timeline])

  const isPositiveReturn = (memberData?.return_percentage || 0) >= 0

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
      <Page title="My Dashboard">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted mt-4">Loading your portfolio...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="My Dashboard">
        <div className="card p-6 border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Access Error</h3>
          <p className="text-muted">{error}</p>
        </div>
      </Page>
    );
  }

  if (!memberData) {
    return (
      <Page title="My Dashboard">
        <div className="card p-6">
          <p className="text-muted">No member data available</p>
        </div>
      </Page>
    );
  }

  return (
    <Page 
      title={`Welcome back, ${memberData.member_name || memberData.email || 'Member'}!`}
      subtitle="Your investment portfolio overview"
    >
      <div className="space-y-6">
        {/* Main Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Value */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Portfolio Value</p>
                <p className="text-2xl font-bold text-default">
                  {formatCurrency(memberData.calculated_current_value || memberData.current_value)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Units Owned */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Units Owned</p>
                <p className="text-2xl font-bold text-default">
                  {(memberData.current_units || 0).toFixed(4)}
                </p>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Total Return */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Total Return</p>
                <p className={`text-2xl font-bold ${isPositiveReturn ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(memberData.total_gain_loss)}
                </p>
                <p className={`text-sm ${isPositiveReturn ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercentage(memberData.return_percentage)}
                </p>
              </div>
              {isPositiveReturn ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
          </div>

          {/* Total Contributed */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Total Contributed</p>
                <p className="text-2xl font-bold text-default">
                  {formatCurrency(memberData.total_contributions)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted mb-1">Account value over time</p>
              <p className="text-lg font-semibold text-default">Portfolio history</p>
            </div>
          </div>
          {timelineChartData.length === 0 ? (
            <p className="text-muted">No historical data available yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineChartData}>
                  <CartesianGrid stroke="rgb(var(--color-border))" />
                  <XAxis dataKey="date" stroke="rgb(var(--color-text))" />
                  <YAxis
                    stroke="rgb(var(--color-text))"
                    tickFormatter={(value) =>
                      `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    }
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgb(var(--color-surface))', borderColor: 'rgb(var(--color-border))' }}
                    labelStyle={{ color: 'rgb(var(--color-text))' }}
                    formatter={(value) =>
                      `$${Number(value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                  />
                  <Line type="monotone" dataKey="portfolio_value" stroke="rgb(var(--color-primary))" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Unit Price */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Current Unit Price</p>
                <p className="text-xl font-bold text-default">
                  {formatCurrency(memberData.current_unit_price)}
                </p>
                <p className="text-xs text-muted">
                  As of {formatDate(memberData.unit_price_date)}
                </p>
              </div>
              <Activity className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Ownership Percentage */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Club Ownership</p>
                <p className="text-xl font-bold text-default">
                  {((memberData.ownership_percentage || 0) * 100).toFixed(2)}%
                </p>
                <p className="text-xs text-muted">
                  Of total club assets
                </p>
              </div>
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Total Transactions</p>
                <p className="text-xl font-bold text-default">
                  {memberData.total_transactions || 0}
                </p>
                <p className="text-xs text-muted">
                  Last: {formatDate(memberData.last_transaction_date)}
                </p>
              </div>
              <ArrowUpRight className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Member Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Status */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-default mb-4">Account Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted">Status</span>
                <span className={`badge ${
                  memberData.is_active
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {memberData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Email</span>
                <span className="text-default font-semibold">
                  {memberData.email || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Member Name</span>
                <span className="text-default font-semibold">{memberData.member_name}</span>
              </div>
            </div>
          </div>

          {/* Education Progress */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-default mb-4">Education Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted">Completed Lessons</span>
                <span className="text-default font-semibold">
                  {memberData.completed_lessons || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Time Spent Learning</span>
                <span className="text-default font-semibold">
                  {Math.round((memberData.total_time_spent || 0) / 60)} hours
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Average Score</span>
                <span className="text-default font-semibold">
                  {memberData.average_score ? `${Math.round(memberData.average_score)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Timeline */}
        {memberData.last_report_date && (
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-default mb-4">Latest Portfolio Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted">Report Date</p>
                <p className="text-lg font-semibold text-default">{formatDate(memberData.last_report_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Portfolio Value</p>
                <p className="text-lg font-semibold text-default">{formatCurrency(memberData.latest_portfolio_value)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Portfolio Growth</p>
                <p className={`text-lg font-semibold ${
                  (memberData.portfolio_growth || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formatPercentage(memberData.portfolio_growth)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
};

export default MemberDashboard;
