import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Mail, Phone, Calendar, DollarSign, Edit2, Save, X, Plus, Search } from 'lucide-react';

const AdminMembers = () => {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // New member form state
  const [newMember, setNewMember] = useState({
    email: '',
    full_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    membership_status: 'active',
    dues_status: 'pending',
    notes: ''
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchMembers();
    }
  }, [profile]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('complete_member_profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMessage({ type: 'error', text: 'Failed to load members' });
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async (memberId, updates) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) throw error;
      
      await fetchMembers();
      setEditingMember(null);
      setMessage({ type: 'success', text: 'Member updated successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating member:', error);
      setMessage({ type: 'error', text: 'Failed to update member' });
    }
  };

  const addMember = async () => {
    try {
      const { error } = await supabase
        .from('members')
        .insert([newMember]);

      if (error) throw error;

      await fetchMembers();
      setShowAddForm(false);
      setNewMember({
        email: '',
        full_name: '',
        first_name: '',
        last_name: '',
        phone: '',
        membership_status: 'active',
        dues_status: 'pending',
        notes: ''
      });
      setMessage({ type: 'success', text: 'Member added successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error adding member:', error);
      setMessage({ type: 'error', text: 'Failed to add member' });
    }
  };

  const deleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await fetchMembers();
      setMessage({ type: 'success', text: 'Member deleted successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting member:', error);
      setMessage({ type: 'error', text: 'Failed to delete member' });
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      member.membership_status === filterStatus ||
      (filterStatus === 'registered' && member.account_status === 'registered') ||
      (filterStatus === 'not_registered' && member.account_status === 'not_registered');

    return matchesSearch && matchesFilter;
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
        <div className="text-white text-xl">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <Users className="mr-4" />
            Member Management
          </h1>
          <p className="text-blue-200">Manage club members and their account status</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            {message.text}
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Members</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="registered">Has Account</option>
            <option value="not_registered">No Account</option>
          </select>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </button>
        </div>

        {/* Add Member Form */}
        {showAddForm && (
          <div className="mb-6 p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Add New Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email *"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={newMember.full_name}
                onChange={(e) => setNewMember({...newMember, full_name: e.target.value})}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                placeholder="First Name"
                value={newMember.first_name}
                onChange={(e) => setNewMember({...newMember, first_name: e.target.value})}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newMember.last_name}
                onChange={(e) => setNewMember({...newMember, last_name: e.target.value})}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newMember.phone}
                onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={newMember.membership_status}
                onChange={(e) => setNewMember({...newMember, membership_status: e.target.value})}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="mt-4">
              <textarea
                placeholder="Notes"
                value={newMember.notes}
                onChange={(e) => setNewMember({...newMember, notes: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={addMember}
                disabled={!newMember.email}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Add Member
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Members Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total Members</p>
                <p className="text-2xl font-bold text-white">{members.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Active Members</p>
                <p className="text-2xl font-bold text-white">
                  {members.filter(m => m.membership_status === 'active').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Registered Users</p>
                <p className="text-2xl font-bold text-white">
                  {members.filter(m => m.account_status === 'registered').length}
                </p>
              </div>
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm">Current Dues</p>
                <p className="text-2xl font-bold text-white">
                  {members.filter(m => m.dues_status === 'current').length}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Dues</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredMembers.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isEditing={editingMember === member.id}
                    onEdit={(id) => setEditingMember(id)}
                    onSave={(id, updates) => updateMember(id, updates)}
                    onCancel={() => setEditingMember(null)}
                    onDelete={deleteMember}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No members found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

// Member Row Component
const MemberRow = ({ member, isEditing, onEdit, onSave, onCancel, onDelete }) => {
  const [editData, setEditData] = useState({
    full_name: member.full_name || '',
    first_name: member.first_name || '',
    last_name: member.last_name || '',
    phone: member.phone || '',
    membership_status: member.membership_status,
    dues_status: member.dues_status,
    notes: member.notes || ''
  });

  const handleSave = () => {
    onSave(member.id, editData);
  };

  if (isEditing) {
    return (
      <tr className="bg-white/5">
        <td className="px-6 py-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Full Name"
              value={editData.full_name}
              onChange={(e) => setEditData({...editData, full_name: e.target.value})}
              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
            />
            <div className="grid grid-cols-2 gap-1">
              <input
                type="text"
                placeholder="First"
                value={editData.first_name}
                onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
              />
              <input
                type="text"
                placeholder="Last"
                value={editData.last_name}
                onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
              />
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-blue-300 text-sm">{member.email}</div>
          <input
            type="tel"
            placeholder="Phone"
            value={editData.phone}
            onChange={(e) => setEditData({...editData, phone: e.target.value})}
            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs mt-1"
          />
        </td>
        <td className="px-6 py-4">
          <select
            value={editData.membership_status}
            onChange={(e) => setEditData({...editData, membership_status: e.target.value})}
            className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </td>
        <td className="px-6 py-4">
          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            member.account_status === 'registered' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-600 text-gray-200'
          }`}>
            {member.account_status === 'registered' ? 'Registered' : 'No Account'}
          </div>
        </td>
        <td className="px-6 py-4">
          <select
            value={editData.dues_status}
            onChange={(e) => setEditData({...editData, dues_status: e.target.value})}
            className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
          >
            <option value="current">Current</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
          </select>
        </td>
        <td className="px-6 py-4">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-1 text-green-400 hover:text-green-300 transition-colors"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-6 py-4">
        <div>
          <div className="text-white font-medium">{member.full_name || 'No name'}</div>
          {member.first_name && member.last_name && (
            <div className="text-gray-400 text-sm">{member.first_name} {member.last_name}</div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-blue-300">{member.email}</div>
        {member.phone && (
          <div className="text-gray-400 text-sm">{member.phone}</div>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          member.membership_status === 'active' 
            ? 'bg-green-600 text-white'
            : member.membership_status === 'inactive'
            ? 'bg-red-600 text-white' 
            : 'bg-yellow-600 text-black'
        }`}>
          {member.membership_status}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          member.account_status === 'registered' 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-600 text-gray-200'
        }`}>
          {member.account_status === 'registered' ? 'Registered' : 'No Account'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          member.dues_status === 'current' 
            ? 'bg-green-600 text-white'
            : member.dues_status === 'overdue'
            ? 'bg-red-600 text-white' 
            : 'bg-yellow-600 text-black'
        }`}>
          {member.dues_status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(member.id)}
            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AdminMembers;