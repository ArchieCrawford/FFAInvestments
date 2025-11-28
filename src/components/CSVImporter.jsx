import React, { useState } from 'react';
import Papa from 'papaparse';
import { base44 } from '@/api/base44Client';
import { supabase } from '../lib/supabase';

export default function CSVImporter({ onImportComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportStatus({ type: 'error', message: 'Please select a CSV file (.csv extension required)' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImportStatus({ type: 'error', message: 'File size too large. Please select a file smaller than 10MB.' });
      return;
    }

    setIsUploading(true);
    setImportStatus(null);

    console.log(`Starting import of file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          await processCSVData(results.data);
          setImportStatus({ type: 'success', message: `Successfully imported ${results.data.length} records` });
          if (onImportComplete) onImportComplete();
        } catch (error) {
          setImportStatus({ type: 'error', message: `Import failed: ${error.message}` });
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        setImportStatus({ type: 'error', message: `File parsing failed: ${error.message}` });
        setIsUploading(false);
      }
    });
  };

  const processCSVData = async (data) => {
    // Group data by member
    const memberMap = new Map();
    const timelineData = [];

    data.forEach((row, index) => {
      const memberName = row.Member_Name?.trim();
      if (!memberName) return;

      // Create member entry
      if (!memberMap.has(memberName)) {
        memberMap.set(memberName, {
          id: Date.now() + index,
          name: memberName,
          email: '', // Will be filled later when inviting
          role: 'member',
          status: 'pending_invite',
          joinDate: new Date().toISOString(),
          totalUnits: 0,
          currentBalance: 0,
          totalContribution: 0
        });
      }

      // Parse timeline entry - use canonical field names for member_monthly_balances
      if (row.Report_Date && row.Portfolio_Value) {
        const timelineEntry = {
          member_id: memberMap.get(memberName).id,
          report_date: new Date(row.Report_Date).toISOString().split('T')[0], // Date only
          portfolio_value: parseFloat(row.Portfolio_Value) || 0,
          total_units: parseFloat(row.Total_Units) || 0,
          total_contribution: parseFloat(row.Total_Contribution) || 0,
          growth_amount: parseFloat(row.Portfolio_Growth_Amount) || 0,
          growth_pct: parseFloat(row.Portfolio_Growth) || 0
        };
        timelineData.push(timelineEntry);

        // Update member summary with latest data
        const member = memberMap.get(memberName);
        member.totalUnits = Math.max(member.totalUnits, timelineEntry.total_units);
        member.currentBalance = Math.max(member.currentBalance, timelineEntry.portfolio_value);
        member.totalContribution = Math.max(member.totalContribution, timelineEntry.total_contribution);
      }
    });

    // Convert map to array and save
    const members = Array.from(memberMap.values());
    
    // Save to storage
    await base44.entities.User.bulkImport(members);
    
    // Import timeline data to member_monthly_balances
    const { error: timelineError } = await supabase
      .from('member_monthly_balances')
      .upsert(timelineData, { onConflict: 'member_id,report_date' });
    
    if (timelineError) throw timelineError;

    console.log(`Imported ${members.length} members and ${timelineData.length} timeline entries`);
  };

  const loadSampleData = async () => {
    setIsUploading(true);
    setImportStatus(null);

    try {
      // Create sample members based on your CSV data
      const sampleData = [
        {
          Member_Name: "Adih, Kofi S.",
          Report_Month: "25-Aug",
          Report_Date: "8/1/2025",
          Portfolio_Value: "14087.16731",
          Total_Units: "283.3353311",
          Total_Contribution: "",
          Ownership_Pct: "",
          Portfolio_Growth: "-0.003714899",
          Portfolio_Growth_Amount: "-52.52754346"
        },
        {
          Member_Name: "Burrell, Felecia",
          Report_Month: "25-Aug", 
          Report_Date: "8/1/2025",
          Portfolio_Value: "97624.903",
          Total_Units: "1963.530609",
          Total_Contribution: "",
          Ownership_Pct: "",
          Portfolio_Growth: "0.055980549",
          Portfolio_Growth_Amount: "5175.375354"
        },
        {
          Member_Name: "Crawford, Archie",
          Report_Month: "25-Aug",
          Report_Date: "8/1/2025", 
          Portfolio_Value: "25000.00",
          Total_Units: "500.0",
          Total_Contribution: "20000",
          Ownership_Pct: "",
          Portfolio_Growth: "0.025",
          Portfolio_Growth_Amount: "500.00"
        }
      ];

      await processCSVData(sampleData);
      setImportStatus({ type: 'success', message: `Successfully loaded ${sampleData.length} sample members for testing` });
      if (onImportComplete) onImportComplete();
    } catch (error) {
      setImportStatus({ type: 'error', message: `Sample data loading failed: ${error.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-card">
      <div className="app-card-header">
        <h5 className="app-card-title">
          <i className="fas fa-upload" style={{ marginRight: '0.5rem' }}></i>
          Import Members from CSV File
        </h5>
      </div>
      <div className="app-card-content">
        <div className="app-alert">
          <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
          <strong>Ready to Import:</strong> Select your legacy timeline CSV file (historical timeline data) to automatically create member accounts with their portfolio history.
        </div>

        <div className="mb-3">
          <label htmlFor="csvFile" className="fw-bold">
            <i className="fas fa-file-csv" style={{ marginRight: '0.5rem' }}></i>
            Choose CSV File:
          </label>
          <input
            type="file"
            className="app-input"
            id="csvFile"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <div className="app-text-muted">
            <strong>Expected columns:</strong> Member_Name, Report_Month, Report_Date, Portfolio_Value, Total_Units, Total_Contribution, etc.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <small className="app-text-muted">
            <i className="fas fa-shield-alt" style={{ marginRight: '0.35rem' }}></i>
            Your data is processed locally and stored securely
          </small>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              className="app-btn app-btn-outline app-btn-sm"
              onClick={() => document.getElementById('csvFile').click()}
              disabled={isUploading}
            >
              <i className="fas fa-folder-open" style={{ marginRight: '0.35rem' }}></i>
              Browse Files
            </button>
            <button 
              className="app-btn app-btn-success app-btn-sm"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv';
                input.onchange = handleFileUpload;
                input.click();
              }}
              disabled={isUploading}
            >
              <i className="fas fa-rocket" style={{ marginRight: '0.35rem' }}></i>
              Quick Import
            </button>
            <button 
              className="app-btn app-btn-warning app-btn-sm"
              onClick={loadSampleData}
              disabled={isUploading}
            >
              <i className="fas fa-database" style={{ marginRight: '0.35rem' }}></i>
              Load Sample Data
            </button>
          </div>
        </div>

        {isUploading && (
          <div className="app-alert">
            <div className="flex items-center gap-2">
              <div className="spinner-inline" role="status"></div>
              Processing CSV file...
            </div>
          </div>
        )}

        {importStatus && (
          <div className={`app-alert ${importStatus.type === 'success' ? 'app-alert-success' : 'app-alert-destructive'}`}>
            <i className={`fas ${importStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ marginRight: '0.5rem' }}></i>
            {importStatus.message}
          </div>
        )}
      </div>
    </div>
  );
}
