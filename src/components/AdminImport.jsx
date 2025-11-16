import React from 'react';

export default function AdminImport() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Import Data</h2>
      </div>
      
      <div className="task-box">
        <h5 className="mb-3">Data Import Tools</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <i className="fas fa-file-csv fa-3x text-primary mb-3"></i>
                <h6>Import CSV</h6>
                <p className="text-muted small">Upload transaction data from CSV files</p>
                <button className="btn btn-outline-primary">Choose File</button>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <i className="fas fa-file-excel fa-3x text-success mb-3"></i>
                <h6>Import Excel</h6>
                <p className="text-muted small">Upload data from Excel spreadsheets</p>
                <button className="btn btn-outline-success">Choose File</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}