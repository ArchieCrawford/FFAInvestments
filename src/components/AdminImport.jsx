import React from 'react';

export default function AdminImport() {
  return (
    <div className="app-page">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="app-heading-lg">Import Data</h2>
      </div>
      
      <div className="app-card">
        <div className="app-card-header">
          <h5 className="app-card-title">Data Import Tools</h5>
          <p className="app-card-subtitle">Bring in transactions from CSV or Excel files</p>
        </div>
        <div className="app-card-content">
          <div className="app-grid cols-2">
            <div className="app-card text-center">
              <div className="app-card-content">
                <i className="fas fa-file-csv fa-3x mb-3"></i>
                <h6 className="app-heading-md">Import CSV</h6>
                <p className="app-text-muted small">Upload transaction data from CSV files</p>
                <button className="app-btn app-btn-outline">Choose File</button>
              </div>
            </div>
            <div className="app-card text-center">
              <div className="app-card-content">
                <i className="fas fa-file-excel fa-3x mb-3"></i>
                <h6 className="app-heading-md">Import Excel</h6>
                <p className="app-text-muted small">Upload data from Excel spreadsheets</p>
                <button className="app-btn app-btn-outline app-btn-success">Choose File</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
