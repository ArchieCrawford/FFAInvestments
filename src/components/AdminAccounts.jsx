import React from 'react';

export default function AdminAccounts() {
  const stats = [
    { label: 'Total Accounts', value: '0', accent: 'var(--accent-purple)', icon: '🏦' },
    { label: 'Active Accounts', value: '0', accent: 'var(--accent-green)', icon: '✅' },
    { label: 'Total Balance', value: '$0.00', accent: 'var(--accent-pink)', icon: '💰' }
  ];

  return (
    <div className="app-page">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="app-heading-lg">Accounts</h2>
        <button className="app-btn app-btn-primary app-btn-pill">+ Add Account</button>
      </div>
      
      <div className="app-card">
        <div className="app-card-header">
          <div>
            <p className="app-card-title">Account Management</p>
            <p className="app-card-subtitle">Track account totals and balances</p>
          </div>
        </div>
        <div className="app-card-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="app-grid cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="app-card app-card-stat">
                <div>
                  <p className="app-text-muted">{stat.label}</p>
                  <p className="app-heading-lg" style={{ color: stat.accent }}>{stat.value}</p>
                </div>
                <span className="app-pill">{stat.icon}</span>
              </div>
            ))}
          </div>
          
          <p className="app-text-muted">
            No accounts created yet. Click "Add Account" to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
