import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import schwabApi, { SchwabAPIError } from '../services/schwabApi';
import { supabase } from '../lib/supabase';
import { captureSchwabSnapshot, getLatestSnapshots } from '../services/schwabSnapshots';
import { syncSchwabPositionsForToday, getPositionsForAccountDate } from '../services/schwabPositions';

const SchwabInsights = () => {
  const [historicalSnapshots, setHistoricalSnapshots] = useState([]);
  const [latest, setLatest] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [capturingSnapshot, setCapturingSnapshot] = useState(false);
  const [syncingPositions, setSyncingPositions] = useState(false);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState('');
  const [lastSnapshotDate, setLastSnapshotDate] = useState(null);
  const [snapshotError, setSnapshotError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadLiveData = async () => {
      // Get all accounts
      console.log('📋 [SchwabInsights/loadLiveData] Fetching accounts...');
      const accounts = await schwabApi.getAccounts();
      console.log('📋 [SchwabInsights/loadLiveData] Received', accounts.length, 'accounts');
      if (!isMounted) return;

      // For each account, get details and positions
      const details = await Promise.all(accounts.map(acc => {
        const accountNumber = acc.securitiesAccount?.accountNumber ?? acc.accountNumber ?? acc.accountId;
        if (!accountNumber) {
          console.warn('⚠️ [SchwabInsights/loadLiveData] Account missing accountNumber:', acc);
          return null;
        }
        console.log('📞 [SchwabInsights/loadLiveData] Calling getAccountDetails for accountNumber:', accountNumber);
        console.log('📞 [SchwabInsights/loadLiveData] Endpoint: /trader/v1/accounts/' + accountNumber + '?fields=positions');
        return schwabApi.getAccountDetails(accountNumber);
      }));
      console.log('✅ [SchwabInsights/loadLiveData] Received account details for', details.length, 'accounts');
      
      // Filter out null responses
      const validDetails = details.filter(d => d !== null);
      console.log('✅ [SchwabInsights/loadLiveData] Valid details:', validDetails.length);
      if (!isMounted) return;

      // Get all positions
      const allPositions = validDetails.flatMap(d => d.securitiesAccount?.positions || d.positions || []);
      console.log('✅ [SchwabInsights/loadLiveData] Total positions extracted:', allPositions.length);
      
      // Set live data
      if (!isMounted) return;
      setPositions(allPositions);
      
      // Extract latest balances for display & capture selected account number
      if (validDetails.length > 0) {
        const firstAccount = validDetails[0];
        const balances = firstAccount.securitiesAccount?.currentBalances || {};
        const acctNum = firstAccount.securitiesAccount?.accountNumber;
        if (acctNum) setSelectedAccountNumber(acctNum);
        setLatest({
          liquidationValue: balances.liquidationValue,
          cashBalance: balances.cashBalance,
          longMarketValue: balances.longMarketValue,
          accountNumber: acctNum,
          timestamp: new Date().toISOString()
        });
      }
    };

    const loadHistoricalSnapshots = async () => {
  console.log('📊 [SchwabInsights] Loading historical snapshots...')
      // Fetch historical snapshots from Supabase
      const snapshots = await getLatestSnapshots();
  console.log('📊 [SchwabInsights] Historical snapshots fetched:', snapshots)
      if (!isMounted) return;
      setHistoricalSnapshots(snapshots);
      setSnapshotCount(snapshots.length);
      
      // Set last snapshot date from most recent snapshot
      if (snapshots && snapshots.length > 0) {
        const mostRecent = snapshots[0];
        const dateStr = mostRecent.snapshot_date;
        setLastSnapshotDate(dateStr);
        console.log('📊 [SchwabInsights] Last snapshot date:', dateStr);
      }
    };

    const captureSnapshot = async () => {
      try {
  setSnapshotError('');
        setCapturingSnapshot(true);
  console.log('📸 [SchwabInsights] Calling captureSchwabSnapshot...');
        const result = await captureSchwabSnapshot();
  console.log('✅ [SchwabInsights] Snapshot captured successfully:', result);
        
        // Reload historical data after capturing
        await loadHistoricalSnapshots();
        
        // Update last snapshot date
        if (result.snapshots && result.snapshots.length > 0) {
          const latest = result.snapshots[0];
          setLastSnapshotDate(latest.timestamp);
        }
      } catch (err) {
  console.error('❌ [SchwabInsights] Failed to capture snapshot:', err);
  setSnapshotError(err.message || 'Failed to capture snapshot');
        // Don't throw - just log the error
      } finally {
        if (isMounted) setCapturingSnapshot(false);
      }
    };

    const syncPositions = async (acctNum) => {
      try {
        if (!acctNum) return;
        setSyncingPositions(true);
        console.log('🔁 Syncing Schwab positions for', acctNum);
        const res = await syncSchwabPositionsForToday();
        console.log('✅ Positions sync result:', res);
        const today = new Date().toISOString().slice(0, 10);
        const rows = await getPositionsForAccountDate(acctNum, today);
        if (!isMounted) return;
        setPositions(rows);
      } catch (err) {
        console.error('❌ Failed to sync positions:', err);
        // Keep existing positions if live data already populated
      } finally {
        if (isMounted) setSyncingPositions(false);
      }
    };

    const initialize = async () => {
      setLoading(true);
      setError('');
      
  console.log('🚀 [SchwabInsights] Initializing...');

      try {
        const tokenRaw = localStorage.getItem('schwab_tokens');
  console.log('🚀 [SchwabInsights] Checking auth - tokenRaw exists:', !!tokenRaw);
        const status = schwabApi.getAuthStatus?.();
  console.log('🚀 [SchwabInsights] Auth status from API:', status);
        if (!isMounted) return;

        const authed = !!(status?.authenticated || tokenRaw);
  console.log('🚀 [SchwabInsights] Final auth decision:', authed);
        setIsAuthenticated(authed);
        setAuthChecked(true);

        if (!authed) {
          setHistoricalSnapshots([]);
          setPositions([]);
          setLatest(null);
          setError('You need to connect to Charles Schwab before viewing insights.');
          return;
        }

        // Load live data and historical snapshots in parallel
        await Promise.all([
          loadLiveData(),
          loadHistoricalSnapshots()
        ]);

        // Capture a new snapshot
  console.log('📸 [SchwabInsights] About to capture snapshot...');
        await captureSnapshot();
  console.log('✅ [SchwabInsights] Snapshot capture completed');
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof SchwabAPIError && err.message?.includes('No access token')) {
          setIsAuthenticated(false);
          setError('Your Schwab session isn\'t active. Please reconnect to continue.');
        } else {
          setError(err.message || 'Failed to fetch Schwab data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !selectedAccountNumber) return;

    let isMounted = true;

    const run = async () => {
      try {
        setSyncingPositions(true);
        const today = new Date().toISOString().slice(0, 10);
        await syncSchwabPositionsForToday();
        if (!isMounted) return;
        const rows = await getPositionsForAccountDate(selectedAccountNumber, today);
        if (!isMounted) return;
        setPositions(rows);
      } catch (err) {
        console.error('Failed to sync positions in effect:', err);
      } finally {
        if (isMounted) setSyncingPositions(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, selectedAccountNumber]);

  const handleConnect = async () => {
    try {
      setError('');
      setIsConnecting(true);
      const authUrl = await schwabApi.getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initiate Schwab connection.');
    } finally {
      setIsConnecting(false);
    }
  };

  async function pushToOrgBalance() {
  
  async function manualCaptureSnapshot() {
    if (!selectedAccountNumber) {
      setSnapshotError('No account selected yet. Please wait for accounts to load.');
      return;
    }
    
    setSnapshotError('');
    setCapturingSnapshot(true);
    
    try {
      console.log('📸 [SchwabInsights] Manual snapshot capture initiated...');
      const result = await captureSchwabSnapshot();
      console.log('✅ [SchwabInsights] Manual snapshot captured:', result);
      
      // Reload snapshots
      await loadHistoricalSnapshots();
      
      // Update last snapshot date
      const today = new Date().toISOString().slice(0, 10);
      setLastSnapshotDate(today);
      
      // Also sync positions after snapshot
      await syncSchwabPositionsForToday();
      const rows = await getPositionsForAccountDate(selectedAccountNumber, today);
      setPositions(rows);
    } catch (err) {
      console.error('❌ [SchwabInsights] Manual snapshot failed:', err);
      setSnapshotError(err.message || 'Failed to capture snapshot');
    } finally {
      setCapturingSnapshot(false);
    }
  }
  
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.rpc('api_roll_schwab_into_org_balance', {
        p_date: today
      });
      if (error) {
        console.error('Failed to roll Schwab into org_balance_history', error);
        setError('Failed to save to org balance history: ' + (error.message || 'unknown error'));
      } else {
        console.log('Rolled Schwab balances into org_balance_history for', today);
      }
    } catch (err) {
      console.error('RPC call failed:', err);
      setError('RPC call failed: ' + (err.message || 'unknown error'));
    }
  }

  return (
    <div>
      <h1>Schwab Account Insights</h1>
      <p>Snapshots are captured each time you visit this page. Historical pulls are saved automatically so you can track value trends over time.</p>
        {authChecked && !isAuthenticated && (
          <div className="app-card mt-4">
            <div className="app-card-content">
              <h4 className="mb-2">Connect to Charles Schwab</h4>
              <p className="app-text-muted mb-3">
                You must authorize your Schwab account before we can pull account insights or historical snapshots.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="app-btn app-btn-primary"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Redirecting…' : 'Connect to Charles Schwab'}
                </button>
                <button
                  className="app-btn app-btn-outline"
                  onClick={() => navigate('/admin/schwab')}
                >
                  View Schwab Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
        {loading && <div>Loading Schwab Insights…</div>}
        {error && <div className="error-alert">{error}</div>}
        {latest && (
          <div>
            <div className="insights-hero mb-4">
              <h2>Latest Pull</h2>
              <p>Captured {new Date(latest.timestamp).toLocaleString()}</p>
              <div className="metric-value mb-3">${latest.liquidationValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</div>
              {capturingSnapshot && (
                <p className="app-text-muted">
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Saving snapshot to database...
                </p>
              )}
              {snapshotCount > 0 && (
                <p className="app-text-muted">
                  <i className="fas fa-database" style={{ marginRight: '0.5rem' }}></i>
                  {snapshotCount} historical snapshot{snapshotCount !== 1 ? 's' : ''} saved
              {lastSnapshotDate && (
                <p className="app-text-muted">
                  <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
                  Last snapshot: {lastSnapshotDate}
                </p>
              )}
              {!lastSnapshotDate && authChecked && isAuthenticated && (
                <p className="app-text-muted">
                  <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                  No snapshots yet
                </p>
              )}
              {snapshotError && (
                <div className="app-alert app-alert-destructive mt-2" style={{ padding: '0.75rem' }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                  {snapshotError}
                </div>
              )}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  className="app-btn app-btn-success"
                  onClick={manualCaptureSnapshot}
                  disabled={capturingSnapshot || !selectedAccountNumber}
                >
                  {capturingSnapshot ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                      Capturing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-camera" style={{ marginRight: '0.5rem' }}></i>
                      Capture snapshot now
                    </>
                  )}
                </button>
                <button
                  className="app-btn app-btn-outline"
                  onClick={() => selectedAccountNumber && syncSchwabPositionsForToday().then(() => {
                    const today = new Date().toISOString().slice(0, 10);
                    getPositionsForAccountDate(selectedAccountNumber, today).then(setPositions);
                  })}
                  disabled={syncingPositions || !selectedAccountNumber}
                >
                  {syncingPositions ? 'Syncing positions…' : 'Refresh positions'}
                </button>
                <button
                  className="app-btn app-btn-primary"
                  onClick={pushToOrgBalance}
                >
                  Save snapshot to org history
                </button>
              </div>
            </div>
            <div className="insights-card mt-4">
              <h5>Positions ({positions.length})</h5>
              <div className="table-responsive positions-table">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Description</th>
                      <th className="text-end">Quantity</th>
                      <th className="text-end">Market Value</th>
                      <th className="text-end">Day P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, idx) => (
                      <tr key={idx}>
                        <td>{pos.symbol}</td>
                        <td>{pos.description || '—'}</td>
                        <td className="text-end">{pos.quantity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="text-end">${pos.market_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="text-end">${pos.current_day_pl?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="insights-card mt-4">
              <h5>Snapshot History</h5>
              <div className="table-responsive history-table">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Captured</th>
                      <th>Account</th>
                      <th className="text-end">Liquidation Value</th>
                      <th className="text-end">Invested</th>
                      <th className="text-end">Cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalSnapshots.length > 0 ? (
                      historicalSnapshots.map((snapshot, idx) => (
                        <tr key={idx}>
                          <td>{new Date(snapshot.snapshot_date).toLocaleString()}</td>
                          <td>{snapshot.schwab_accounts?.account_number || '—'}</td>
                          <td className="text-end">${snapshot.liquidation_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                          <td className="text-end">${snapshot.long_market_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                          <td className="text-end">${snapshot.cash_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center app-text-muted">
                          No historical snapshots available yet. Snapshots are captured automatically when you visit this page.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default SchwabInsights;