import React, { useState, useEffect } from 'react';
import { Database, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  getMemberDuesWithNames, 
  importExcelDataToDatabase, 
  getDashboardData 
} from '../services/memberDataService';
import { readMemberDuesFromExcel } from '../utils/memberDuesExcel';

/**
 * DatabaseManager Component
 * Handles switching between Excel and Database data sources
 * Provides import functionality to migrate Excel data to permanent storage
 */
const DatabaseManager = ({ onDataSourceChange, currentSource = 'excel' }) => {
  const [importStatus, setImportStatus] = useState(null);
  const [databaseStats, setDatabaseStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check database status on mount
  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const result = await getMemberDuesWithNames();
      if (result.success) {
        setDatabaseStats({
          memberCount: result.data?.length || 0,
          hasData: result.data && result.data.length > 0
        });
      }
    } catch (error) {
      console.error('Error checking database status:', error);
    }
  };

  const handleImportToDatabase = async () => {
    try {
      setImportStatus({ loading: true, message: 'Importing Excel data to database...' });
      setLoading(true);
      
      // First load Excel data
      console.log('📄 Loading Excel data for import...');
      const excelResult = await readMemberDuesFromExcel();
      if (!excelResult.success) {
        throw new Error(`Excel load failed: ${excelResult.error}`);
      }

      // Then import to database
      console.log('💾 Importing to database...', excelResult.data.length, 'members');
      const importResult = await importExcelDataToDatabase(excelResult.data);
      if (!importResult.success) {
        throw new Error(`Database import failed: ${importResult.error}`);
      }

      setImportStatus({ 
        loading: false, 
        success: true, 
        message: `✅ Successfully imported ${importResult.membersImported} members and ${importResult.duesImported} dues records` 
      });
      
      // Update database stats
      await checkDatabaseStatus();
      
      // Notify parent component about the successful import
      if (onDataSourceChange) {
        onDataSourceChange('database');
      }
      
      // Clear status after 5 seconds
      setTimeout(() => setImportStatus(null), 5000);
      
    } catch (error) {
      setImportStatus({ 
        loading: false, 
        success: false, 
        message: `❌ Import failed: ${error.message}` 
      });
      console.error('Import error:', error);
      
      // Clear error status after 5 seconds
      setTimeout(() => setImportStatus(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const switchDataSource = (source) => {
    if (onDataSourceChange) {
      onDataSourceChange(source);
    }
  };

  return (
    <div className="database-manager">
      <div className="database-controls">
        {/* Data Source Toggle */}
        <div className="data-source-toggle">
          <button
            className={`btn-toggle ${currentSource === 'database' ? 'active' : ''}`}
            onClick={() => switchDataSource('database')}
            disabled={!databaseStats?.hasData}
            title={!databaseStats?.hasData ? 'No data in database. Import Excel data first.' : 'Switch to database storage'}
          >
            <Database size={16} />
            Database
            {databaseStats?.memberCount > 0 && (
              <span className="member-count">({databaseStats.memberCount})</span>
            )}
          </button>
          
          <button
            className={`btn-toggle ${currentSource === 'excel' ? 'active' : ''}`}
            onClick={() => switchDataSource('excel')}
            title="Switch to Excel file data"
          >
            <Download size={16} />
            Excel File
          </button>
        </div>

        {/* Import Button */}
        {currentSource === 'excel' && (
          <button
            className="btn-import"
            onClick={handleImportToDatabase}
            disabled={loading || importStatus?.loading}
            title="Import Excel data to permanent database storage"
          >
            <Upload size={16} />
            {importStatus?.loading ? 'Importing...' : 'Import to Database'}
          </button>
        )}
      </div>

      {/* Status Messages */}
      {importStatus && (
        <div className={`import-status ${importStatus.success ? 'success' : 'error'}`}>
          {importStatus.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Database Info */}
      {databaseStats && (
        <div className="database-info">
          <small>
            {databaseStats.hasData 
              ? `🗄️ Database: ${databaseStats.memberCount} members stored`
              : '⚪ Database: Empty (Import Excel data to get started)'
            }
          </small>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;