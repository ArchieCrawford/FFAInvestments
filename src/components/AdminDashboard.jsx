import React, { useState, useEffect } from 'react';
import { Page } from '../components/Page'
import { createClient } from '@supabase/supabase-js';

// Minimal Supabase client initializer. Assumes env vars are set via Vite.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
      // Prefer a canonical RPC if available
      const rpc = await supabase.rpc('api_get_dashboard');

      if (!rpc.error && rpc.data) {
        const d = rpc.data;
        setStats({
          totalMembers: d.total_members ?? 0,
          totalAUM: d.total_aum ?? 0,
          activeAccounts: d.active_accounts ?? 0,
          unitPrice: d.current_unit_value ?? 0,
        });
        return;
      }

      // Fallback: query canonical tables directly
      const [{ data: members, error: membersErr }, { data: accounts, error: accountsErr }] = await Promise.all([
        supabase.from('members').select('id,status'),
        supabase.from('member_accounts').select('member_id,current_balance')
      ]);

      if (membersErr) throw membersErr;
      if (accountsErr) throw accountsErr;

      const totalAUM = (accounts ?? []).reduce((sum, acc) => sum + (acc.current_balance ?? 0), 0);
      const activeAccounts = (members ?? []).filter(m => m.status === 'active').length;

      // Latest unit valuation
      const { data: valuationRows, error: valErr } = await supabase
        .from('club_unit_valuations')
        .select('unit_value, valuation_date')
        .order('valuation_date', { ascending: false })
        .limit(1);
      if (valErr) throw valErr;
      const unitValue = valuationRows && valuationRows.length > 0 ? (valuationRows[0].unit_value ?? 0) : 0;

      setStats({
        totalMembers: (members ?? []).length,
        totalAUM,
        activeAccounts,
        unitPrice: unitValue,
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
