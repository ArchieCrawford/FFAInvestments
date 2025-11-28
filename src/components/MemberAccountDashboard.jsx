import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { createClient } from '@supabase/supabase-js';
import { Page } from './Page';
import { Wallet, TrendingUp, Users, Mail } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function MemberAccountDashboard() {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const memberIdNum = parseInt(memberId, 10);
        const [{ data: memberRow, error: memberErr }, { data: balances, error: balErr }] = await Promise.all([
          supabase.from('members').select('*').eq('id', memberIdNum).single(),
          supabase
            .from('member_monthly_balances')
            .select('id, report_month, portfolio_value, total_units')
            .eq('member_id', memberIdNum)
            .order('report_month', { ascending: true })
        ]);

        if (memberErr) throw memberErr;
        if (balErr) throw balErr;

        setMember(memberRow);
        const timelineData = (balances || []).map(b => ({
          id: b.id,
          reportDate: b.report_month,
          portfolioValue: b.portfolio_value ?? 0,
          totalUnits: b.total_units ?? 0,
        }));
        setTimeline(timelineData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [memberId]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

  const getFilteredTimeline = () => {
    if (selectedPeriod === 'all') return timeline;
    const months = selectedPeriod === '12m' ? 12 : selectedPeriod === '6m' ? 6 : 3;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return timeline.filter(t => new Date(t.reportDate) >= cutoff);
  };

  const filteredTimeline = getFilteredTimeline();
  const chartData = filteredTimeline.map(e => ({ date: formatDate(e.reportDate), portfolioValue: e.portfolioValue }));
  const latestEntry = timeline[timeline.length - 1];
  const previousEntry = timeline[timeline.length - 2];

  const totalGrowth = latestEntry && timeline[0] ? ((latestEntry.portfolioValue - timeline[0].portfolioValue) / timeline[0].portfolioValue) * 100 : 0;
  const monthlyGrowth = latestEntry && previousEntry ? ((latestEntry.portfolioValue - previousEntry.portfolioValue) / previousEntry.portfolioValue) * 100 : 0;
  const periodOptions = [
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '12m', label: '1Y' },
    { value: 'all', label: 'All' }
  ];

  if (loading) {
    return (
      <Page title="Member Account">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted mt-4">Loading member data...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (!member) {
    return (
      <Page title="Member Account">
        <div className="card p-6 border-l-4 border-red-500">
          <p className="text-red-400">Member not found</p>
        </div>
      </Page>
    );
  }

  return (
    <Page 
      title={member.name}
      subtitle={`Member since ${new Date(member.joinDate).toLocaleDateString()} • ${member.email || 'No email provided'}`}
      actions={
        <>
          <button className="btn-primary-soft border border-border px-4 py-2 rounded-lg flex items-center gap-2">
            <Mail size={16} />
            Send Message
          </button>
          <button className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2">
            <Users size={16} />
            Edit Profile
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Current Portfolio Value</p>
                <p className="text-3xl font-bold text-default">{formatCurrency(latestEntry?.portfolioValue || 0)}</p>
              </div>
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Total Units</p>
                <p className="text-3xl font-bold text-default">{latestEntry?.totalUnits?.toFixed(2) || '0.00'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Total Growth</p>
                <p className={`text-3xl font-bold ${totalGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(2)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Monthly Change</p>
                <p className={`text-3xl font-bold ${monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(2)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-default">Portfolio Performance Over Time</h3>
              <div className="flex flex-wrap gap-2">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`px-3 py-1 rounded-lg text-sm ${selectedPeriod === option.value ? 'btn-primary' : 'btn-primary-soft border border-border'}`}
                    onClick={() => setSelectedPeriod(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
                  <XAxis dataKey="date" stroke="rgb(var(--color-text))" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="rgb(var(--color-text))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgb(var(--color-surface))', borderColor: 'rgb(var(--color-border))' }}
                    formatter={(value, name) => [name === 'portfolioValue' ? formatCurrency(value) : value, name === 'portfolioValue' ? 'Portfolio Value' : 'Value']} 
                  />
                  <Area type="monotone" dataKey="portfolioValue" stroke="rgb(var(--color-primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted py-12">No timeline data available for this member</div>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-default">Recent Performance</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-sm font-medium text-muted">Month</th>
                      <th className="text-left py-3 text-sm font-medium text-muted">Value</th>
                      <th className="text-left py-3 text-sm font-medium text-muted">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimeline.slice(-5).reverse().map((entry, index) => {
                      const prevEntry = filteredTimeline[filteredTimeline.length - 2 - index];
                      const change = prevEntry ? ((entry.portfolioValue - prevEntry.portfolioValue) / prevEntry.portfolioValue) * 100 : 0;
                      return (
                        <tr key={entry.id} className="border-b border-border">
                          <td className="py-3 text-default">{formatDate(entry.reportDate)}</td>
                          <td className="py-3 text-default">{formatCurrency(entry.portfolioValue)}</td>
                          <td className="py-3">
                            <span className={`badge ${change >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-default">Account Summary</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted">Total Data Points</span>
                <strong className="text-default">{timeline.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">First Record</span>
                <strong className="text-default">{timeline[0] ? formatDate(timeline[0].reportDate) : 'N/A'}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Latest Record</span>
                <strong className="text-default">{latestEntry ? formatDate(latestEntry.reportDate) : 'N/A'}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Account Status</span>
                <span className="badge bg-green-500/20 text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
