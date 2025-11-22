import React from 'react';

export default function AdminUnitPrice() {
  return (
    <div className="app-page">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="app-heading-lg">Unit Price Management</h2>
        <button className="app-btn app-btn-primary app-btn-pill">+ Set Unit Price</button>
      </div>
      
      <div className="app-grid cols-2 mb-4" style={{ gap: '1rem' }}>
        <div className="app-card">
          <div className="app-card-header">
            <h5 className="app-card-title">Current Unit Price</h5>
          </div>
          <div className="app-card-content" style={{ textAlign: 'center' }}>
            <div className="app-heading-xl">$0.00</div>
            <span className="app-pill">Pending</span>
            <p className="app-text-muted" style={{ marginTop: '.75rem' }}>
              Unit price not finalized for current period
            </p>
          </div>
        </div>
        <div className="app-card">
          <div className="app-card-header">
            <h5 className="app-card-title">Price History</h5>
          </div>
          <div className="app-card-content">
            <p className="app-text-muted">No price history available yet</p>
          </div>
        </div>
      </div>
      
      <div className="app-card">
        <div className="app-card-content flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <i className="fas fa-exclamation-triangle" style={{ color: 'var(--accent-yellow)', marginTop: '2px' }}></i>
            <div>
              <strong>Action Required</strong>
              <div className="app-text-muted mt-1">
                Unit price calculation is pending for the current period
              </div>
            </div>
          </div>
          <button className="app-btn app-btn-primary app-btn-pill">Finalize Unit Price</button>
        </div>
      </div>
    </div>
  );
}
