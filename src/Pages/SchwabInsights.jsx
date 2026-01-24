import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import schwabApi, { SchwabAPIError } from '../services/schwabApi';
import { supabase } from '../lib/supabase';
import { captureSchwabSnapshot, getLatestSnapshots } from '../services/schwabSnapshots';
import { syncSchwabPositionsForToday, getLatestPositionsForAccount } from '../services/schwabPositions';

const SchwabInsights = () => {
  const queryClient = useQueryClient();
  const [historicalSnapshots, setHistoricalSnapshots] = useState([]);
  const [latest, setLatest] = useState(null);
  const [positions, setPositions] = useState([]);
  const [positionsJson, setPositionsJson] = useState(null); // Store full raw JSON
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [syncSummary, setSyncSummary] = useState(null);
  const [lastSyncAt, setLastSyncAt] = useState(null);
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
  const oauthAllowed = schwabApi.isOAuthAllowed?.() ?? true;

  const invalidateSchwabQueries = async () => {
    queryClient.invalidateQueries({ queryKey: ['latest_schwab_positions'] });
    queryClient.invalidateQueries({ queryKey: ['schwab_positions'] });
    queryClient.invalidateQueries({ queryKey: ['schwab_positions_totals'] });
    queryClient.invalidateQueries({ queryKey: ['schwab_unit_value'] });
    queryClient.invalidateQueries({ queryKey: ['schwab_snapshot_latest'] });
    queryClient.invalidateQueries({ queryKey: ['org_balance_history'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['member_dashboard_self'] });
    queryClient.invalidateQueries({ queryKey: ['member_account_dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin_members'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['member_accounts'] });
    queryClient.invalidateQueries({ queryKey: ['members_with_accounts'] });
    await queryClient.refetchQueries({ queryKey: ['latest_schwab_positions'], type: 'active' });
  };

  const refreshDbPositions = async (accountNumber) => {
    if (!accountNumber) return;
    const rows = await getLatestPositionsForAccount(accountNumber);
    setPositions(rows);
    const latest = rows.reduce((max, row) => {
      const ts = row.snapshot_date ? new Date(row.snapshot_date).getTime() : null;
      if (!Number.isFinite(ts)) return max;
      return !max || ts > max ? ts : max;
    }, null);
    setLastSyncAt(latest ? new Date(latest).toISOString() : null);
  };

  useEffect(() => {
    let isMounted = true;

    const loadLiveData = async () => {
      try {
        // Get all accounts
        console.log('📋 [SchwabInsights/loadLiveData] Fetching accounts...');
        const accounts = await schwabApi.getAccounts();
        console.log('📋 [SchwabInsights/loadLiveData] Received', accounts.length, 'accounts');
        if (!isMounted) return;

        if (!accounts || accounts.length === 0) {
          setError('No Schwab accounts found');
          return;
        }

        // Get the first account number
        const firstAccount = accounts[0];
        const accountNumber = firstAccount.securitiesAccount?.accountNumber ?? firstAccount.accountNumber ?? firstAccount.accountId;
        
        if (!accountNumber) {
          console.error('❌ [SchwabInsights/loadLiveData] No account number found in first account:', firstAccount);
          setError('Unable to determine account number from Schwab response');
          return;
        }

        console.log('� [SchwabInsights/loadLiveData] Using account:', accountNumber);
        setSelectedAccountNumber(accountNumber);

        // Fetch positions using the new API that works reliably
        console.log('📞 [SchwabInsights/loadLiveData] Calling getPositionsForAccount');
        const accountData = await schwabApi.getPositionsForAccount(accountNumber);
        
        if (!accountData) {
          console.error('❌ [SchwabInsights/loadLiveData] Account not found:', accountNumber);
          setError(`Account ${accountNumber} not found in Schwab response`);
          return;
        }

        if (!isMounted) return;

        // Store full raw JSON for debugging/export/database
        setPositionsJson(accountData);
        await refreshDbPositions(accountNumber);
        
        // Extract balances
        const balances = accountData.securitiesAccount?.currentBalances || {};
        setLatest({
          liquidationValue: balances.liquidationValue,
          cashBalance: balances.cashBalance,
          longMarketValue: balances.longMarketValue,
          accountNumber: accountNumber,
          timestamp: new Date().toISOString()
        });

        // Clear any previous errors
        setError('');
      } catch (err) {
        console.error('❌ [SchwabInsights/loadLiveData] Error loading data:', err);
        if (isMounted) {
          setError(`Failed to load Schwab data: ${err.message || 'Unknown error'}`);
        }
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
        setSyncError('');
        console.log('🔁 Syncing Schwab positions for', acctNum);
        const res = await syncSchwabPositionsForToday();
        console.log('✅ Positions sync result:', res);
        if (!isMounted) return;
        setSyncSummary(res);
        setLastSyncAt(res?.last_sync_at || null);
        await refreshDbPositions(acctNum);
        await invalidateSchwabQueries();
      } catch (err) {
        console.error('❌ Failed to sync positions:', err);
        if (isMounted) {
          setSyncError(err.message || 'Failed to sync positions');
        }
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
        setSyncError('');
        const res = await syncSchwabPositionsForToday();
        if (!isMounted) return;
        setSyncSummary(res);
        setLastSyncAt(res?.last_sync_at || null);
        await refreshDbPositions(selectedAccountNumber);
        await invalidateSchwabQueries();
      } catch (err) {
        console.error('Failed to sync positions in effect:', err);
        if (isMounted) {
          setSyncError(err.message || 'Failed to sync positions');
        }
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
      if (!oauthAllowed) {
        setError('Schwab OAuth is only enabled on www.ffainvestments.com.');
        return;
      }
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

  const handleManualPositionsSync = async () => {
    if (!selectedAccountNumber) return;
    try {
      setSyncingPositions(true);
      setSyncError('');
      const res = await syncSchwabPositionsForToday();
      setSyncSummary(res);
      setLastSyncAt(res?.last_sync_at || null);
      await refreshDbPositions(selectedAccountNumber);
      await invalidateSchwabQueries();
    } catch (err) {
      console.error('❌ Manual positions sync failed:', err);
      setSyncError(err.message || 'Failed to sync positions');
    } finally {
      setSyncingPositions(false);
    }
  };

  const manualCaptureSnapshot = async () => {
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
      
      // Reload historical snapshots from database
      const snapshots = await getLatestSnapshots();
      setHistoricalSnapshots(snapshots);
      setSnapshotCount(snapshots.length);
      
      // Update last snapshot date
      const today = new Date().toISOString().slice(0, 10);
      setLastSnapshotDate(today);
      
      // Also sync positions after snapshot
      const res = await syncSchwabPositionsForToday();
      setSyncSummary(res);
      setLastSyncAt(res?.last_sync_at || null);
      await refreshDbPositions(selectedAccountNumber);
      await invalidateSchwabQueries();
    } catch (err) {
      console.error('❌ [SchwabInsights] Manual snapshot failed:', err);
      setSnapshotError(err.message || 'Failed to capture snapshot');
    } finally {
      setCapturingSnapshot(false);
    }
  };

  async function pushToOrgBalance() {
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
          <div className="card mt-4">
            <div className="card-content">
              <h4 className="mb-2">Connect to Charles Schwab</h4>
              <p className="text-muted mb-3">
                You must authorize your Schwab account before we can pull account insights or historical snapshots.
              </p>
              {!oauthAllowed && (
                <p className="text-muted mb-3">
                  Schwab OAuth is disabled on this host. Use www.ffainvestments.com or add this domain to the allowlist.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  className="btn-primary"
                  onClick={handleConnect}
                  disabled={isConnecting || !oauthAllowed}
                >
                  {isConnecting ? 'Redirecting…' : 'Connect to Charles Schwab'}
                </button>
                <button
                  className="btn-primary-soft border border-border"
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
        {syncError && <div className="error-alert">{syncError}</div>}
        {latest && (
          <div>
            <div className="insights-hero mb-4">
              <h2>Latest Pull</h2>
              <p>
                {lastSyncAt
                  ? `DB sync ${new Date(lastSyncAt).toLocaleString()}`
                  : latest?.timestamp
                  ? `Live fetch ${new Date(latest.timestamp).toLocaleString()}`
                  : 'No sync yet'}
              </p>
              <div className="metric-value mb-3">${latest.liquidationValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</div>
              {syncSummary && (
                <div className="text-muted text-sm">
                  <div>Accounts synced: {syncSummary.accounts_synced ?? 0} / {syncSummary.accounts_count ?? 0}</div>
                  <div>Positions written: {syncSummary.positions_written ?? 0}</div>
                  {syncSummary.errors && syncSummary.errors.length > 0 && (
                    <div className="text-red-500">
                      {syncSummary.errors.map((e, idx) => (
                        <div key={idx}>{e.accountNumber || 'unknown'}: {e.error}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {capturingSnapshot && (
                <p className="text-muted">
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Saving snapshot to database...
                </p>
              )}
              {snapshotCount > 0 && (
                <p className="text-muted">
                  <i className="fas fa-database" style={{ marginRight: '0.5rem' }}></i>
                  {snapshotCount} historical snapshot{snapshotCount !== 1 ? 's' : ''} saved
              {lastSnapshotDate && (
                <p className="text-muted">
                  <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
                  Last snapshot: {lastSnapshotDate}
                </p>
              )}
              {!lastSnapshotDate && authChecked && isAuthenticated && (
                <p className="text-muted">
                  <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                  No snapshots yet
                </p>
              )}
              {snapshotError && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mt-2" style={{ padding: '0.75rem' }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                  {snapshotError}
                </div>
              )}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
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
                  className="btn-primary-soft border border-border"
                  onClick={handleManualPositionsSync}
                  disabled={syncingPositions || !selectedAccountNumber}
                >
                  {syncingPositions ? 'Syncing positions…' : 'Refresh positions'}
                </button>
                <button
                  className="btn-primary"
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
                    {positions.map((pos, idx) => {
                      // Handle both API format (nested) and DB format (flattened)
                      const symbol = pos.instrument?.symbol || pos.symbol || '—';
                      const description = pos.instrument?.description || pos.security_name || pos.description || '—';
                      const quantity = pos.longQuantity ?? pos.quantity ?? pos.shortQuantity ?? 0;
                      const marketValue = pos.marketValue ?? pos.market_value ?? 0;
                      const dayPL = pos.currentDayProfitLoss ?? pos.current_day_pl ?? 0;
                      
                      return (
                        <tr key={idx}>
                          <td><strong>{symbol}</strong></td>
                          <td className="text-muted">{description}</td>
                          <td className="text-end">{quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="text-end">${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className={`text-end ${dayPL >= 0 ? 'text-success' : 'text-danger'}`}>
                            ${dayPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                    {positions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center text-muted">
                          No positions found. Click "Refresh positions" to sync from Schwab.
                        </td>
                      </tr>
                    )}
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
                        <td colSpan="5" className="text-center text-muted">
                          No historical snapshots available yet. Snapshots are captured automatically when you visit this page.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {positionsJson && (
              <div className="insights-card mt-4">
                <h5>Raw Positions JSON</h5>
                <p className="text-muted small mb-3">
                  Full API response for debugging and database storage
                </p>
                <details>
                  <summary className="cursor-pointer text-primary mb-2">
                    <strong>Show/Hide Raw JSON</strong>
                  </summary>
                  <pre className="bg-dark text-light p-3 rounded" style={{ maxHeight: '400px', overflow: 'auto', fontSize: '0.75rem' }}>
                    {JSON.stringify(positionsJson, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default SchwabInsights;
