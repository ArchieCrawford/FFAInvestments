import React from 'react';

export default function AdminImport() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Import Data</h2>
      </div>
      
      <div className="app-card">
        <div className="app-card-header">
          <h5 className="app-card-title">Data Import Tools</h5>
        </div>
        <div className="app-card-content">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="app-card text-center">
                <div className="app-card-content">
                  <i className="fas fa-file-csv fa-3x mb-3"></i>
                  <h6>Import CSV</h6>
                  <p className="app-text-muted small">Upload transaction data from CSV files</p>
                  <button className="app-btn app-btn-outline">Choose File</button>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="app-card text-center">
                <div className="app-card-content">
                  <i className="fas fa-file-excel fa-3x mb-3"></i>
                  <h6>Import Excel</h6>
                  <p className="app-text-muted small">Upload data from Excel spreadsheets</p>
                  <button className="app-btn app-btn-outline app-btn-success">Choose File</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}