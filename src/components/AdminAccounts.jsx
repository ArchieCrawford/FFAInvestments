import React from 'react';
import { Page } from './Page';
import { Plus } from 'lucide-react';

export default function AdminAccounts() {
  const stats = [
    { label: 'Total Accounts', value: '0', icon: '🏦' },
    { label: 'Active Accounts', value: '0', icon: '✅' },
    { label: 'Total Balance', value: '$0.00', icon: '💰' }
  ];

  return (
    <Page
      title="Accounts"
      subtitle="Track account totals and balances"
      actions={
        <button className="btn-primary rounded-full px-4 py-2 flex items-center gap-2">
          <Plus size={16} />
          Add Account
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-default">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="card p-6">
          <p className="text-muted text-center">
            No accounts created yet. Click "Add Account" to get started.
          </p>
        </div>
      </div>
    </Page>
  );
}
