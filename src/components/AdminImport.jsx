import React from 'react';
import { Page } from './Page';
import { FileText, Upload } from 'lucide-react';

export default function AdminImport() {
  return (
    <Page
      title="Import Data"
      subtitle="Bring in transactions from CSV or Excel files"
    >
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-default mb-6">Data Import Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 text-center">
            <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-default mb-2">Import CSV</h4>
            <p className="text-sm text-muted mb-4">Upload transaction data from CSV files</p>
            <button className="btn-primary-soft">
              <Upload className="w-4 h-4 mr-2 inline" />
              Choose File
            </button>
          </div>
          <div className="card p-6 text-center">
            <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-default mb-2">Import Excel</h4>
            <p className="text-sm text-muted mb-4">Upload data from Excel spreadsheets</p>
            <button className="btn-primary">
              <Upload className="w-4 h-4 mr-2 inline" />
              Choose File
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
