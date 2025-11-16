import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminMemberManagement() {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberTimeline, setMemberTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ memberId: null, email: '', role: 'member' });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleData, setRoleData] = useState({ memberId: null, role: 'member' });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const memberList = await base44.entities.User.list();
      setMembers(memberList);
      if (memberList.length > 0 && !selectedMember) {
        setSelectedMember(memberList[0]);
        loadMemberTimeline(memberList[0].id);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberTimeline = async (memberId) => {
    try {
      const timeline = await base44.entities.Account.getTimeline(memberId);
      setMemberTimeline(timeline.sort((a, b) => new Date(a.reportDate) - new Date(b.reportDate)));
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    loadMemberTimeline(member.id);
  };

  const handleSendInvite = async () => {
    try {
      const inviteToken = generateInviteToken();
      await base44.entities.User.update(inviteData.memberId, {
        email: inviteData.email,
        role: inviteData.role,
        status: 'invited',
        inviteToken: inviteToken,
        invitedAt: new Date().toISOString()
      });

      // Simulate sending email (in real app, this would call your email service)
      const inviteLink = `${window.location.origin}/invite/${inviteToken}`;
      console.log(`Invite sent to ${inviteData.email}:`, inviteLink);
      
      alert(`Invitation sent to ${inviteData.email}!\n\nInvite Link: ${inviteLink}`);
      
      setShowInviteModal(false);
      setInviteData({ memberId: null, email: '', role: 'member' });
      loadMembers();
    } catch (error) {
      alert('Failed to send invitation: ' + error.message);
    }
  };

  const handleRoleChange = async () => {
    try {
      await base44.entities.User.update(roleData.memberId, {
        role: roleData.role,
        updatedAt: new Date().toISOString()
      });
      
      alert('Role updated successfully!');
      setShowRoleModal(false);
      setRoleData({ memberId: null, role: 'member' });
      loadMembers();
    } catch (error) {
      alert('Failed to update role: ' + error.message);
    }
  };

  const generateInviteToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="badge bg-success">Active</span>;
      case 'invited': return <span className="badge bg-warning">Invited</span>;
      case 'pending_invite': return <span className="badge bg-secondary">Pending Invite</span>;
      default: return <span className="badge bg-light">Unknown</span>;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="badge bg-primary">Admin</span>;
      case 'member': return <span className="badge bg-info">Member</span>;
      default: return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  const chartData = memberTimeline.map(entry => ({
    date: new Date(entry.reportDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    value: entry.portfolioValue
  }));

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Member Account Management</h2>
        <div>
          <button className="btn btn-outline-primary me-2" onClick={() => window.location.href = '/admin/users'}>
            <i className="fas fa-list me-1"></i>
            Member Directory
          </button>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            <i className="fas fa-sync me-1"></i>
            Refresh Data
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Member List */}
        <div className="col-md-4">
          <div className="task-box">
            <h5 className="mb-3">
              <i className="fas fa-users me-2"></i>
              All Members ({members.length})
            </h5>
            <div className="list-group list-group-flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {members.map((member) => (
                <div 
                  key={member.id}
                  className={`list-group-item list-group-item-action cursor-pointer ${selectedMember?.id === member.id ? 'active' : ''}`}
                  onClick={() => handleMemberSelect(member)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{member.name}</h6>
                      <p className="mb-1 small">{member.email || 'No email'}</p>
                      <div className="d-flex gap-2">
                        {getRoleBadge(member.role)}
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">{formatCurrency(member.currentBalance || 0)}</div>
                      <small className="text-muted">{member.totalUnits?.toFixed(2) || '0'} units</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Member Details */}
        <div className="col-md-8">
          {selectedMember ? (
            <>
              {/* Member Header */}
              <div className="task-box mb-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h4>{selectedMember.name}</h4>
                    <p className="text-muted mb-2">
                      {selectedMember.email || 'No email provided'} • 
                      Member since {formatDate(selectedMember.joinDate)}
                    </p>
                    <div className="d-flex gap-2">
                      {getRoleBadge(selectedMember.role)}
                      {getStatusBadge(selectedMember.status)}
                    </div>
                  </div>
                  <div className="btn-group">
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        setInviteData({ memberId: selectedMember.id, email: selectedMember.email || '', role: selectedMember.role });
                        setShowInviteModal(true);
                      }}
                    >
                      <i className="fas fa-envelope me-1"></i>
                      {selectedMember.status === 'pending_invite' ? 'Send Invite' : 'Resend Invite'}
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setRoleData({ memberId: selectedMember.id, role: selectedMember.role });
                        setShowRoleModal(true);
                      }}
                    >
                      <i className="fas fa-user-cog me-1"></i>
                      Change Role
                    </button>
                  </div>
                </div>
              </div>

              {/* Member Stats */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="card-stat">
                    <div>
                      <div className="fw-bold">Current Balance</div>
                      <div className="fs-5">{formatCurrency(selectedMember.currentBalance || 0)}</div>
                    </div>
                    <i className="fas fa-wallet fa-2x text-primary"></i>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card-stat">
                    <div>
                      <div className="fw-bold">Total Units</div>
                      <div className="fs-5">{selectedMember.totalUnits?.toFixed(4) || '0.0000'}</div>
                    </div>
                    <i className="fas fa-coins fa-2x text-warning"></i>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card-stat">
                    <div>
                      <div className="fw-bold">Data Points</div>
                      <div className="fs-5">{memberTimeline.length}</div>
                    </div>
                    <i className="fas fa-chart-bar fa-2x text-info"></i>
                  </div>
                </div>
              </div>

              {/* Portfolio Chart */}
              <div className="task-box mb-4">
                <h5 className="mb-3">Portfolio Performance</h5>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Portfolio Value']} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#1e40af" 
                        strokeWidth={2}
                        dot={{ fill: '#1e40af', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-4">
                    No timeline data available for this member
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="task-box">
                <h5 className="mb-3">Recent Portfolio Activity</h5>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Portfolio Value</th>
                        <th>Units</th>
                        <th>Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberTimeline.slice(-10).reverse().map((entry) => (
                        <tr key={entry.id}>
                          <td>{formatDate(entry.reportDate)}</td>
                          <td>{formatCurrency(entry.portfolioValue)}</td>
                          <td>{entry.totalUnits?.toFixed(4)}</td>
                          <td>
                            {entry.portfolioGrowth ? (
                              <span className={`badge ${entry.portfolioGrowth >= 0 ? 'bg-success' : 'bg-danger'}`}>
                                {entry.portfolioGrowth >= 0 ? '+' : ''}{(entry.portfolioGrowth * 100).toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="task-box text-center">
              <i className="fas fa-user-friends fa-3x text-muted mb-3"></i>
              <h5>Select a Member</h5>
              <p className="text-muted">Choose a member from the list to view their account details</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Send Account Invitation</h5>
                <button type="button" className="btn-close" onClick={() => setShowInviteModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                    placeholder="Enter member's email address"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Account Role</label>
                  <select
                    className="form-select"
                    value={inviteData.role}
                    onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                  >
                    <option value="member">Member (View only access)</option>
                    <option value="admin">Admin (Full access)</option>
                  </select>
                  <div className="form-text">
                    Members can only view their own accounts. Admins can manage all accounts.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSendInvite}
                  disabled={!inviteData.email}
                >
                  <i className="fas fa-paper-plane me-1"></i>
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Member Role</h5>
                <button type="button" className="btn-close" onClick={() => setShowRoleModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Select New Role</label>
                  <select
                    className="form-select"
                    value={roleData.role}
                    onChange={(e) => setRoleData({...roleData, role: e.target.value})}
                  >
                    <option value="member">Member (View only access)</option>
                    <option value="admin">Admin (Full management access)</option>
                  </select>
                  <div className="form-text">
                    <strong>Member:</strong> Can only view their own account dashboard<br/>
                    <strong>Admin:</strong> Can manage all accounts, invite users, and access admin features
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning" 
                  onClick={handleRoleChange}
                >
                  <i className="fas fa-user-cog me-1"></i>
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}