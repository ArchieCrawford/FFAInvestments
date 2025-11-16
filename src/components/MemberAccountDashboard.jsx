import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { base44 } from '@/api/base44Client';

export default function MemberAccountDashboard() {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    loadMemberData();
  }, [memberId]);

  const loadMemberData = async () => {
    try {
      const allMembers = await base44.entities.User.list();
      const memberData = allMembers.find(m => m.id === parseInt(memberId));
      
      if (memberData) {
        setMember(memberData);
        const timelineData = await base44.entities.Account.getTimeline(parseInt(memberId));
        setTimeline(timelineData.sort((a, b) => new Date(a.reportDate) - new Date(b.reportDate)));
      }
    } catch (error) {
      console.error('Error loading member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getFilteredTimeline = () => {
    if (selectedPeriod === 'all') return timeline;
    
    const now = new Date();
    const months = selectedPeriod === '12m' ? 12 : selectedPeriod === '6m' ? 6 : 3;
    const cutoffDate = new Date(now.setMonth(now.getMonth() - months));
    
    return timeline.filter(entry => new Date(entry.reportDate) >= cutoffDate);
  };

  const filteredTimeline = getFilteredTimeline();

  const chartData = filteredTimeline.map(entry => ({
    date: formatDate(entry.reportDate),
    portfolioValue: entry.portfolioValue,
    units: entry.totalUnits,
    growth: entry.portfolioGrowthAmount
  }));

  const latestEntry = timeline[timeline.length - 1];
  const previousEntry = timeline[timeline.length - 2];
  
  const totalGrowth = latestEntry && timeline[0] ? 
    ((latestEntry.portfolioValue - timeline[0].portfolioValue) / timeline[0].portfolioValue) * 100 : 0;

  const monthlyGrowth = latestEntry && previousEntry ? 
    ((latestEntry.portfolioValue - previousEntry.portfolioValue) / previousEntry.portfolioValue) * 100 : 0;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-triangle me-2"></i>
        Member not found
      </div>
    );
  }

  return (
    <>
      {/* Member Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{member.name}</h2>
          <p className="text-muted mb-0">
            Member since {new Date(member.joinDate).toLocaleDateString()} • 
            {member.email || 'No email provided'}
          </p>
        </div>
        <div>
          <button className="btn btn-outline-primary me-2">
            <i className="fas fa-envelope me-1"></i>
            Send Message
          </button>
          <button className="btn btn-primary">
            <i className="fas fa-edit me-1"></i>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card-stat blue">
            <div>
              <div className="fw-bold">Current Portfolio Value</div>
              <div className="fs-4">{formatCurrency(latestEntry?.portfolioValue || 0)}</div>
            </div>
            <i className="fas fa-wallet fa-2x"></i>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-stat">
            <div>
              <div className="fw-bold">Total Units</div>
              <div className="fs-4">{latestEntry?.totalUnits?.toFixed(2) || '0.00'}</div>
            </div>
            <i className="fas fa-coins fa-2x text-muted"></i>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-stat">
            <div>
              <div className="fw-bold">Total Growth</div>
              <div className={`fs-4 ${totalGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(2)}%
              </div>
            </div>
            <i className="fas fa-chart-line fa-2x text-muted"></i>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-stat">
            <div>
              <div className="fw-bold">Monthly Change</div>
              <div className={`fs-4 ${monthlyGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(2)}%
              </div>
            </div>
            <i className="fas fa-trending-up fa-2x text-muted"></i>
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="task-box mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Portfolio Performance Over Time</h5>
          <div className="btn-group" role="group">
            <input type="radio" className="btn-check" name="period" id="3m" value="3m" 
                   checked={selectedPeriod === '3m'} onChange={(e) => setSelectedPeriod(e.target.value)} />
            <label className="btn btn-outline-primary btn-sm" htmlFor="3m">3M</label>
            
            <input type="radio" className="btn-check" name="period" id="6m" value="6m"
                   checked={selectedPeriod === '6m'} onChange={(e) => setSelectedPeriod(e.target.value)} />
            <label className="btn btn-outline-primary btn-sm" htmlFor="6m">6M</label>
            
            <input type="radio" className="btn-check" name="period" id="12m" value="12m"
                   checked={selectedPeriod === '12m'} onChange={(e) => setSelectedPeriod(e.target.value)} />
            <label className="btn btn-outline-primary btn-sm" htmlFor="12m">1Y</label>
            
            <input type="radio" className="btn-check" name="period" id="all" value="all"
                   checked={selectedPeriod === 'all'} onChange={(e) => setSelectedPeriod(e.target.value)} />
            <label className="btn btn-outline-primary btn-sm" htmlFor="all">All</label>
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e40af" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'portfolioValue' ? formatCurrency(value) : value,
                  name === 'portfolioValue' ? 'Portfolio Value' : name === 'units' ? 'Total Units' : 'Growth Amount'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="portfolioValue" 
                stroke="#1e40af" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-muted py-5">
            No timeline data available for this member
          </div>
        )}
      </div>

      {/* Recent Activity & Transaction History */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="task-box">
            <h5 className="mb-3">Recent Performance</h5>
            <div className="table-responsive">
              <table className="table table-sm">
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
                    const change = prevEntry ? 
                      ((entry.portfolioValue - prevEntry.portfolioValue) / prevEntry.portfolioValue) * 100 : 0;
                    
                    return (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.reportDate)}</td>
                        <td>{formatCurrency(entry.portfolioValue)}</td>
                        <td>
                          <span className={`badge ${change >= 0 ? 'bg-success' : 'bg-danger'}`}>
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
        
        <div className="col-md-6">
          <div className="task-box">
            <h5 className="mb-3">Account Summary</h5>
            <div className="list-group list-group-flush">
              <div className="list-group-item d-flex justify-content-between">
                <span>Total Data Points</span>
                <strong>{timeline.length}</strong>
              </div>
              <div className="list-group-item d-flex justify-content-between">
                <span>First Record</span>
                <strong>{timeline[0] ? formatDate(timeline[0].reportDate) : 'N/A'}</strong>
              </div>
              <div className="list-group-item d-flex justify-content-between">
                <span>Latest Record</span>
                <strong>{latestEntry ? formatDate(latestEntry.reportDate) : 'N/A'}</strong>
              </div>
              <div className="list-group-item d-flex justify-content-between">
                <span>Account Status</span>
                <span className="badge bg-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}