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

  const getRoleBadgeColor = (role) => {
    return role === 'admin' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                <p className="text-slate-600 mt-1">Manage user roles and permissions</p>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <span className="text-blue-800 font-medium">{users.length} Total Users</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Users Found</h3>
                <p className="text-slate-600">No user profiles have been created yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {user.display_name || 'Unnamed User'}
                          </h3>
                          <p className="text-slate-600 text-sm">ID: {user.id}</p>
                          <p className="text-slate-500 text-xs">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1)}
                        </span>

                        {currentUser?.id !== user.id && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'member' : 'admin')}
                              disabled={updating === user.id}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                user.role === 'admin'
                                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                              } ${updating === user.id ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
                            >
                              {updating === user.id ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                  <span>Updating...</span>
                                </div>
                              ) : (
                                user.role === 'admin' ? 'Make Member' : 'Make Admin'
                              )}
                            </button>
                          </div>
                        )}
                        
                        {currentUser?.id === user.id && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-medium">
                            Current User
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Role Information */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Role Permissions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Admin Role</h3>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• Full access to all admin pages</li>
                <li>• Can manage FFA timeline data</li>
                <li>• Can manage unit prices</li>
                <li>• Can manage member accounts</li>
                <li>• Can view all transactions</li>
                <li>• Can manage user roles</li>
                <li>• Can access audit logs</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Member Role</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Access to member dashboard</li>
                <li>• Can view their own account data</li>
                <li>• Can view their own transactions</li>
                <li>• Can access education materials</li>
                <li>• Can track learning progress</li>
                <li>• Cannot modify system data</li>
                <li>• Cannot access admin features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;