import React from 'react';

export default function AdminAccounts() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Accounts</h2>
        <button className="app-btn app-btn-primary">+ Add Account</button>
      </div>
      
      <div className="task-box">
        <h5 className="mb-3">Account Management</h5>
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="app-card">
              <div className="app-card-content">
                <h6 className="card-title">Total Accounts</h6>
                <h2 className="text-primary">0</h2>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="app-card">
              <div className="app-card-content">
                <h6 className="card-title">Active Accounts</h6>
                <h2 className="text-success">0</h2>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="app-card">
              <div className="app-card-content">
                <h6 className="card-title">Total Balance</h6>
                <h2 className="text-info">$0.00</h2>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-muted">No accounts created yet. Click "Add Account" to get started.</p>
      </div>
    </>
  );
}