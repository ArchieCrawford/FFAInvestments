import React from 'react';

export default function AdminLedger() {
  return (
    <div className="app-page">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="app-heading-lg">Ledger</h2>
        <button className="app-btn app-btn-primary app-btn-pill">+ Record Transaction</button>
      </div>
      
      <div className="app-card">
        <div className="app-card-header">
          <p className="app-card-title">Transaction History</p>
          <p className="app-card-subtitle">Review debits, credits, and balances</p>
        </div>
        <div className="app-card-content">
          <div className="app-table-scroll">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" className="text-center app-text-muted">
                    No transactions recorded yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
