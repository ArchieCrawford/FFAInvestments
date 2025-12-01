import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getMembers } from '../lib/ffaApi'
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Mail, UserPlus, Shield, 
  Search, AlertCircle
} from 'lucide-react';
import { Page } from './Page';

const AdminUsersNew = () => {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchMembers();
    }
  }, [profile]);

  const fetchMembers = async () => {
    try {
      const data = await getMembers()
      const mapped = (data || []).map(m => ({
        id: m.id,
        member_id: m.id,
        email: m.email,
        full_name: m.full_name || m.member_name,
        user_role: 'member',
        account_status: (m.membership_status || 'pending') === 'active' ? 'registered' : 'not_registered',
      }))
      setMembers(mapped)
    } catch (error) {
      console.error('Error fetching members:', error);
      setMessage({ type: 'error', text: 'Failed to load members' });
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (memberId, memberEmail, memberName) => {
    try {
      setMessage({ type: '', text: '' })
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData?.session?.access_token) {
          throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ member_id: memberId }),
        }
      )

      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.status === 'error') {
        const errText = payload?.error || payload?.error_message || (await response.text())
        throw new Error(errText || 'Failed to send invite')
      }

      setMessage({ type: 'success', text: `Invite sent to ${memberName || memberEmail || 'member'}` })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error sending invite:', error);
      setMessage({ type: 'error', text: 'Failed to send invite' });
    }
  };

  const updateMemberRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      await fetchMembers();
      setMessage({ type: 'success', text: 'Role updated successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage({ type: 'error', text: 'Failed to update role' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      filterRole === 'all' ||
      member.user_role === filterRole ||
      (filterRole === 'registered' && member.account_status === 'registered') ||
      (filterRole === 'not_registered' && member.account_status === 'not_registered');

    return matchesSearch && matchesRole;
  });

  if (profile?.role !== 'admin') {
    return (
      <Page title="User Management">
        <div className="card p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-default mb-2">Access Denied</h2>
          <p className="text-muted">You need admin privileges to view this page.</p>
        </div>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page title="User Management">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted mt-4">Loading users...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="User Management"
      subtitle="Manage user accounts, roles, and access permissions"
    >
      <div className="space-y-6">

        {/* Message Display */}
        {message.text && (
          <div className={`card p-4 border-l-4 flex items-center gap-3 ${
            message.type === 'success' ? 'border-green-500 bg-green-500/10' : 'border-red-500'
          }`}>
            <AlertCircle className={`w-4 h-4 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`} />
            <span className={message.type === 'success' ? 'text-green-600' : 'text-red-400'}>{message.text}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input"
          >
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="member">Members</option>
            <option value="registered">Registered</option>
            <option value="not_registered">Not Registered</option>
          </select>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Total Users</p>
                <p className="text-3xl font-bold text-default">{members.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Registered</p>
                <p className="text-3xl font-bold text-default">
                  {members.filter(m => m.account_status === 'registered').length}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Admins</p>
                <p className="text-3xl font-bold text-default">
                  {members.filter(m => m.user_role === 'admin').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Total AUM</p>
                <p className="text-3xl font-bold text-default">
                  {formatCurrency(members.reduce((sum, m) => sum + (m.calculated_current_value || 0), 0))}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Portfolio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-surface">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                            {member.full_name ? member.full_name.charAt(0).toUpperCase() : member.email?.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-default">
                            {member.full_name || 'No name provided'}
                          </div>
                          <div className="text-sm text-muted">
                            {member.first_name} {member.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-default">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.user_id ? (
                        <select
                          value={member.user_role || 'member'}
                          onChange={(e) => updateMemberRole(member.user_id, e.target.value)}
                          className="input text-sm"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-muted text-sm">Not registered</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        member.account_status === 'registered' 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {member.account_status === 'registered' ? 'Registered' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-default">
                      {member.calculated_current_value ? (
                        <div>
                          <div>{formatCurrency(member.calculated_current_value)}</div>
                          <div className="text-xs text-muted">
                            {member.current_units?.toFixed(2)} units
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted">No portfolio</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => sendInvite(member.id, member.email, member.full_name)}
                          className="text-primary hover:text-primary/80 flex items-center"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Send Invite
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredMembers.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-muted">No users found matching your criteria.</p>
          </div>
        )}
      </div>
    </Page>
  );
};

export default AdminUsersNew;
