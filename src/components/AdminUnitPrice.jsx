import React from 'react';

export default function AdminUnitPrice() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
  <h2>Unit Price Management</h2>
  <button className="app-btn app-btn-primary">+ Set Unit Price</button>
      </div>
      
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="app-card">
            <div className="app-card-header"><h5 className="app-card-title">Current Unit Price</h5></div>
            <div className="app-card-content text-center">
              <h1 className="app-heading-xl">$0.00</h1>
              <span className="app-pill">Pending</span>
              <p className="app-text-muted mt-2">Unit price not finalized for current period</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="app-card">
            <div className="app-card-header"><h5 className="app-card-title">Price History</h5></div>
            <div className="app-card-content">
              <p className="app-text-muted">No price history available yet</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="app-card">
        <div className="app-card-content d-flex justify-content-between align-items-center">
          <div>
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Action Required</strong>
            <div className="app-text-muted mt-1">
              Unit price calculation is pending for the current period
            </div>
          </div>
          <button className="app-btn app-btn-primary">Finalize Unit Price</button>
        </div>
      </div>
    </>
  );
}