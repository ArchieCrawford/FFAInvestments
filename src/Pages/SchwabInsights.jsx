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

export default SchwabInsights;import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import schwabApi, { SchwabAPIError } from '../services/schwabApi'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

const SchwabInsights = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [accountDetails, setAccountDetails] = useState(null)
  const [positions, setPositions] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  
  const navigate = useNavigate()

  useEffect(() => {
    loadAccountData()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      loadAccountDetails()
    }
  }, [selectedAccount])

  const loadAccountData = async () => {
    try {
      setIsLoading(true)
      if (!schwabApi.isAuthenticated()) {
        navigate('/admin/schwab')
        return
      }
      
      const accountData = await schwabApi.getAccounts()
      setAccounts(accountData || [])
      
      if (accountData && accountData.length > 0) {
        setSelectedAccount(accountData[0].accountNumber || accountData[0].hashValue)
      }
      
      setError('')
    } catch (error) {
      console.error('❌ Failed to load accounts:', error)
      setError(error.message || 'Failed to load account data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAccountDetails = async () => {
    if (!selectedAccount) return
    
    try {
      setIsLoading(true)
      const details = await schwabApi.getAccountDetails(selectedAccount)
      setAccountDetails(details)
      
      if (details.positions) {
        setPositions(details.positions)
      }
      
      // Calculate metrics
      const calculatedMetrics = calculateMetrics(details)
      setMetrics(calculatedMetrics)
      
      setLastUpdated(new Date())
      setError('')
    } catch (error) {
      console.error('❌ Failed to load account details:', error)
      setError(error.message || 'Failed to load account details')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateMetrics = (details) => {
    if (!details || !details.currentBalances) return null
    
    const balances = details.currentBalances
    const totalValue = balances.liquidationValue || 0
    const cashValue = balances.cashBalance || 0
    const investedValue = (balances.longMarketValue || 0) + Math.abs(balances.shortMarketValue || 0)
    
    // Calculate position metrics
    const positionMetrics = details.positions ? details.positions.reduce((acc, position) => {
      const marketValue = position.marketValue || 0
      const longQuantity = position.longQuantity || 0
      
      if (marketValue > 0) {
        acc.totalPositions++
        acc.totalMarketValue += marketValue
        
        if (longQuantity > 0) {
          acc.longPositions++
        } else {
          acc.shortPositions++
        }
      }
      
      return acc
    }, {
      totalPositions: 0,
      longPositions: 0,
      shortPositions: 0,
      totalMarketValue: 0
    }) : { totalPositions: 0, longPositions: 0, shortPositions: 0, totalMarketValue: 0 }

    return {
      totalValue,
      cashValue,
      investedValue,
      cashPercentage: totalValue > 0 ? (cashValue / totalValue) * 100 : 0,
      investedPercentage: totalValue > 0 ? (investedValue / totalValue) * 100 : 0,
      buyingPower: balances.buyingPower || 0,
      dayTradingBuyingPower: balances.dayTradingBuyingPower || 0,
      ...positionMetrics
    }
  }

  const handleExportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new()
      
      // Account Summary sheet
      const summaryData = [
        ['Charles Schwab Account Insights'],
        ['Generated:', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
        [''],
        ['Account Information'],
        ['Account Number:', selectedAccount],
        ['Account Type:', accountDetails?.type || 'N/A'],
        [''],
        ['Portfolio Metrics'],
        ['Total Value:', formatCurrency(metrics?.totalValue)],
        ['Cash Balance:', formatCurrency(metrics?.cashValue)],
        ['Invested Value:', formatCurrency(metrics?.investedValue)],
        ['Cash Percentage:', `${metrics?.cashPercentage?.toFixed(2)}%`],
        ['Invested Percentage:', `${metrics?.investedPercentage?.toFixed(2)}%`],
        ['Buying Power:', formatCurrency(metrics?.buyingPower)],
        ['Day Trading Power:', formatCurrency(metrics?.dayTradingBuyingPower)],
        [''],
        ['Position Summary'],
        ['Total Positions:', metrics?.totalPositions || 0],
        ['Long Positions:', metrics?.longPositions || 0],
        ['Short Positions:', metrics?.shortPositions || 0]
      ]
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Account Summary')
      
      // Positions sheet
      if (positions.length > 0) {
        const positionsData = [
          ['Symbol', 'Description', 'Quantity', 'Price', 'Market Value', 'Day Change', 'Day Change %']
        ]
        
        positions.forEach(position => {
          positionsData.push([
            position.instrument?.symbol || 'N/A',
            position.instrument?.description || 'N/A',
            position.longQuantity || position.shortQuantity || 0,
            position.marketPrice || 0,
            position.marketValue || 0,
            position.currentDayProfitLoss || 0,
            position.currentDayProfitLossPercentage || 0
          ])
        })
        
        const positionsSheet = XLSX.utils.aoa_to_sheet(positionsData)
        XLSX.utils.book_append_sheet(wb, positionsSheet, 'Positions')
      }
      
      // Save file
      const fileName = `schwab-insights-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
      XLSX.writeFile(wb, fileName)
      
    } catch (error) {
      console.error('❌ Excel export failed:', error)
      setError('Failed to export to Excel')
    }
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A'
    return `${value.toFixed(2)}%`
  }

  if (isLoading && !accountDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">🔄</div>
              <p className="text-lg text-gray-600">Loading account insights...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Insights</h1>
              <p className="text-gray-600 mt-2">
                Detailed analysis and metrics for your Charles Schwab account
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/admin/schwab')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back to Schwab
              </button>
              <button
                onClick={loadAccountDetails}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                onClick={handleExportToExcel}
                disabled={!accountDetails}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                📥 Export to Excel
              </button>
            </div>
          </div>
        </div>

        {/* Account Selector */}
        {accounts.length > 1 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Account</h3>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {accounts.map((account) => (
                <option key={account.hashValue || account.accountNumber} value={account.accountNumber || account.hashValue}>
                  Account {account.accountNumber || 'Unknown'} - {account.type}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <h4 className="text-red-800 font-semibold">Error</h4>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            
            {/* Total Value */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.totalValue)}
                  </p>
                </div>
                <div className="text-3xl text-blue-600">💰</div>
              </div>
            </div>

            {/* Cash Balance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cash Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics.cashValue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPercentage(metrics.cashPercentage)} of portfolio
                  </p>
                </div>
                <div className="text-3xl text-green-600">💵</div>
              </div>
            </div>

            {/* Invested Value */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Invested Value</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(metrics.investedValue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPercentage(metrics.investedPercentage)} of portfolio
                  </p>
                </div>
                <div className="text-3xl text-purple-600">📈</div>
              </div>
            </div>

            {/* Buying Power */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Buying Power</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(metrics.buyingPower)}
                  </p>
                </div>
                <div className="text-3xl text-orange-600">⚡</div>
              </div>
            </div>

          </div>
        )}

        {/* Position Summary */}
        {metrics && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Position Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{metrics.totalPositions}</p>
                <p className="text-gray-600">Total Positions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{metrics.longPositions}</p>
                <p className="text-gray-600">Long Positions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{metrics.shortPositions}</p>
                <p className="text-gray-600">Short Positions</p>
              </div>
            </div>
          </div>
        )}

        {/* Positions Table */}
        {positions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Positions</h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Symbol</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Price</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Market Value</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Day Change</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Day Change %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {positions.map((position, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">
                        {position.instrument?.symbol || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {position.instrument?.description || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {(position.longQuantity || position.shortQuantity || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(position.marketPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(position.marketValue)}
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold text-right ${
                        (position.currentDayProfitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {position.currentDayProfitLoss ? 
                          `${position.currentDayProfitLoss >= 0 ? '+' : ''}${formatCurrency(position.currentDayProfitLoss)}` : 
                          'N/A'
                        }
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold text-right ${
                        (position.currentDayProfitLossPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {position.currentDayProfitLossPercentage ? 
                          `${position.currentDayProfitLossPercentage >= 0 ? '+' : ''}${formatPercentage(position.currentDayProfitLossPercentage)}` : 
                          'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && (!accountDetails || positions.length === 0) && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Account Data</h3>
            <p className="text-gray-600 mb-4">
              Unable to load account details or positions. Please ensure you're connected to Schwab.
            </p>
            <button
              onClick={() => navigate('/admin/schwab')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Schwab Connection
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default SchwabInsights