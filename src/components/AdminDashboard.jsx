import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

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
    <div className="app-page">
      <div className="app-card">
        <div className="app-card-header">
          <div>
            <p className="app-card-title">Admin Dashboard</p>
            <p className="app-card-subtitle">Club overview and quick actions</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="app-btn app-btn-primary app-btn-pill">+ Add Member</button>
            <button className="app-btn app-btn-outline app-btn-pill">+ Record Transaction</button>
          </div>
        </div>
      </div>

      <div className="app-grid cols-2">
        {[
          { label: 'Assets Under Management', value: formatCurrency(stats.totalAUM), icon: '💰', highlight: true },
          { label: 'Total Members', value: stats.totalMembers, icon: '👥' },
          { label: 'Active Accounts', value: stats.activeAccounts, icon: '📊' },
          { label: 'Unit Price', value: formatCurrency(stats.unitPrice), icon: '📈', badge: 'Current' }
        ].map((item) => (
          <div key={item.label} className={`app-card app-card-stat ${item.highlight ? 'blue' : ''}`}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.label}</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                {item.value}
                {item.badge && <span className="app-pill" style={{ marginLeft: '0.6rem' }}>{item.badge}</span>}
              </p>
            </div>
            <div className="app-pill">{item.icon}</div>
          </div>
        ))}
      </div>

      <div className="app-card">
        <div className="app-card-header">
          <div>
            <p className="app-card-title">Today's Tasks</p>
            <p className="app-card-subtitle">Unit price not finalized for current period</p>
          </div>
          <button className="app-btn app-btn-outline app-btn-pill">Finalize Now</button>
        </div>
      </div>

      <div className="app-grid cols-2">
        <div className="app-card">
          <div className="app-card-header">
            <p className="app-card-title">Recent Transactions</p>
          </div>
          <p>No recent transactions.</p>
        </div>
        <div className="app-card">
          <div className="app-card-header">
            <p className="app-card-title">Quick Actions</p>
          </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="app-btn app-btn-outline" style={{ flex: 1 }}>Manage Members</button>
            <button className="app-btn app-btn-outline" style={{ flex: 1 }}>Manage Accounts</button>
          </div>
        </div>
      </div>
    </div>
  );
}
