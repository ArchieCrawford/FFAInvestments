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
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadLiveData = async () => {
      // Get all accounts
      const accounts = await schwabApi.getAccounts();
      if (!isMounted) return;

      // For each account, get details and positions
      const details = await Promise.all(accounts.map(acc => {
        const accountNumber = acc.securitiesAccount?.accountNumber ?? acc.accountNumber ?? acc.accountId;
        if (!accountNumber) {
          console.warn('SchwabInsights: account missing accountNumber:', acc);
          return null;
        }
        return schwabApi.getAccountDetails(accountNumber);
      }));
      // Filter out null responses
      const validDetails = details.filter(d => d !== null);
      if (!isMounted) return;

      // Get all positions
      const allPositions = validDetails.flatMap(d => d.securitiesAccount?.positions || d.positions || []);
      
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
      // Fetch historical snapshots from Supabase
      const snapshots = await getLatestSnapshots();
      if (!isMounted) return;
      setHistoricalSnapshots(snapshots);
      setSnapshotCount(snapshots.length);
    };

    const captureSnapshot = async () => {
      try {
        setCapturingSnapshot(true);
        console.log('📸 Capturing Schwab snapshot...');
        const result = await captureSchwabSnapshot();
        console.log('✅ Snapshot captured:', result);
        
        // Reload historical data after capturing
        await loadHistoricalSnapshots();
      } catch (err) {
        console.error('❌ Failed to capture snapshot:', err);
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

      try {
        const tokenRaw = localStorage.getItem('schwab_tokens');
        const status = schwabApi.getAuthStatus?.();
        if (!isMounted) return;

        const authed = !!(status?.authenticated || tokenRaw);
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
        await captureSnapshot();
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
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
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