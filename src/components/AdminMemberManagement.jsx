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
      case 'active': return <span className="app-pill">Active</span>;
      case 'invited': return <span className="app-pill">Invited</span>;
      case 'pending_invite': return <span className="app-pill">Pending Invite</span>;
      default: return <span className="app-pill">Unknown</span>;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="app-pill">Admin</span>;
      case 'member': return <span className="app-pill">Member</span>;
      default: return <span className="app-pill">Unknown</span>;
    }
  };

  const chartData = memberTimeline.map(entry => ({
    date: new Date(entry.reportDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    value: entry.portfolioValue
  }));

  if (loading) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-page" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Member Account Management</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="app-btn app-btn-outline" onClick={() => window.location.href = '/admin/users'}>
            <i className="fas fa-list" style={{ marginRight: '0.5rem' }}></i>
            Member Directory
          </button>
          <button className="app-btn app-btn-primary" onClick={() => window.location.reload()}>
            <i className="fas fa-sync" style={{ marginRight: '0.5rem' }}></i>
            Refresh Data
          </button>
        </div>
      </div>

      <div className="app-grid cols-2" style={{ gap: '1rem' }}>
        {/* Member List */}
        <div>
          <div className="app-card">
            <div className="app-card-header">
              <h5 className="app-card-title"><i className="fas fa-users me-2"></i>All Members ({members.length})</h5>
            </div>
            <div className="app-card-content" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {members.map((member) => (
                <div 
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  style={{ cursor: 'pointer', marginBottom: '0.5rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h6 style={{ margin: 0 }}>{member.name}</h6>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>{member.email || 'No email'}</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {getRoleBadge(member.role)}
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '0.75rem' }}>
                      <div style={{ fontWeight: 700 }}>{formatCurrency(member.currentBalance || 0)}</div>
                      <small className="app-text-muted">{member.totalUnits?.toFixed(2) || '0'} units</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Member Details */}
        <div>
          {selectedMember ? (
            <>
              {/* Member Header */}
              <div className="app-card mb-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4>{selectedMember.name}</h4>
                    <p className="app-text-muted" style={{ marginBottom: '0.5rem' }}>
                      {selectedMember.email || 'No email provided'} • Member since {formatDate(selectedMember.joinDate)}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {getRoleBadge(selectedMember.role)}
                      {getStatusBadge(selectedMember.status)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="app-btn app-btn-outline app-btn-sm"
                      onClick={() => {
                        setInviteData({ memberId: selectedMember.id, email: selectedMember.email || '', role: selectedMember.role });
                        setShowInviteModal(true);
                      }}
                    >
                      <i className="fas fa-envelope" style={{ marginRight: '0.5rem' }}></i>
                      {selectedMember.status === 'pending_invite' ? 'Send Invite' : 'Resend Invite'}
                    </button>
                    <button
                      className="app-btn app-btn-outline app-btn-sm"
                      onClick={() => {
                        setRoleData({ memberId: selectedMember.id, role: selectedMember.role });
                        setShowRoleModal(true);
                      }}
                    >
                      <i className="fas fa-user-cog" style={{ marginRight: '0.5rem' }}></i>
                      Change Role
                    </button>
                  </div>
                </div>
              </div>

              {/* Member Stats */}
              <div className="app-grid cols-3" style={{ marginBottom: '1rem' }}>
                <div className="app-card app-card-stat">
                  <div>
                    <div className="app-heading-md">Current Balance</div>
                    <div className="app-heading-lg">{formatCurrency(selectedMember.currentBalance || 0)}</div>
                  </div>
                  <i className="fas fa-wallet fa-2x" />
                </div>
                <div className="app-card app-card-stat">
                  <div>
                    <div className="app-heading-md">Total Units</div>
                    <div className="app-heading-lg">{selectedMember.totalUnits?.toFixed(4) || '0.0000'}</div>
                  </div>
                  <i className="fas fa-coins fa-2x" />
                </div>
                <div className="app-card app-card-stat">
                  <div>
                    <div className="app-heading-md">Data Points</div>
                    <div className="app-heading-lg">{memberTimeline.length}</div>
                  </div>
                  <i className="fas fa-chart-bar fa-2x" />
                </div>
              </div>

              {/* Portfolio Chart */}
              <div className="app-card mb-4">
                <div className="app-card-header"><h5 className="app-card-title">Portfolio Performance</h5></div>
                <div className="app-card-content">
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
                  <div className="text-center app-text-muted py-4">
                    No timeline data available for this member
                  </div>
                )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="app-card">
                <div className="app-card-header"><h5 className="app-card-title">Recent Portfolio Activity</h5></div>
                <div className="app-card-content">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="app-table">
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
                              <span className={`app-pill`}>
                                {entry.portfolioGrowth >= 0 ? '+' : ''}{(entry.portfolioGrowth * 100).toFixed(2)}%
                              </span>
                            ) : (
                              <span className="app-text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="app-card text-center">
              <div className="app-card-content">
                <i className="fas fa-user-friends fa-3x mb-3"></i>
                <h5>Select a Member</h5>
                <p className="app-text-muted">Choose a member from the list to view their account details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-backdrop">
          <div className="modal-panel" role="dialog" aria-modal="true">
            <div className="app-card">
              <div className="app-card-header">
                <h5 className="app-card-title">Send Account Invitation</h5>
                <button type="button" className="modal-close" onClick={() => setShowInviteModal(false)} aria-label="Close" />
              </div>
              <div className="app-card-content">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="app-text-muted">Email Address</label>
                  <input
                    type="email"
                    className="app-form-control"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                    placeholder="Enter member's email address"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="app-text-muted">Account Role</label>
                  <select
                    className="app-form-control"
                    value={inviteData.role}
                    onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                  >
                    <option value="member">Member (View only access)</option>
                    <option value="admin">Admin (Full access)</option>
                  </select>
                  <div className="app-text-muted" style={{ marginTop: '0.5rem' }}>
                    Members can only view their own accounts. Admins can manage all accounts.
                  </div>
                </div>
              </div>
              <div className="app-card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="app-btn app-btn-outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="app-btn app-btn-primary"
                  onClick={handleSendInvite}
                  disabled={!inviteData.email}
                >
                  <i className="fas fa-paper-plane" style={{ marginRight: '0.5rem' }}></i>
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="modal-backdrop">
          <div className="modal-panel" role="dialog" aria-modal="true">
            <div className="app-card">
              <div className="app-card-header">
                <h5 className="app-card-title">Change Member Role</h5>
                <button type="button" className="modal-close" onClick={() => setShowRoleModal(false)} aria-label="Close" />
              </div>
              <div className="app-card-content">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="app-text-muted">Select New Role</label>
                  <select
                    className="app-form-control"
                    value={roleData.role}
                    onChange={(e) => setRoleData({...roleData, role: e.target.value})}
                  >
                    <option value="member">Member (View only access)</option>
                    <option value="admin">Admin (Full management access)</option>
                  </select>
                  <div className="app-text-muted" style={{ marginTop: '0.5rem' }}>
                    <strong>Member:</strong> Can only view their own account dashboard<br/>
                    <strong>Admin:</strong> Can manage all accounts, invite users, and access admin features
                  </div>
                </div>
              </div>
              <div className="app-card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="app-btn app-btn-outline" onClick={() => setShowRoleModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="app-btn app-btn-warning"
                  onClick={handleRoleChange}
                >
                  <i className="fas fa-user-cog" style={{ marginRight: '0.5rem' }}></i>
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