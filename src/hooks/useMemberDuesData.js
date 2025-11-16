import { useState, useEffect } from 'react';
import { getMemberDuesWithNames } from '../services/memberDataService';
import { readMemberDuesFromExcel } from '../utils/memberDuesExcel';

/**
 * Custom hook for managing member dues data from multiple sources
 * Handles switching between database and Excel data sources
 */
export const useMemberDuesData = () => {
  const [duesData, setDuesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('excel'); // Start with excel, switch to database if available
  
  // Function to load data based on current source
  const loadData = async (source = dataSource) => {
    try {
      setLoading(true);
      setError(null);
      
      if (source === 'database') {
        console.log('🔍 Loading data from database...');
        const result = await getMemberDuesWithNames();
        
        if (result.success && result.data && result.data.length > 0) {
          // Transform database data to match Excel format
          const transformedData = {
            success: true,
            data: result.data.map(item => ({
              "Member Name": item.members?.member_name || 'Unknown',
              "Payment Status": item.payment_status,
              "Latest Amount Owed": item.latest_amount_owed || 0,
              "Total Payments": item.total_payments || 0,
              "Total Contribution": item.total_contribution || 0,
              "Last Payment Date": item.last_payment_date,
              "Due Date": item.due_date,
              "Notes": item.notes
            })),
            source: 'database',
            totalMembers: result.data.length,
            summary: {
              total_members: result.data.length,
              real_members: result.data.length
            },
            processing_date: new Date().toISOString()
          };
          
          setDuesData(transformedData);
          console.log('✅ Successfully loaded', result.data.length, 'members from database');
        } else {
          // No database data, fall back to Excel
          console.log('⚠️ No database data found, falling back to Excel...');
          setDataSource('excel');
          await loadData('excel');
          return;
        }
      } else {
        console.log('📄 Loading data from Excel file...');
        const result = await readMemberDuesFromExcel();
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        setDuesData({
          ...result, 
          source: 'excel'
        });
        console.log('✅ Successfully loaded', result.data?.length, 'members from Excel');
      }
    } catch (err) {
      console.error('❌ Error loading dues data:', err);
      setError(err.message);
      setDuesData(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadData();
  }, []); // Only run on mount

  // Reload when data source changes
  useEffect(() => {
    if (duesData) { // Only reload if we already have data (not initial load)
      loadData();
    }
  }, [dataSource]);

  // Function to switch data source
  const switchDataSource = (newSource) => {
    if (newSource !== dataSource) {
      setDataSource(newSource);
    }
  };

  // Function to refresh current data source
  const refreshData = () => {
    loadData();
  };

  return {
    duesData,
    loading,
    error,
    dataSource,
    switchDataSource,
    refreshData
  };
};