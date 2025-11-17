import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, Eye, EyeOff, TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { readMemberDuesFromExcel } from '../../utils/memberDuesExcel';
import './AdminDues.css';

const DuesTracker = () => {
  const [duesData, setDuesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [expandedMembers, setExpandedMembers] = useState(new Set());

  // Load real member data from Excel file
  useEffect(() => {
    const loadDuesData = async () => {
      try {
        setLoading(true);
        
        // Load data from Excel file
        const result = await readMemberDuesFromExcel();
        
        if (!result.success) {
          throw new Error(result.error);
        }

        setDuesData(result);
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
          <div className="spinner-page"></div>
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
          <button className="btn btn-primary btn-pill" onClick={() => window.location.reload()}>
            Retry
          </button>
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
            className="btn btn-outline btn-pill"
            onClick={() => window.location.reload()}
            title="Refresh Data"
          >
            🔄 Refresh
          </button>
          <button className="btn btn-outline btn-pill">
            <Download size={16} />
            Export JSON
          </button>
          <button className="btn btn-outline btn-pill">
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
        <p><strong>Data Source:</strong> {duesData.data_source || 'Real member dues data from Excel file'}</p>
        <p><strong>Total Members:</strong> {duesData.summary.total_members} ({duesData.summary.real_members || duesData.summary.total_members} from actual records)</p>
        <p><strong>Processing Date:</strong> {new Date(duesData.processing_date).toLocaleString()}</p>
        <p><strong>Note:</strong> Amounts in parentheses () indicate positive balances (overpayments). 
           Negative values in "Amount Owed" indicate credit balances. Monthly payment history is simulated for demonstration.</p>
      </div>
    </div>
  );
};

export default DuesTracker;
