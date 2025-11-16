import React from 'react';

export default function AdminUnitPrice() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Unit Price Management</h2>
        <button className="btn btn-primary">+ Set Unit Price</button>
      </div>
      
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="task-box">
            <h5 className="mb-3">Current Unit Price</h5>
            <div className="text-center">
              <h1 className="display-4 text-primary">$0.00</h1>
              <span className="badge bg-warning">Pending</span>
              <p className="text-muted mt-2">Unit price not finalized for current period</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="task-box">
            <h5 className="mb-3">Price History</h5>
            <p className="text-muted">No price history available yet</p>
          </div>
        </div>
      </div>
      
      <div className="task-box">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
            <strong>Action Required</strong>
            <div className="text-muted mt-1">
              Unit price calculation is pending for the current period
            </div>
          </div>
          <button className="btn btn-primary">Finalize Unit Price</button>
        </div>
      </div>
    </>
  );
}