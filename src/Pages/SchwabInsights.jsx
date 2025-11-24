import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import schwabApi, { SchwabAPIError } from '../services/schwabApi';

const SchwabInsights = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [latest, setLatest] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadSnapshot = async () => {
      // Get all accounts
      const accounts = await schwabApi.getAccounts();
      if (!isMounted) return;

      // For each account, get details and positions
      const details = await Promise.all(accounts.map(acc => schwabApi.getAccountDetails(acc.accountNumber)));
      if (!isMounted) return;

      // Get all positions
      const allPositions = details.flatMap(d => d.positions || []);
      // Get market data for all symbols
      const symbols = allPositions.map(p => p.symbol).filter(Boolean);
      const marketData = symbols.length ? await schwabApi.getQuotes(symbols) : {};
      if (!isMounted) return;

      // Build snapshot
      const snapshot = {
        timestamp: new Date().toISOString(),
        accounts,
        details,
        positions: allPositions,
        marketData,
      };

      setSnapshots(prev => [...prev, snapshot]);
      setLatest(snapshot);
      setPositions(allPositions);
    };

    const initialize = async () => {
      setLoading(true);
      setError('');

      try {
        const status = schwabApi.getAuthStatus?.() || { authenticated: false };
        if (!isMounted) return;

        const authed = !!status.authenticated;
        setIsAuthenticated(authed);
        setAuthChecked(true);

        if (!authed) {
          setSnapshots([]);
          setPositions([]);
          setLatest(null);
          setError('You need to connect to Charles Schwab before viewing insights.');
          return;
        }

        await loadSnapshot();
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

  return (
    <AppLayout>
      <div className="app-page">
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
              <div className="metric-value mb-3">${latest.details[0]?.totals?.liquidation_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</div>
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
                    {snapshots.map((entry, idx) => (
                      <tr key={idx}>
                        <td>{new Date(entry.timestamp).toLocaleString()}</td>
                        <td>{entry.details[0]?.account_number || '—'}</td>
                        <td className="text-end">${entry.details[0]?.totals?.liquidation_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                        <td className="text-end">${entry.details[0]?.totals?.long_market_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                        <td className="text-end">${entry.details[0]?.totals?.cash_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SchwabInsights;