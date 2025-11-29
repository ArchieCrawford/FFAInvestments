import React, { useMemo, useState } from 'react'
import { useCompleteMemberProfiles } from '../lib/queries'
import { Users, DollarSign, Target } from 'lucide-react'
import { Page } from '../components/Page'

const AdminMembers = () => {
  const { data: profiles, isLoading, error } = useCompleteMemberProfiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    
    return profiles.filter(profile => {
      const matchesSearch = !searchTerm || 
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && profile.membership_status === 'active') ||
        (statusFilter === 'inactive' && profile.membership_status !== 'active');
      
      return matchesSearch && matchesStatus;
    });
  }, [profiles, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (!profiles) return { total: 0, active: 0, totalValue: 0, totalUnits: 0 };
    
    return {
      total: profiles.length,
      active: profiles.filter(p => p.membership_status === 'active').length,
      totalValue: profiles.reduce((sum, p) => sum + (p.current_value || 0), 0),
      totalUnits: profiles.reduce((sum, p) => sum + (p.current_units || 0), 0),
    };
  }, [profiles]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <Page title="Members" subtitle="Manage club members">
        <div className="text-center py-12 text-muted">Loading members...</div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Members" subtitle="Manage club members">
        <div className="card p-6 bg-red-50 border-red-200">
          <div className="text-red-800">Error loading members: {error.message}</div>
        </div>
      </Page>
    );
  }

  return (
    <Page 
      title="Members" 
      subtitle="Manage club members"
      actions={
        <button className="btn-primary rounded-full px-4 py-2">+ Add Member</button>
      }
    >
      <div className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-soft rounded-lg">
                <Users size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted">Total Members</p>
                <p className="text-2xl font-bold text-default">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Target size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted">Active Members</p>
                <p className="text-2xl font-bold text-default">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted">Total Value</p>
                <p className="text-2xl font-bold text-default">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Target size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted">Total Units</p>
                <p className="text-2xl font-bold text-default">{stats.totalUnits.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-right">Units</th>
                  <th className="p-4 text-right">Value</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted">
                      No members found
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-medium text-default">{profile.full_name || profile.member_name || 'N/A'}</td>
                      <td className="p-4 text-muted">{profile.email || 'N/A'}</td>
                      <td className="p-4 text-right font-mono">
                        {(profile.current_units || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(profile.current_value)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          profile.membership_status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {profile.membership_status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default AdminMembers;
