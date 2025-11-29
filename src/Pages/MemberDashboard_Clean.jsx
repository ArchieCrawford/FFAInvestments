import React, { useMemo } from 'react';
import { useMemberAccountByEmail, useMemberTimelineByName, useLatestUnitPrice } from '../lib/queries'
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
  DollarSign, TrendingUp, TrendingDown, 
  Activity, ArrowUpRight, ArrowDownRight, Wallet
} from 'lucide-react';
import { Page } from '../components/Page'

const MemberDashboard = () => {
  const [userEmail, setUserEmail] = React.useState(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email);
    });
  }, []);

  const { data: account, isLoading: loadingAccount, error: accountError } = useMemberAccountByEmail(userEmail);
  const { data: timeline, isLoading: loadingTimeline } = useMemberTimelineByName(account?.member_name);
  const { data: latestUnitPrice } = useLatestUnitPrice();

  const timelineChartData = useMemo(() => {
    if (!timeline || timeline.length === 0) return []
    return timeline.map((entry) => ({
      date: entry.report_date
        ? new Date(entry.report_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Unknown',
      portfolio_value: Number(entry.portfolio_value || 0),
    }))
  }, [timeline])

  const latest = timeline && timeline.length > 0 ? timeline[timeline.length - 1] : null

  const stats = {
    current_value: latest?.portfolio_value || account?.current_value || 0,
    current_units: latest?.total_units || account?.current_units || 0,
    total_contributions: account?.total_contributions || 0,
    total_gain_loss: latest?.growth_amount || 0,
    return_percentage: latest?.growth_pct || 0,
    ownership_percentage: account?.ownership_percentage || 0,
  };

  const isPositiveReturn = (stats.return_percentage || 0) >= 0;

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

  if (loadingAccount || loadingTimeline) {
    return (
      <Page title="My Dashboard" subtitle="Your investment overview">
        <div className="text-center py-12 text-muted">Loading your dashboard...</div>
      </Page>
    );
  }

  if (accountError) {
    return (
      <Page title="My Dashboard" subtitle="Your investment overview">
        <div className="card p-6 bg-red-50 border-red-200">
          <div className="text-red-800">Error: {accountError.message}</div>
        </div>
      </Page>
    );
  }

  if (!account) {
    return (
      <Page title="My Dashboard" subtitle="Your investment overview">
        <div className="card p-6">
          <div className="text-muted">Member profile not found. Please contact an administrator.</div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="My Dashboard" subtitle={`Welcome back, ${account.member_name || 'Member'}`}>
      <div className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6 bg-primary-soft">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted flex items-center gap-2">
                  <Wallet size={16} />
                  Portfolio Value
                </p>
                <p className="text-3xl font-bold text-default mt-2">
                  {formatCurrency(stats.current_value)}
                </p>
              </div>
              <div className="text-primary">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted flex items-center gap-2">
                  <Activity size={16} />
                  Total Return
                </p>
                <p className={`text-2xl font-bold mt-2 ${isPositiveReturn ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.total_gain_loss)}
                </p>
                <p className={`text-sm mt-1 ${isPositiveReturn ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(stats.return_percentage)}
                </p>
              </div>
              <div className={isPositiveReturn ? 'text-green-600' : 'text-red-600'}>
                {isPositiveReturn ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Units Owned</p>
                <p className="text-3xl font-bold text-default mt-2">
                  {stats.current_units.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                {latestUnitPrice && (
                  <p className="text-xs text-muted mt-1">
                    @ {formatCurrency(latestUnitPrice.unit_price)} per unit
                  </p>
                )}
              </div>
              <div className="text-primary">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-6">
            <p className="text-sm text-muted">Total Contributions</p>
            <p className="text-2xl font-semibold text-default mt-2">
              {formatCurrency(stats.total_contributions)}
            </p>
          </div>

          <div className="card p-6">
            <p className="text-sm text-muted">Ownership</p>
            <p className="text-2xl font-semibold text-default mt-2">
              {stats.ownership_percentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {timelineChartData.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-default mb-4">Portfolio History</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  stroke="#6b7280"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="portfolio_value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </Page>
  );
};

export default MemberDashboard;
