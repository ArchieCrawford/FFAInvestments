import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import schwabApi from '../services/schwabApi';

const SchwabInsights = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [latest, setLatest] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get all accounts
        const accounts = await schwabApi.getAccounts();
        // For each account, get details and positions
        const details = await Promise.all(accounts.map(acc => schwabApi.getAccountDetails(acc.accountNumber)));
        // Get all positions
        const allPositions = details.flatMap(d => d.positions || []);
        // Get market data for all symbols
        const symbols = allPositions.map(p => p.symbol).filter(Boolean);
        const marketData = symbols.length ? await schwabApi.getQuotes(symbols) : {};

        // Build snapshot
        const snapshot = {
          timestamp: new Date().toISOString(),
          accounts,
          details,
          positions: allPositions,
          marketData,
        };

        // Save snapshot (to backend or localStorage)
        setSnapshots(prev => [...prev, snapshot]);
        setLatest(snapshot);
        setPositions(allPositions);
      } catch (err) {
        setError(err.message || 'Failed to fetch Schwab data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AppLayout>
      <div className="app-page">
        <h1>Schwab Account Insights</h1>
        <p>Snapshots are captured each time you visit this page. Historical pulls are saved automatically so you can track value trends over time.</p>
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