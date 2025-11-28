import React from 'react';
import { Page } from './Page';
import { Plus } from 'lucide-react';

export default function AdminLedger() {
  return (
    <Page
      title="Ledger"
      subtitle="Review debits, credits, and balances"
      actions={
        <button className="btn-primary rounded-full px-4 py-2 flex items-center gap-2">
          <Plus size={16} />
          Record Transaction
        </button>
      }
    >
      <div className="card">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-default">Transaction History</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-sm font-medium text-muted">Date</th>
                  <th className="text-left py-3 text-sm font-medium text-muted">Description</th>
                  <th className="text-left py-3 text-sm font-medium text-muted">Account</th>
                  <th className="text-left py-3 text-sm font-medium text-muted">Debit</th>
                  <th className="text-left py-3 text-sm font-medium text-muted">Credit</th>
                  <th className="text-left py-3 text-sm font-medium text-muted">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" className="text-center py-12 text-muted">
                    No transactions recorded yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Page>
  );
}
