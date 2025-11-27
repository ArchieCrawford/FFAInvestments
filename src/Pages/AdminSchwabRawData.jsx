import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import schwabApi from '../services/schwabApi';

const AdminSchwabRawData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [positions, setPositions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [accountDetails, setAccountDetails] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const accts = await schwabApi.getAccounts();
        setAccounts(accts);
        if (accts.length > 0) {
          const acctNum = accts[0].accountNumber || accts[0].accountId;
          setSelectedAccount(acctNum);
          const details = await schwabApi.getAccountDetails(acctNum);
          setAccountDetails(details);
          setPositions(details.positions || []);
          setTransactions(details.transactions || []);
          setOrders(details.orders || []);
          // Get featured quotes for all symbols in positions
          const symbols = (details.positions || []).map(p => p.symbol).filter(Boolean);
          if (symbols.length) {
            const q = await schwabApi.getQuotes(symbols);
            setQuotes(q);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch Schwab raw data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <AppLayout>
      <div className="app-page">
        <h1>Schwab API Diagnostics</h1>
        <p>This page exercises the key Schwab endpoints so you can quickly confirm connectivity after logging in.</p>
        {selectedAccount && <p className="small text-muted mb-0">Inspecting account <strong>{selectedAccount}</strong>.</p>}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
            <strong>Warning:</strong> {error}
          </div>
        )}
        {loading && <div>Loading Schwab raw data…</div>}
        {!loading && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="card diagnostics-card bg-dark">
                <div className="card-header">
                  <h5 className="card-title mb-0">Accounts Summary</h5>
                </div>
                <div className="card-content">
                  <p className="small text-muted">{accounts.length} account{accounts.length !== 1 ? 's' : ''} returned.</p>
                  <div className="table-responsive">
                    <table className="w-full border-collapse table-sm">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Type</th>
                          <th className="text-end">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((acct, idx) => (
                          <tr key={idx}>
                            <td>{acct.accountNumber || acct.accountId || '—'}</td>
                            <td>{acct.type || '—'}</td>
                            <td className="text-end">${acct.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="card diagnostics-card bg-dark">
                <div className="card-header">
                  <h5 className="card-title mb-0">Market Snapshot</h5>
                </div>
                <div className="card-content">
                  <h6 className="text-uppercase text-muted small">Featured Quotes</h6>
                  <div className="table-responsive mb-3">
                    <table className="w-full border-collapse table-sm">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th className="text-end">Last</th>
                          <th className="text-end">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(quotes).map(([symbol, quote], idx) => (
                          <tr key={idx}>
                            <td>{symbol}</td>
                            <td className="text-end">${quote.last?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                            <td className="text-end">${quote.change?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="card diagnostics-card bg-dark mt-4">
              <div className="card-header">
                <h5 className="card-title mb-0">Account Detail</h5>
                {selectedAccount && <span className="badge bg-secondary text-uppercase">{selectedAccount}</span>}
              </div>
              <div className="card-content">
                <pre className="bg-black rounded p-3 small text-wrap" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(accountDetails, null, 2)}</pre>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="card diagnostics-card bg-dark">
                <div className="card-header">
                  <h5 className="card-title mb-0">Recent Positions</h5>
                </div>
                <div className="card-content">
                  <div className="table-responsive">
                    <table className="w-full border-collapse table-sm">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th className="text-end">Qty</th>
                          <th className="text-end">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.slice(0, 10).map((pos, idx) => (
                          <tr key={idx}>
                            <td>{pos.symbol || '—'}</td>
                            <td className="text-end">{pos.quantity || 0}</td>
                            <td className="text-end">${pos.market_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="card diagnostics-card bg-dark">
                <div className="card-header">
                  <h5 className="card-title mb-0">Recent Transactions</h5>
                </div>
                <div className="card-content">
                  <div className="table-responsive">
                    <table className="w-full border-collapse table-sm">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn, idx) => (
                          <tr key={idx}>
                            <td>{txn.transactionDate || '—'}</td>
                            <td>{txn.description || '—'}</td>
                            <td className="text-end">${txn.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="card diagnostics-card bg-dark mt-4">
              <div className="card-header">
                <h5 className="card-title mb-0">Recent Orders</h5>
              </div>
              <div className="card-content">
                <div className="table-responsive">
                  <table className="w-full border-collapse table-sm">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Status</th>
                        <th>Symbol</th>
                        <th className="text-end">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, idx) => (
                        <tr key={idx}>
                          <td>{order.orderId || '—'}</td>
                          <td>{order.status || '—'}</td>
                          <td>{order.symbol || '—'}</td>
                          <td className="text-end">{order.quantity || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminSchwabRawData;