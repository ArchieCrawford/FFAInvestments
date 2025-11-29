import React, { useState, useEffect } from 'react';
import { getMemberTimelineByName, getMembers } from '../lib/ffaApi';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Page } from './Page';
import { RefreshCw, List } from 'lucide-react';

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
      const memberList = await getMembers();
      setMembers(memberList);
      if (memberList.length > 0 && !selectedMember) {
        setSelectedMember(memberList[0]);
        loadMemberTimeline(memberList[0].member_name);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberTimeline = async (memberName) => {
    try {
      const timeline = await getMemberTimelineByName(memberName);
      setMemberTimeline((timeline || []).sort((a, b) => new Date(a.report_date) - new Date(b.report_date)));
    } catch (error) {
      console.error('Error loading timeline:', error);
      setMemberTimeline([]);
    }
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    loadMemberTimeline(member.member_name);
  };

  const handleSendInvite = async () => {
    try {
      const inviteToken = generateInviteToken();
      const { error } = await supabase
        .from('members')
        .update({
          email: inviteData.email,
          role: inviteData.role,
          membership_status: 'invited',
          invite_token: inviteToken,
          invited_at: new Date().toISOString()
        })
        .eq('id', inviteData.memberId);

      if (error) throw error;

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
      const { error } = await supabase
        .from('members')
        .update({
          role: roleData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleData.memberId);
      
      if (error) throw error;
      
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
      case 'active': return <span className="badge bg-green-500/20 text-green-500">Active</span>;
      case 'invited': return <span className="badge bg-blue-500/20 text-blue-400">Invited</span>;
      case 'pending_invite': return <span className="badge bg-yellow-500/20 text-yellow-500">Pending Invite</span>;
      default: return <span className="badge">Unknown</span>;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="badge bg-red-500/20 text-red-400">Admin</span>;
      case 'member': return <span className="badge bg-primary/20 text-primary">Member</span>;
      default: return <span className="badge">Unknown</span>;
    }
  };

  const chartData = memberTimeline.map(entry => ({
    date: new Date(entry.report_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    value: entry.portfolio_value
  }));

  if (loading) {
    return (
      <Page title="Member Account Management">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted mt-4">Loading member accounts...</p>
          </div>
        </div>
      </Page>
    );
  }

  const actions = (
    <div className="flex gap-3">
      <button className="btn-primary-soft flex items-center gap-2" onClick={() => window.location.href = '/admin/users'}>
        <List className="w-4 h-4" />
        Member Directory
      </button>
      <button className="btn-primary flex items-center gap-2" onClick={() => window.location.reload()}>
        <RefreshCw className="w-4 h-4" />
        Refresh Data
      </button>
    </div>
  );

  return (
    <Page
      title="Member Account Management"
      subtitle="View and manage individual member accounts"
      actions={actions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member List */}
        <div>
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-border">
              <h5 className="text-lg font-semibold text-default">All Members ({members.length})</h5>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {members.map((member) => (
                <div 
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className="p-4 rounded-lg border border-border hover:bg-surface cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h6 className="font-semibold text-default mb-1">{member.name}</h6>
                      <p className="text-sm text-muted mb-2">{member.email || 'No email'}</p>
                      <div className="flex gap-2">
                        {getRoleBadge(member.role)}
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-bold text-default">{formatCurrency(member.currentBalance || 0)}</div>
                      <small className="text-muted">{member.totalUnits?.toFixed(2) || '0'} units</small>
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
              <div className="card p-6">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h4 className="text-2xl font-bold text-default mb-2">{selectedMember.name}</h4>
                    <p className="text-muted mb-3">
                      {selectedMember.email || 'No email provided'} • Member since {formatDate(selectedMember.joinDate)}
                    </p>
                    <div className="flex gap-2">
                      {getRoleBadge(selectedMember.role)}
                      {getStatusBadge(selectedMember.status)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-primary-soft text-sm"
                      onClick={() => {
                        setInviteData({ memberId: selectedMember.id, email: selectedMember.email || '', role: selectedMember.role });
                        setShowInviteModal(true);
                      }}
                    >
                      {selectedMember.status === 'pending_invite' ? 'Send Invite' : 'Resend Invite'}
                    </button>
                    <button
                      className="btn-primary-soft text-sm"
                      onClick={() => {
                        setRoleData({ memberId: selectedMember.id, role: selectedMember.role });
                        setShowRoleModal(true);
                      }}
                    >
                      Change Role
                    </button>
                  </div>
                </div>
              </div>

              {/* Member Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted mb-1">Current Balance</p>
                      <p className="text-3xl font-bold text-default">{formatCurrency(selectedMember.currentBalance || 0)}</p>
                    </div>
                  </div>
                </div>
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted mb-1">Total Units</p>
                      <p className="text-3xl font-bold text-default">{selectedMember.totalUnits?.toFixed(4) || '0.0000'}</p>
                    </div>
                  </div>
                </div>
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted mb-1">Data Points</p>
                      <p className="text-3xl font-bold text-default">{memberTimeline.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Chart */}
              <div className="card">
                <div className="p-6 border-b border-border"><h5 className="text-lg font-semibold text-default">Portfolio Performance</h5></div>
                <div className="p-6">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
                      <XAxis dataKey="date" stroke="rgb(var(--color-muted))" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} stroke="rgb(var(--color-muted))" />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Portfolio Value']} 
                        contentStyle={{ 
                          backgroundColor: 'rgb(var(--color-surface))', 
                          border: '1px solid rgb(var(--color-border))',
                          borderRadius: '8px',
                          color: 'rgb(var(--color-text))'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="rgb(var(--color-primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'rgb(var(--color-primary))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-8">
                    No timeline data available for this member
                  </div>
                )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card overflow-hidden">
                <div className="p-6 border-b border-border"><h5 className="text-lg font-semibold text-default">Recent Portfolio Activity</h5></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-surface">
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Portfolio Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Units</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Growth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {memberTimeline.slice(-10).reverse().map((entry, idx) => (
                        <tr key={idx} className="hover:bg-surface">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-default">{formatDate(entry.report_date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-default">{formatCurrency(entry.portfolio_value)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-default">{entry.total_units?.toFixed(4)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {entry.growth_pct !== null && entry.growth_pct !== undefined ? (
                              <span className={`badge ${entry.growth_pct >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {entry.growth_pct >= 0 ? '+' : ''}{(entry.growth_pct * 100).toFixed(2)}%
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
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4 text-primary">👥</div>
              <h5 className="text-xl font-bold text-default mb-2">Select a Member</h5>
              <p className="text-muted">Choose a member from the list to view their account details</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h5 className="text-xl font-semibold text-default">Send Account Invitation</h5>
              <button type="button" className="text-muted hover:text-default" onClick={() => setShowInviteModal(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-default mb-2">Email Address</label>
                <input
                  type="email"
                  className="input w-full"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  placeholder="Enter member's email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-default mb-2">Account Role</label>
                <select
                  className="input w-full"
                  value={inviteData.role}
                  onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                >
                  <option value="member">Member (View only access)</option>
                  <option value="admin">Admin (Full access)</option>
                </select>
                <p className="text-sm text-muted mt-2">
                  Members can only view their own accounts. Admins can manage all accounts.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" className="btn-primary-soft" onClick={() => setShowInviteModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSendInvite}
                disabled={!inviteData.email}
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h5 className="text-xl font-semibold text-default">Change Member Role</h5>
              <button type="button" className="text-muted hover:text-default" onClick={() => setShowRoleModal(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-default mb-2">Select New Role</label>
              <select
                className="input w-full"
                value={roleData.role}
                onChange={(e) => setRoleData({...roleData, role: e.target.value})}
              >
                <option value="member">Member (View only access)</option>
                <option value="admin">Admin (Full management access)</option>
              </select>
              <div className="text-sm text-muted mt-3">
                <p className="mb-1"><strong className="text-default">Member:</strong> Can only view their own account dashboard</p>
                <p><strong className="text-default">Admin:</strong> Can manage all accounts, invite users, and access admin features</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" className="btn-primary-soft" onClick={() => setShowRoleModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRoleChange}
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}