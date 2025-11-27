import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
      <div className="fullscreen-center">
        <div className="spinner-page" />
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="card">
        <div className="card-header">
          <div>
            <p className="text-lg font-semibold text-default">User Management</p>
            <p className="text-sm text-muted">Manage user roles and permissions</p>
          </div>
          <div className="app-pill">
            {users.length} total users
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="card text-center">
          <h3>No Users Found</h3>
          <p>No user profiles have been created yet.</p>
        </div>
      ) : (
        <div className="app-grid cols-2">
          {users.map((user) => (
            <div key={user.id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="app-user-avatar" style={{ width: '48px', height: '48px' }}>
                    {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-default">{user.display_name || 'Unnamed User'}</p>
                    <p className="text-sm text-muted">ID: {user.id}</p>
                    <small>Joined: {new Date(user.created_at).toLocaleDateString()}</small>
                  </div>
                </div>
                <span className="app-pill" style={getRoleBadgeStyle(user.role)}>
                  {user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1)}
                </span>
              </div>

              {currentUser?.id !== user.id && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'member' : 'admin')}
                    disabled={updating === user.id}
                    className={`${user.role === 'admin' ? 'bg-yellow-600 text-white px-4 py-2 rounded-full hover:bg-yellow-700' : 'bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700'}`}
                  >
                    {updating === user.id ? 'Updating…' : user.role === 'admin' ? 'Make Member' : 'Make Admin'}
                  </button>
                </div>
              )}
              {currentUser?.id === user.id && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-yellow)' }}>
                  Current User
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-default" style={{ marginBottom: '1rem' }}>Role Permissions</h3>
        <div className="app-grid cols-2">
          <div className="app-panel" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
            <h4 style={{ color: '#fecaca', marginBottom: '0.5rem' }}>Admin Role</h4>
            <ul style={{ paddingLeft: '1.1rem', color: 'var(--text-secondary)' }}>
              <li>Full access to admin pages</li>
              <li>Manage timeline, unit prices, and accounts</li>
              <li>View transactions, manage roles, access audit logs</li>
            </ul>
          </div>
          <div className="app-panel" style={{ borderColor: 'rgba(59,130,246,0.4)' }}>
            <h4 style={{ color: '#bfdbfe', marginBottom: '0.5rem' }}>Member Role</h4>
            <ul style={{ paddingLeft: '1.1rem', color: 'var(--text-secondary)' }}>
              <li>Access personal dashboard and accounts</li>
              <li>Use education resources and view announcements</li>
              <li>Cannot modify system-wide data or admin features</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
