import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Page } from '../components/Page'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalAUM: 0,
    activeAccounts: 0,
    unitPrice: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const members = await base44.entities.User.list();
      const timeline = await base44.entities.Timeline.getAll();
      
      const totalAUM = members.reduce((sum, member) => sum + (member.currentBalance || 0), 0);
      const activeAccounts = members.filter(m => m.status === 'active').length;
      
      setStats({
        totalMembers: members.length,
        totalAUM,
        activeAccounts,
        unitPrice: timeline.length > 0
          ? (totalAUM / members.reduce((sum, m) => sum + (m.totalUnits || 0), 0))
          : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <Page 
      title="Admin Dashboard"
      subtitle="Club overview and quick actions"
      actions={
        <>
          <button className="btn-primary rounded-full px-4 py-2">+ Add Member</button>
          <button className="btn-primary-soft border border-border rounded-full px-4 py-2">+ Record Transaction</button>
        </>
      }
    >
      <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Assets Under Management', value: formatCurrency(stats.totalAUM), icon: '💰', highlight: true },
          { label: 'Total Members', value: stats.totalMembers, icon: '👥' },
          { label: 'Active Accounts', value: stats.activeAccounts, icon: '📊' },
          { label: 'Unit Price', value: formatCurrency(stats.unitPrice), icon: '📈', badge: 'Current' }
        ].map((item) => (
          <div key={item.label} className={`card p-6 ${item.highlight ? 'bg-primary-soft' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{item.label}</p>
                <p className="text-3xl font-bold text-default mt-2">
                  {item.value}
                  {item.badge && <span className="badge ml-2">{item.badge}</span>}
                </p>
              </div>
              <div className="text-3xl">{item.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="p-6 flex items-center justify-between border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-default">Today's Tasks</h2>
            <p className="text-muted mt-1">Unit price not finalized for current period</p>
          </div>
          <button className="btn-primary-soft border border-border rounded-full px-4 py-2">Finalize Now</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-default">Recent Transactions</h2>
          </div>
          <div className="p-6">
            <p className="text-muted">No recent transactions.</p>
          </div>
        </div>
        <div className="card">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-default">Quick Actions</h2>
          </div>
          <div className="p-6 flex gap-3">
            <button className="btn-primary-soft border border-border flex-1">Manage Members</button>
            <button className="btn-primary-soft border border-border flex-1">Manage Accounts</button>
          </div>
        </div>
      </div>
      </div>
    </Page>
  );
}
