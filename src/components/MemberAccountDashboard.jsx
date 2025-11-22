import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { base44 } from '@/api/base44Client';

export default function MemberAccountDashboard() {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const allMembers = await base44.entities.User.list();
        const memberData = allMembers.find(m => m.id === parseInt(memberId, 10));
        if (memberData) {
          setMember(memberData);
          const timelineData = await base44.entities.Account.getTimeline(parseInt(memberId, 10));
          setTimeline(timelineData.sort((a, b) => new Date(a.reportDate) - new Date(b.reportDate)));
        }
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
      <div className="flex items-center justify-center" style={{ height: 400 }}>
        <div className="spinner-page" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  if (!member) {
    return <div className="app-alert app-alert-destructive">Member not found</div>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="app-heading-lg">{member.name}</h2>
          <p className="app-text-muted mb-0">Member since {new Date(member.joinDate).toLocaleDateString()} • {member.email || 'No email provided'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="app-btn app-btn-outline">
            <i className="fas fa-envelope" style={{ marginRight: 6 }} />
            Send Message
          </button>
          <button className="app-btn app-btn-primary">
            <i className="fas fa-edit" style={{ marginRight: 6 }} />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-4">
        <div className="app-card app-card-stat blue">
          <div>
            <div className="app-heading-md">Current Portfolio Value</div>
            <div className="app-heading-lg">{formatCurrency(latestEntry?.portfolioValue || 0)}</div>
          </div>
          <i className="fas fa-wallet fa-2x" />
        </div>
        <div className="app-card app-card-stat">
          <div>
            <div className="app-heading-md">Total Units</div>
            <div className="app-heading-lg">{latestEntry?.totalUnits?.toFixed(2) || '0.00'}</div>
          </div>
          <i className="fas fa-coins fa-2x" />
        </div>
        <div className="app-card app-card-stat">
          <div>
            <div className="app-heading-md">Total Growth</div>
            <div className="app-heading-lg" style={{ color: totalGrowth >= 0 ? 'var(--accent-green)' : '#f87171' }}>
              {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(2)}%
            </div>
          </div>
          <i className="fas fa-chart-line fa-2x" />
        </div>
        <div className="app-card app-card-stat">
          <div>
            <div className="app-heading-md">Monthly Change</div>
            <div className="app-heading-lg" style={{ color: monthlyGrowth >= 0 ? 'var(--accent-green)' : '#f87171' }}>
              {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(2)}%
            </div>
          </div>
          <i className="fas fa-trending-up fa-2x" />
        </div>
      </div>

      <div className="app-card mb-4">
        <div className="app-card-header">
          <h5 className="app-card-title">Portfolio Performance Over Time</h5>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`app-btn app-btn-sm ${selectedPeriod === option.value ? 'app-btn-primary' : 'app-btn-outline'}`}
                onClick={() => setSelectedPeriod(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e40af" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value, name) => [name === 'portfolioValue' ? formatCurrency(value) : value, name === 'portfolioValue' ? 'Portfolio Value' : 'Value']} />
              <Area type="monotone" dataKey="portfolioValue" stroke="#1e40af" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center app-text-muted py-5">No timeline data available for this member</div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="app-card">
          <div className="app-card-header"><h5 className="app-card-title">Recent Performance</h5></div>
          <div className="app-card-content">
            <div className="app-table-scroll">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Value</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimeline.slice(-5).reverse().map((entry, index) => {
                    const prevEntry = filteredTimeline[filteredTimeline.length - 2 - index];
                    const change = prevEntry ? ((entry.portfolioValue - prevEntry.portfolioValue) / prevEntry.portfolioValue) * 100 : 0;
                    return (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.reportDate)}</td>
                        <td>{formatCurrency(entry.portfolioValue)}</td>
                        <td><span className="app-pill">{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="app-card">
          <div className="app-card-header"><h5 className="app-card-title">Account Summary</h5></div>
          <div className="app-card-content">
            <div className="app-card-row flex items-center justify-between"><span>Total Data Points</span><strong>{timeline.length}</strong></div>
            <div className="app-card-row flex items-center justify-between"><span>First Record</span><strong>{timeline[0] ? formatDate(timeline[0].reportDate) : 'N/A'}</strong></div>
            <div className="app-card-row flex items-center justify-between"><span>Latest Record</span><strong>{latestEntry ? formatDate(latestEntry.reportDate) : 'N/A'}</strong></div>
            <div className="app-card-row flex items-center justify-between"><span>Account Status</span><span className="app-pill">Active</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
