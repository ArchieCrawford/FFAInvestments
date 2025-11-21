import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getMembers } from '../lib/ffaApi'
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Mail, UserPlus, Edit2, Trash2, Shield, 
  Search, Filter, Download, Upload, AlertCircle
} from 'lucide-react';

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
        email: m.email,
        full_name: m.member_name,
        user_role: m.role || 'member',
        account_status: 'member'
      }))
      setMembers(mapped)
    } catch (error) {
      console.error('Error fetching members:', error);
      setMessage({ type: 'error', text: 'Failed to load members' });
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (memberEmail, memberName) => {
    try {
      // Here you would implement your invite logic
      // For now, we'll just copy the signup URL with the email
      const signupUrl = `${window.location.origin}/signup?email=${encodeURIComponent(memberEmail)}`;
      
      await navigator.clipboard.writeText(signupUrl);
      setMessage({ type: 'success', text: `Invite link for ${memberName} copied to clipboard!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error sending invite:', error);
      setMessage({ type: 'error', text: 'Failed to copy invite link' });
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <Shield className="mr-4 text-blue-400" />
            User Management
          </h1>
          <p className="text-blue-200">Manage user accounts, roles, and access permissions</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {message.text}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="member">Members</option>
            <option value="registered">Registered</option>
            <option value="not_registered">Not Registered</option>
          </select>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{members.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Registered</p>
                <p className="text-2xl font-bold text-white">
                  {members.filter(m => m.account_status === 'registered').length}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Admins</p>
                <p className="text-2xl font-bold text-white">
                  {members.filter(m => m.user_role === 'admin').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm">Total AUM</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(members.reduce((sum, m) => sum + (m.calculated_current_value || 0), 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Portfolio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredMembers.map((member) => (
                  <tr key={member.member_id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {member.full_name ? member.full_name.charAt(0).toUpperCase() : member.email?.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {member.full_name || 'No name provided'}
                          </div>
                          <div className="text-sm text-blue-200">
                            {member.first_name} {member.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.user_id ? (
                        <select
                          value={member.user_role || 'member'}
                          onChange={(e) => updateMemberRole(member.user_id, e.target.value)}
                          className="text-sm bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-gray-300 text-sm">Not registered</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.account_status === 'registered' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {member.account_status === 'registered' ? 'Registered' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {member.calculated_current_value ? (
                        <div>
                          <div>{formatCurrency(member.calculated_current_value)}</div>
                          <div className="text-xs text-blue-200">
                            {member.current_units?.toFixed(2)} units
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No portfolio</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {member.account_status !== 'registered' && (
                          <button
                            onClick={() => sendInvite(member.email, member.full_name)}
                            className="text-blue-400 hover:text-blue-300 flex items-center"
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Invite
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No users found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersNew;