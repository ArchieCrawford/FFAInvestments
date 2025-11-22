import React from 'react';

export default function AdminLedger() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Ledger</h2>
        <button className="app-btn app-btn-primary">+ Record Transaction</button>
      </div>
      
      <div className="task-box">
        <h5 className="mb-3">Transaction History</h5>
        <div className="table-responsive">
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
                <td colSpan="6" className="text-center text-muted">
                  No transactions recorded yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}