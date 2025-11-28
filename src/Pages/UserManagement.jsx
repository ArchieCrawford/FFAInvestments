import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Page } from '../components/Page';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all user profiles (only admins can see this due to RLS policies)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      setUpdating(userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ));

      console.log(`✅ Updated user role to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeStyle = (role) => {
    return role === 'admin'
      ? { background: 'rgba(239,68,68,0.2)', color: '#fecaca' }
      : { background: 'rgba(59,130,246,0.2)', color: '#bfdbfe' };
  };

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
      subtitle="Manage user roles and permissions"
    >
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-default">{users.length}</p>
              <p className="text-sm text-muted">Total users</p>
            </div>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="card p-12 text-center">
            <h3 className="text-xl font-bold text-default mb-2">No Users Found</h3>
            <p className="text-muted">No user profiles have been created yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((user) => (
              <div key={user.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                      {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-default">{user.display_name || 'Unnamed User'}</p>
                      <p className="text-sm text-muted">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`badge ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
                    {user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1)}
                  </span>
                </div>

                {currentUser?.id !== user.id ? (
                  <div className="flex justify-end">
                    <button
                      onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'member' : 'admin')}
                      disabled={updating === user.id}
                      className={`${user.role === 'admin' ? 'bg-yellow-600' : 'bg-green-600'} text-white px-4 py-2 rounded-lg hover:opacity-80 disabled:opacity-50`}
                    >
                      {updating === user.id ? 'Updating…' : user.role === 'admin' ? 'Make Member' : 'Make Admin'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-primary">
                    Current User
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="card p-6">
          <h3 className="text-xl font-semibold text-default mb-6">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-4 border-l-4 border-red-500">
              <h4 className="text-lg font-semibold text-red-400 mb-3">Admin Role</h4>
              <ul className="list-disc list-inside text-muted space-y-1">
                <li>Full access to admin pages</li>
                <li>Manage timeline, unit prices, and accounts</li>
                <li>View transactions, manage roles, access audit logs</li>
              </ul>
            </div>
            <div className="card p-4 border-l-4 border-primary">
              <h4 className="text-lg font-semibold text-primary mb-3">Member Role</h4>
              <ul className="list-disc list-inside text-muted space-y-1">
                <li>Access personal dashboard and accounts</li>
                <li>Use education resources and view announcements</li>
                <li>Cannot modify system-wide data or admin features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default UserManagement;
