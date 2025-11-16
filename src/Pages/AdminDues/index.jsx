import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, Eye, EyeOff, TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './AdminDues.css';

const DuesTracker = () => {
  const [duesData, setDuesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [expandedMembers, setExpandedMembers] = useState(new Set());

  // Load real member data from database
  useEffect(() => {
    const loadDuesData = async () => {
      try {
        setLoading(true);
        
        // Fetch all profiles/members from Supabase
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('display_name');

        if (profilesError) {
          throw new Error(`Database error: ${profilesError.message}`);
        }

        if (!profiles || profiles.length === 0) {
          throw new Error('No members found in database');
        }

        // Generate mock dues data for each member
        const memberDetails = {};
        
        // If we have very few members, create additional mock data for demonstration
        const allMembers = [...profiles];
        
        // Add some demo members if we don't have enough real ones for testing
        if (profiles.length < 5) {
          const demoMembers = [
            { display_name: 'Sarah Johnson', role: 'member', id: 'demo-1' },
            { display_name: 'Michael Brown', role: 'member', id: 'demo-2' },
            { display_name: 'Jennifer Davis', role: 'member', id: 'demo-3' },
            { display_name: 'Robert Wilson', role: 'member', id: 'demo-4' },
            { display_name: 'Emily Garcia', role: 'member', id: 'demo-5' },
            { display_name: 'David Martinez', role: 'member', id: 'demo-6' },
            { display_name: 'Lisa Anderson', role: 'member', id: 'demo-7' },
            { display_name: 'James Taylor', role: 'member', id: 'demo-8' },
          ];
          
          allMembers.push(...demoMembers.slice(0, 15 - profiles.length));
        }
        
        allMembers.forEach((profile, index) => {
          const memberName = profile.display_name || `User ${profile.id.substring(0, 8)}`;
          const isRealMember = !profile.id.toString().startsWith('demo-');
          
          // Generate realistic mock data for each member
          const basePayment = 100; // $100 monthly dues
          const monthsActive = Math.floor(Math.random() * 12) + 1; // 1-12 months
          const totalPayments = basePayment * monthsActive + (Math.random() * 500 - 250); // Some variance
          const owedAmount = Math.random() > 0.7 ? (Math.random() * 300 - 150) : 0; // 30% chance of owing/overpaying
          
          // Determine status
          let status = 'current';
          if (owedAmount > 50) status = 'owes_money';
          else if (owedAmount < -50) status = 'overpaid';
          else if (owedAmount < 0) status = 'credit_balance';

          // Generate monthly data for last 6 months
          const monthlyData = {};
          const months = ['Nov 2025', 'Oct 2025', 'Sep 2025', 'Aug 2025', 'Jul 2025', 'Jun 2025'];
          months.slice(0, selectedMonths > 6 ? 6 : selectedMonths).forEach(month => {
            const paidAmount = Math.random() > 0.2 ? basePayment + (Math.random() * 50 - 25) : 0;
            const owedForMonth = basePayment - paidAmount;
            
            monthlyData[month] = {
              dues_paid_formatted: `$${paidAmount.toFixed(2)}`,
              dues_owed_formatted: owedForMonth > 0 ? `$${owedForMonth.toFixed(2)}` : owedForMonth < 0 ? `($${Math.abs(owedForMonth).toFixed(2)})` : '$0.00',
              dues_owed_amount: owedForMonth
            };
          });

          memberDetails[memberName] = {
            latest_status: status,
            latest_owed: owedAmount,
            total_payments: Math.max(0, totalPayments),
            latest_contribution: Math.max(0, totalPayments * 10 + Math.random() * 5000), // Rough estimate
            monthly_data: monthlyData,
            isRealMember: isRealMember // Track whether this is real or demo data
          };
        });

        // Calculate summary statistics
        const totalMembers = allMembers.length;
        const realMembers = profiles.length;
        const totalPayments = Object.values(memberDetails).reduce((sum, member) => sum + member.total_payments, 0);
        const membersWithOverpayments = Object.values(memberDetails).filter(member => member.latest_owed < -50).length;
        const membersOwingMoney = Object.values(memberDetails).filter(member => member.latest_owed > 50).length;

        const duesData = {
          summary: {
            total_members: totalMembers,
            real_members: realMembers,
            total_payments_collected: totalPayments,
            members_with_overpayments: membersWithOverpayments,
            members_owing_money: membersOwingMoney,
            member_details: memberDetails
          },
          months_processed: ['Nov 2025', 'Oct 2025', 'Sep 2025', 'Aug 2025', 'Jul 2025', 'Jun 2025'].slice(0, selectedMonths > 6 ? 6 : selectedMonths),
          processing_date: new Date().toISOString()
        };
        
        setDuesData(duesData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error loading dues data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDuesData();
  }, [selectedMonths]);

  const toggleMemberDetails = (memberName) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberName)) {
      newExpanded.delete(memberName);
    } else {
      newExpanded.add(memberName);
    }
    setExpandedMembers(newExpanded);
  };

  const getStatusBadge = (status) => {
    const badges = {
      current: { text: '✅ Current', class: 'status-current' },
      overpaid: { text: '✅ Overpaid', class: 'status-overpaid' },
      owes_money: { text: '❗ Owes Money', class: 'status-owes' },
      credit_balance: { text: '💳 Credit', class: 'status-credit' }
    };
    return badges[status] || { text: '⚪ Current', class: 'status-current' };
  };

  const formatAmount = (amount) => {
    if (amount > 0) {
      return { text: `$${amount.toFixed(2)}`, class: 'payment-negative' };
    } else if (amount < 0) {
      return { text: `-$${(amount * -1).toFixed(2)}`, class: 'payment-positive' };
    }
    return { text: '$0.00', class: 'payment-neutral' };
  };

  if (loading) {
    return (
      <div className="dues-tracker">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dues data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dues-tracker">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Error Loading Dues Data</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!duesData) {
    return (
      <div className="dues-tracker">
        <div className="empty-state">
          <AlertTriangle size={48} />
          <h3>No Data Available</h3>
          <p>Member dues information is currently unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dues-tracker">
      {/* Header */}
      <div className="dues-header">
        <div>
          <h1>💰 Member Dues Management</h1>
          <p>Track member payments, overpayments, and outstanding dues</p>
        </div>
      </div>

      {/* Controls */}
      <div className="dues-controls">
        <div className="month-filters">
          {[1, 3, 6, 12].map(months => (
            <button
              key={months}
              className={`filter-btn ${selectedMonths === months ? 'active' : ''}`}
              onClick={() => setSelectedMonths(months)}
            >
              Last {months} Month{months > 1 ? 's' : ''}
            </button>
          ))}
        </div>
        <div className="export-controls">
          <button 
            className="btn-secondary"
            onClick={() => window.location.reload()}
            title="Refresh Data"
          >
            🔄 Refresh
          </button>
          <button className="btn-secondary">
            <Download size={16} />
            Export JSON
          </button>
          <button className="btn-secondary">
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="dues-overview">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div>
            <p className="stat-label">Total Members</p>
            <div className="stat-number">{duesData.summary.total_members}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="stat-label">Total Payments</p>
            <div className="stat-number">${duesData.summary.total_payments_collected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="stat-label">Members w/ Overpayments</p>
            <div className="stat-number">{duesData.summary.members_with_overpayments}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="stat-label">Members Owing Money</p>
            <div className="stat-number">{duesData.summary.members_owing_money}</div>
          </div>
        </div>
      </div>

      {/* Member Details Table */}
      <div className="member-table">
        <div className="table-header">
          <div className="header-grid">
            <div>Member Name</div>
            <div>Latest Status</div>
            <div>Amount Owed</div>
            <div>Total Payments</div>
            <div>Total Contribution</div>
          </div>
        </div>

        {Object.entries(duesData.summary.member_details).map(([memberName, memberData], index) => {
          const isExpanded = expandedMembers.has(memberName);
          const statusBadge = getStatusBadge(memberData.latest_status);
          const owedAmount = formatAmount(memberData.latest_owed);

          return (
            <div key={memberName} className="member-row">
              <div className="member-info">
                <div className="member-name">
                  {memberName}
                </div>
                <button 
                  className="details-toggle"
                  onClick={() => toggleMemberDetails(memberName)}
                >
                  {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                  {isExpanded ? 'Hide' : 'View'} Monthly Details
                </button>
              </div>
              
              <div className="member-data-grid">
                <div className="data-item">
                  <span className="mobile-label">Status:</span>
                  <span className={`status-badge ${statusBadge.class}`}>
                    {statusBadge.text}
                  </span>
                </div>
                
                <div className="data-item">
                  <span className="mobile-label">Amount Owed:</span>
                  <span className={`payment-amount ${owedAmount.class}`}>
                    {owedAmount.text}
                  </span>
                </div>
                
                <div className="data-item">
                  <span className="mobile-label">Total Payments:</span>
                  <span className="payment-amount payment-positive">
                    ${memberData.total_payments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="data-item">
                  <span className="mobile-label">Total Contribution:</span>
                  <span className="payment-amount">
                    ${memberData.latest_contribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Monthly Details (Collapsible) */}
              {isExpanded && (
                <div className="monthly-details">
                  <h4>Monthly Payment History</h4>
                  {Object.entries(memberData.monthly_data).map(([monthName, monthData]) => (
                    <div key={monthName} className="month-entry">
                      <span className="month-name">{monthName}</span>
                      <div className="month-amounts">
                        <span className="payment-amount">
                          Paid: {monthData.dues_paid_formatted || '$0.00'}
                        </span>
                        <span className={`payment-amount ${monthData.dues_owed_amount > 0 ? 'payment-negative' : monthData.dues_owed_amount < 0 ? 'payment-positive' : 'payment-neutral'}`}>
                          Owed: {monthData.dues_owed_formatted || '$0.00'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Processing Info */}
      <div className="processing-info">
        <p><strong>Data Source:</strong> Live member data from FFA Investments database ({duesData.summary.real_members} real members) with simulated dues data</p>
        <p><strong>Demo Data:</strong> {duesData.summary.total_members - duesData.summary.real_members > 0 ? `${duesData.summary.total_members - duesData.summary.real_members} demo members added for demonstration purposes` : 'Showing real members only'}</p>
        <p><strong>Processing Date:</strong> {new Date(duesData.processing_date).toLocaleString()}</p>
        <p><strong>Note:</strong> Amounts in parentheses () indicate positive balances (overpayments). 
           Negative values in "Amount Owed" indicate credit balances. This is simulated dues data - integrate with your actual Excel processing system for real dues tracking.</p>
      </div>
    </div>
  );
};

export default DuesTracker;