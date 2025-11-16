import React, { useState } from 'react';

export default function UnitValueSystemEducation() {
  // State for interactive calculator
  const [portfolioValue, setPortfolioValue] = useState(913810.31);
  const [totalUnits, setTotalUnits] = useState(18175.61);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [unitsDelta, setUnitsDelta] = useState('');
  const [addNote, setAddNote] = useState('');
  const [subNote, setSubNote] = useState('');
  const [unitsNote, setUnitsNote] = useState('');

  // Original FFA values for reset
  const ORIGINAL_PORTFOLIO = 913810.31;
  const ORIGINAL_UNITS = 18175.61;

  const formatMoney = (amount) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getUnitPrice = () => {
    return totalUnits > 0 ? portfolioValue / totalUnits : 0;
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount) || 0;
    if (!amount || amount <= 0) {
      setAddNote("Please enter a valid deposit amount.");
      return;
    }
    
    const currentPrice = getUnitPrice();
    if (currentPrice <= 0) {
      setAddNote("Cannot process deposit: unit price is zero.");
      return;
    }
    
    const newUnits = amount / currentPrice;
    setPortfolioValue(prev => prev + amount);
    setTotalUnits(prev => prev + newUnits);
    
    setAddNote(`✅ Deposit processed: +$${formatMoney(amount)} → +${newUnits.toFixed(2)} units at $${formatMoney(currentPrice)}`);
    setDepositAmount("");
  };

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount) || 0;
    if (!amount || amount <= 0) {
      setSubNote("Please enter a valid withdrawal amount.");
      return;
    }
    
    if (amount > portfolioValue) {
      setSubNote("Cannot withdraw more than the total portfolio value.");
      return;
    }
    
    const currentPrice = getUnitPrice();
    const unitsToRemove = amount / currentPrice;
    
    if (unitsToRemove > totalUnits) {
      setSubNote("Cannot remove more units than are outstanding.");
      return;
    }
    
    setPortfolioValue(prev => prev - amount);
    setTotalUnits(prev => prev - unitsToRemove);
    
    setSubNote(`✅ Withdrawal processed: -$${formatMoney(amount)} → -${unitsToRemove.toFixed(2)} units at $${formatMoney(currentPrice)}`);
    setWithdrawalAmount("");
  };

  const handleAddUnits = () => {
    const units = parseFloat(unitsDelta) || 0;
    if (!units || units <= 0) {
      setUnitsNote("Please enter a valid number of units.");
      return;
    }
    
    const currentPrice = getUnitPrice();
    const dollarEquivalent = units * currentPrice;
    
    setTotalUnits(prev => prev + units);
    setPortfolioValue(prev => prev + dollarEquivalent);
    
    setUnitsNote(`✅ Units added: +${units.toFixed(2)} units = +$${formatMoney(dollarEquivalent)} at $${formatMoney(currentPrice)}`);
    setUnitsDelta("");
  };

  const handleRemoveUnits = () => {
    const units = parseFloat(unitsDelta) || 0;
    if (!units || units <= 0) {
      setUnitsNote("Please enter a valid number of units.");
      return;
    }
    
    if (units > totalUnits) {
      setUnitsNote("Cannot remove more units than are outstanding.");
      return;
    }
    
    const currentPrice = getUnitPrice();
    const dollarEquivalent = units * currentPrice;
    
    setTotalUnits(prev => prev - units);
    setPortfolioValue(prev => prev - dollarEquivalent);
    
    setUnitsNote(`✅ Units removed: -${units.toFixed(2)} units = -$${formatMoney(dollarEquivalent)} at $${formatMoney(currentPrice)}`);
    setUnitsDelta("");
  };

  const resetValues = () => {
    setPortfolioValue(ORIGINAL_PORTFOLIO);
    setTotalUnits(ORIGINAL_UNITS);
    setAddNote("");
    setSubNote("");
    setUnitsNote("");
    setDepositAmount("");
    setWithdrawalAmount("");
    setUnitsDelta("");
  };

  const unitPrice = getUnitPrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                📚 Unit Value System — Complete Guide
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/member/dashboard" className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                ← Dashboard
              </a>
              <a href="/admin/education" className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors">
                ⚙️ Admin Education
              </a>
              <a href="/education/catalog" className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
                📊 Education Catalog
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* What is a Unit - Simple Version */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-900">🍪 What is a "Unit"? (Simple Version)</h2>
          </div>
          <div className="p-6">
            <div className="text-lg leading-relaxed space-y-4">
              <p>Think of the FFA Investment Club like a <strong>big cookie jar</strong> filled with money from everyone's contributions. Instead of tracking who owns what dollar amount, we slice this "cookie" into many equal <strong>pieces called units</strong>.</p>
              
              <div className="space-y-2">
                <p>🔹 <strong>Everyone owns some number of pieces (units)</strong></p>
                <p>🔹 <strong>The cookie's total size changes</strong> when investments go up or down</p>
                <p>🔹 <strong>Your number of pieces stays the same</strong> unless you buy more or sell some</p>
              </div>
              
              <div className="text-center my-6">
                <span className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full text-sm font-medium">
                  Unit Price = Total Portfolio Value ÷ Total Units Outstanding
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real FFA Investment Example */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-900">📊 Real FFA Investment Example</h2>
          </div>
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                <strong>💡 Using actual July 2025 FFA data:</strong> Let's see how the unit system works with real numbers from your investment club.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                <h3 className="text-sm font-medium text-blue-600 mb-2">Step 1 — Portfolio Value</h3>
                <div className="text-2xl font-bold text-slate-900 mb-2">$913,810.31</div>
                <div className="text-sm text-slate-500">Total cash + all stock investments</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                <h3 className="text-sm font-medium text-blue-600 mb-2">Step 2 — Outstanding Units</h3>
                <div className="text-2xl font-bold text-slate-900 mb-2">18,175.61</div>
                <div className="text-sm text-slate-500">Total units distributed to all members</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                <h3 className="text-sm font-medium text-blue-600 mb-2">Step 3 — Current Unit Price</h3>
                <div className="text-2xl font-bold text-slate-900 mb-2">$50.29</div>
                <div className="text-sm text-slate-500">$913,810.31 ÷ 18,175.61 units</div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Member Name</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Units Owned</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Current Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">% of Club</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">Burrell, Felecia</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900">1,852.53</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">$93,189.17</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900">10.19%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">Jean, Joel Sr.</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900">2,231.93</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">$112,268.84</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900">12.28%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">J. Archie</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900">11.08</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">$557.21</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900">0.06%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-blue-800">
                <strong>Key insight:</strong> If the portfolio grows to $950,000 next month but total units stay at 18,175.61, the new unit price becomes $52.28. Felecia would then own $96,827 worth (same 1,852.53 units × new price).
              </p>
            </div>
          </div>
        </div>

        {/* How Deposits & Withdrawals Work */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-900">💰 How Deposits & Withdrawals Work</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">💵 Making a Deposit</h3>
                <p className="font-medium mb-3">Process:</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-700">
                  <li>Member brings cash to invest</li>
                  <li>Calculate: <code className="bg-slate-200 px-2 py-1 rounded text-sm">New Units = Cash ÷ Current Unit Price</code></li>
                  <li>Add cash to portfolio total</li>
                  <li>Add new units to member's account</li>
                </ol>
                <div className="mt-4 text-sm text-slate-500">
                  <strong>Result:</strong> Portfolio value ↑, Total units ↑, Unit price stays constant
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">💸 Making a Withdrawal</h3>
                <p className="font-medium mb-3">Process:</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-700">
                  <li>Member wants to cash out units</li>
                  <li>Calculate: <code className="bg-slate-200 px-2 py-1 rounded text-sm">Cash Payout = Units × Current Unit Price</code></li>
                  <li>Remove cash from portfolio</li>
                  <li>Remove units from member's account</li>
                </ol>
                <div className="mt-4 text-sm text-slate-500">
                  <strong>Result:</strong> Portfolio value ↓, Total units ↓, Unit price stays constant
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="text-lg font-bold text-yellow-800 mb-3">🔑 Critical Rule: Fair Transaction Pricing</h4>
              <p className="text-yellow-700 mb-3">The unit price stays <strong>exactly the same</strong> during deposits and withdrawals. This ensures:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>✅ <strong>Fairness:</strong> All members get the same price on the same day</li>
                <li>✅ <strong>No dilution:</strong> Existing members aren't hurt by new deposits</li>
                <li>✅ <strong>Clean math:</strong> The price only changes when investments gain/lose value</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interactive Unit Math Playground */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-900">🎮 Interactive Unit Math Playground</h2>
          </div>
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                🕹️ <strong>Experiment with the numbers!</strong> Play with different scenarios to see how unit transactions work in practice.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Total Portfolio Value ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={portfolioValue}
                  onChange={(e) => setPortfolioValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Total Units Outstanding</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Current Unit Price</div>
                <div className="text-lg font-bold text-slate-900">${formatMoney(unitPrice)}</div>
                <div className="text-xs text-slate-500">Portfolio ÷ Units</div>
              </div>
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Archie's Value</div>
                <div className="text-lg font-bold text-slate-900">${formatMoney(11.08 * unitPrice)}</div>
                <div className="text-xs text-slate-500">11.08 units × price</div>
              </div>
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Total Portfolio</div>
                <div className="text-lg font-bold text-slate-900">${formatMoney(portfolioValue)}</div>
              </div>
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Total Units</div>
                <div className="text-lg font-bold text-slate-900">{totalUnits.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-slate-900 mb-4">💵 Try a Member Deposit</h4>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Deposit amount (e.g., 5000)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md mb-3"
                />
                <button 
                  onClick={handleDeposit}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Process Deposit
                </button>
                {addNote && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    {addNote}
                  </div>
                )}
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-slate-900 mb-4">💸 Try a Member Withdrawal</h4>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Withdrawal amount (e.g., 3000)"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md mb-3"
                />
                <button 
                  onClick={handleWithdrawal}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Process Withdrawal
                </button>
                {subNote && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    {subNote}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-slate-900 mb-4">📊 Direct Unit Transfer</h4>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Number of units (e.g., 100)"
                  value={unitsDelta}
                  onChange={(e) => setUnitsDelta(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md mb-3"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddUnits}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    + Add Units
                  </button>
                  <button 
                    onClick={handleRemoveUnits}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    − Remove Units
                  </button>
                </div>
                {unitsNote && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    {unitsNote}
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-slate-900 mb-4">🔄 Reset Controls</h4>
                <p className="text-slate-500 mb-3">Restore original FFA values</p>
                <button 
                  onClick={resetValues}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  🔄 Reset to FFA Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Unit System Rules of Thumb */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-900">✅ Unit System Rules of Thumb</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">🔹 For New Members</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li><strong>Bring cash</strong> → Get units at today's price</li>
                  <li><strong>Same price for everyone</strong> on the same day</li>
                  <li><strong>Your ownership percentage</strong> = Your units ÷ Total units</li>
                </ul>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">🔹 For Existing Members</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li><strong>Unit count stays fixed</strong> unless you buy/sell</li>
                  <li><strong>Value changes daily</strong> as investments fluctuate</li>
                  <li><strong>Cash out anytime</strong> at current unit price</li>
                </ul>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">🔹 Price Movement Rules</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li><strong>Price changes</strong> when investments gain/lose value</li>
                  <li><strong>Price stays constant</strong> during member transactions</li>
                  <li><strong>Expenses/dividends</strong> affect the unit price</li>
                </ul>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">🔹 Fairness Guarantees</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li><strong>No dilution</strong> from new member deposits</li>
                  <li><strong>Proportional ownership</strong> is always maintained</li>
                  <li><strong>Transparent pricing</strong> for all transactions</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="text-lg font-bold text-yellow-800 mb-3">🎯 Bottom Line:</h4>
              <p className="text-yellow-700">
                The unit system ensures <strong>mathematical fairness</strong> for all FFA Investment Club members. Whether you invested $500 or $50,000, everyone gets the same unit price on the same day, and your ownership percentage accurately reflects your contribution to the club's success.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}