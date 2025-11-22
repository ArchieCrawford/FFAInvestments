import React, { useState, useEffect } from 'react';

export default function UnitValueSystemGuide() {
  // State variables for interactive calculator
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
  };

  const unitPrice = getUnitPrice();
  const archieValue = 11.08 * unitPrice;

  return (
    <>
      <style>{`
        :root {
          --bg: #f8f9fa;
          --card: #ffffff;
          --muted: #6c757d;
          --text: #2c3e50;
          --border: #e9ecef;
          --accent: #28a745;
          --danger: #dc3545;
          --primary: #3498db;
          --warning: #ffc107;
          --light-bg: #f8f9fa;
        }
        
        .unit-guide-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, var(--bg) 0%, #e9ecef 100%);
          color: var(--text);
          min-height: 100vh;
          padding: 0;
          margin: 0;
        }
        
        .guide-header {
          padding: 25px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--card);
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          margin-bottom: 25px;
        }
        
        .guide-header h1 {
          margin: 0 0 15px 0;
          font-size: 28px;
          font-weight: 600;
          color: var(--text);
        }
        
        .nav-links {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .nav-link {
          background: var(--primary);
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          border: 1px solid var(--primary);
          transition: all 0.2s ease;
        }
        
        .nav-link:hover {
          background: #2980b9;
          border-color: #2980b9;
          transform: translateY(-1px);
        }
        
        .nav-link.success {
          background: var(--accent);
          border-color: var(--accent);
        }
        
        .nav-link.success:hover {
          background: #218838;
          border-color: #218838;
        }
        
        .nav-link.secondary {
          background: var(--muted);
          border-color: var(--muted);
        }
        
        .nav-link.secondary:hover {
          background: #5a6268;
          border-color: #5a6268;
        }
        
        .wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 20px 40px 20px;
        }
        
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          margin: 20px 0;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        
        .card h2 {
          margin: 0;
          padding: 20px 25px;
          border-bottom: 1px solid var(--border);
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
          background: var(--light-bg);
        }
        
        .pad {
          padding: 25px;
        }
        
        .kid {
          font-size: 18px;
          line-height: 1.7;
        }
        
        .example {
          display: grid;
          gap: 15px;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          margin: 20px 0;
        }
        
        .box {
          border: 2px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          background: var(--light-bg);
          text-align: center;
        }
        
        .box h3 {
          margin: 0 0 10px;
          font-size: 16px;
          color: var(--primary);
          font-weight: 600;
        }
        
        .big {
          font-weight: 700;
          font-size: 24px;
          color: var(--text);
          margin: 10px 0;
        }
        
        .muted {
          color: var(--muted);
          font-size: 14px;
        }
        
        .guide-input {
          width: 100%;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          font-size: 16px;
        }
        
        .guide-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
        }
        
        .guide-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        
        .guide-button {
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .guide-button:hover {
          background: var(--light-bg);
          border-color: var(--muted);
        }
        
        .primary {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }
        
        .primary:hover {
          background: #218838;
          border-color: #218838;
        }
        
        .danger {
          background: var(--danger);
          border-color: var(--danger);
          color: white;
        }
        
        .danger:hover {
          background: #c82333;
          border-color: #c82333;
        }
        
        .guide-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        .guide-table th, .guide-table td {
          padding: 12px 10px;
          border-bottom: 1px solid var(--border);
          text-align: left;
        }
        
        .guide-table th {
          color: var(--muted);
          font-weight: 600;
          background: var(--light-bg);
        }
        
        .num {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        
        .hint {
          font-size: 14px;
          color: var(--muted);
          background: var(--light-bg);
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid var(--primary);
          margin: 15px 0;
        }
        
        .pill {
          display: inline-block;
          background: var(--primary);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          margin: 10px 0;
        }
        
        .interactive-box {
          background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
          border: 2px solid var(--accent);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .warning-box {
          background: linear-gradient(135deg, #fff3cd 0%, #fef9e7 100%);
          border: 2px solid var(--warning);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 15px 0;
        }
        
        .result-item {
          text-align: center;
          padding: 15px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        
        .result-label {
          font-size: 12px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .result-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
        }
        
        @media (max-width: 768px) {
          .example {
            grid-template-columns: 1fr;
          }
          
          .guide-row {
            grid-template-columns: 1fr;
          }
          
          .nav-links {
            flex-direction: column;
          }
          
          .nav-link {
            text-align: center;
          }
        }
      `}</style>
      
      <div className="unit-guide-container">
        <div className="guide-header">
          <h1>📚 Unit Value System — Complete Guide</h1>
          <div className="nav-links">
            <a href="/member/dashboard" className="nav-link">← Dashboard</a>
            <a href="/admin/education" className="nav-link">⚙️ Admin Education</a>
            <a href="/admin/portfolio-builder" className="nav-link" style={{background: '#8e44ad', borderColor: '#8e44ad'}}>📊 Portfolio Builder</a>
            <a href="/education/catalog" className="nav-link success">📚 Education Center</a>
          </div>
        </div>

        <main className="wrap">
          <section className="card">
            <h2>🍪 What is a "Unit"? (Simple Version)</h2>
            <div className="pad kid">
              <p>Think of the FFA Investment Club like a <strong>big cookie jar</strong> filled with money from everyone's contributions. Instead of tracking who owns what dollar amount, we slice this "cookie" into many equal <strong>pieces called units</strong>.</p>
              
              <p>🔹 <strong>Everyone owns some number of pieces (units)</strong><br/>
              🔹 <strong>The cookie's total size changes</strong> when investments go up or down<br/>
              🔹 <strong>Your number of pieces stays the same</strong> unless you buy more or sell some</p>
              
              <div style={{textAlign: 'center', margin: '20px 0'}}>
                <span className="pill">Unit Price = Total Portfolio Value ÷ Total Units Outstanding</span>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>📊 Real FFA Investment Example</h2>
            <div className="pad">
              <p className="hint">
                <strong>💡 Using actual July 2025 FFA data:</strong> Let's see how the unit system works with real numbers from your investment club.
              </p>
              
              <div className="example">
                <div className="box">
                  <h3>Step 1 — Portfolio Value</h3>
                  <div className="big">$913,810.31</div>
                  <div className="muted">Total cash + all stock investments</div>
                </div>
                <div className="box">
                  <h3>Step 2 — Outstanding Units</h3>
                  <div className="big">18,175.61</div>
                  <div className="muted">Total units distributed to all members</div>
                </div>
                <div className="box">
                  <h3>Step 3 — Current Unit Price</h3>
                  <div className="big">$50.29</div>
                  <div className="muted">$913,810.31 ÷ 18,175.61 units</div>
                </div>
              </div>
              
              <div className="pad">
                <table className="guide-table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th className="num">Units Owned</th>
                      <th className="num">Current Value</th>
                      <th className="num">% of Club</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Burrell, Felecia</strong></td>
                      <td className="num">1,852.53</td>
                      <td className="num"><strong>$93,189.17</strong></td>
                      <td className="num">10.19%</td>
                    </tr>
                    <tr>
                      <td><strong>Jean, Joel Sr.</strong></td>
                      <td className="num">2,231.93</td>
                      <td className="num"><strong>$112,268.84</strong></td>
                      <td className="num">12.28%</td>
                    </tr>
                    <tr>
                      <td><strong>J. Archie</strong></td>
                      <td className="num">11.08</td>
                      <td className="num"><strong>$557.21</strong></td>
                      <td className="num">0.06%</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="hint">
                  <strong>Key insight:</strong> If the portfolio grows to $950,000 next month but total units stay at 18,175.61, the new unit price becomes $52.28. Felecia would then own $96,827 worth (same 1,852.53 units × new price).
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>💰 How Deposits & Withdrawals Work</h2>
            <div className="pad">
              <div className="guide-row">
                <div className="box">
                  <h3>💵 Making a Deposit</h3>
                  <p><strong>Process:</strong></p>
                  <ol>
                    <li>Member brings cash to invest</li>
                    <li>Calculate: New Units = Cash ÷ Current Unit Price</li>
                    <li>Add cash to portfolio total</li>
                    <li>Add new units to member's account</li>
                  </ol>
                  <div className="muted"><strong>Result:</strong> Portfolio value ↑, Total units ↑, Unit price stays constant</div>
                </div>
                
                <div className="box">
                  <h3>💸 Making a Withdrawal</h3>
                  <p><strong>Process:</strong></p>
                  <ol>
                    <li>Member wants to cash out units</li>
                    <li>Calculate: Cash Payout = Units × Current Unit Price</li>
                    <li>Remove cash from portfolio</li>
                    <li>Remove units from member's account</li>
                  </ol>
                  <div className="muted"><strong>Result:</strong> Portfolio value ↓, Total units ↓, Unit price stays constant</div>
                </div>
              </div>
              
              <div className="warning-box">
                <h4>🔑 <strong>Critical Rule:</strong> Fair Transaction Pricing</h4>
                <p>The unit price stays <strong>exactly the same</strong> during deposits and withdrawals. This ensures:</p>
                <ul>
                  <li>✅ <strong>Fairness:</strong> All members get the same price on the same day</li>
                  <li>✅ <strong>No dilution:</strong> Existing members aren't hurt by new deposits</li>
                  <li>✅ <strong>Clean math:</strong> The price only changes when investments gain/lose value</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>🧪 "What if Felecia sells everything?"</h2>
            <div className="pad">
              <p><strong>Scenario:</strong> Using current FFA numbers, what happens if Felecia cashes out her entire position?</p>
              
              <div className="interactive-box">
                <h4>📋 <strong>Before Transaction:</strong></h4>
                <div className="result-grid">
                  <div className="result-item">
                    <div className="result-label">Portfolio Value</div>
                    <div className="result-value">$913,810.31</div>
                  </div>
                  <div className="result-item">
                    <div className="result-label">Total Units</div>
                    <div className="result-value">18,175.61</div>
                  </div>
                  <div className="result-item">
                    <div className="result-label">Unit Price</div>
                    <div className="result-value">$50.29</div>
                  </div>
                  <div className="result-item">
                    <div className="result-label">Felecia's Units</div>
                    <div className="result-value">1,852.53</div>
                  </div>
                </div>
                
                <h4>💰 <strong>Transaction Calculation:</strong></h4>
                <p>Felecia's payout = 1,852.53 units × $50.29 = <strong>$93,189.17</strong></p>
                
                <h4>📊 <strong>After Transaction:</strong></h4>
                <div className="result-grid">
                  <div className="result-item">
                    <div className="result-label">New Portfolio Value</div>
                    <div className="result-value">$820,621.14</div>
                  </div>
                  <div className="result-item">
                    <div className="result-label">New Total Units</div>
                    <div className="result-value">16,323.08</div>
                  </div>
                  <div className="result-item">
                    <div className="result-label">New Unit Price</div>
                    <div className="result-value">$50.29</div>
                  </div>
                  <div className="result-item">
                    <div className="result-label">Price Change</div>
                    <div className="result-value" style={{color: 'var(--accent)'}}>$0.00</div>
                  </div>
                </div>
              </div>
              
              <p className="hint">
                <strong>🎯 Key Takeaway:</strong> The unit price doesn't change! All remaining members keep their same number of units at the same price. The only things that changed are the total portfolio size and total units outstanding.
              </p>
            </div>
          </section>

          <section className="card">
            <h2>🎮 Interactive Unit Math Playground</h2>
            <div className="pad">
              <p className="hint">🕹️ <strong>Experiment with the numbers!</strong> Play with different scenarios to see how unit transactions work in practice.</p>
              
              <div className="guide-row">
                <div>
                  <label><strong>Total Portfolio Value ($)</strong></label>
                  <input 
                    className="guide-input"
                    type="number" 
                    step="0.01" 
                    value={portfolioValue}
                    onChange={(e) => setPortfolioValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label><strong>Total Units Outstanding</strong></label>
                  <input 
                    className="guide-input"
                    type="number" 
                    step="0.01" 
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="result-grid" style={{marginTop: '20px'}}>
                <div className="result-item">
                  <div className="result-label">Current Unit Price</div>
                  <div className="result-value">${formatMoney(unitPrice)}</div>
                  <div className="muted">Portfolio ÷ Units</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Archie's Value</div>
                  <div className="result-value">${formatMoney(archieValue)}</div>
                  <div className="muted">11.08 units × price</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Total Portfolio</div>
                  <div className="result-value">${formatMoney(portfolioValue)}</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Total Units</div>
                  <div className="result-value">{totalUnits.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                </div>
              </div>
              
              <div className="guide-row" style={{marginTop: '25px'}}>
                <div className="box">
                  <h4>💵 <strong>Try a Member Deposit</strong></h4>
                  <input 
                    className="guide-input"
                    type="number" 
                    step="0.01" 
                    placeholder="Deposit amount (e.g., 5000)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                  <div style={{marginTop: '10px'}}>
                    <button className="guide-button primary" onClick={handleDeposit}>Process Deposit</button>
                  </div>
                  <div className="hint" style={{marginTop: '10px', minHeight: '20px'}}>
                    {addNote}
                  </div>
                </div>
                
                <div className="box">
                  <h4>💸 <strong>Try a Member Withdrawal</strong></h4>
                  <input 
                    className="guide-input"
                    type="number" 
                    step="0.01" 
                    placeholder="Withdrawal amount (e.g., 3000)"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                  />
                  <div style={{marginTop: '10px'}}>
                    <button className="guide-button danger" onClick={handleWithdrawal}>Process Withdrawal</button>
                  </div>
                  <div className="hint" style={{marginTop: '10px', minHeight: '20px'}}>
                    {subNote}
                  </div>
                </div>
              </div>
              
              <div className="guide-row" style={{marginTop: '20px'}}>
                <div className="box">
                  <h4>📊 <strong>Direct Unit Transfer</strong></h4>
                  <input 
                    className="guide-input"
                    type="number" 
                    step="0.01" 
                    placeholder="Number of units (e.g., 100)"
                    value={unitsDelta}
                    onChange={(e) => setUnitsDelta(e.target.value)}
                  />
                  <div style={{marginTop: '10px'}}>
                    <button className="guide-button primary" onClick={handleAddUnits}>+ Add Units</button>
                    <button className="guide-button danger" onClick={handleRemoveUnits} style={{marginLeft: '5px'}}>− Remove Units</button>
                  </div>
                  <div className="hint" style={{marginTop: '10px', minHeight: '20px'}}>
                    {unitsNote}
                  </div>
                </div>
                
                <div className="box">
                  <h4>🔄 <strong>Reset Controls</strong></h4>
                  <p className="muted">Restore original FFA values</p>
                  <div style={{marginTop: '10px'}}>
                    <button className="guide-button" onClick={resetValues}>🔄 Reset to FFA Data</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>✅ Unit System Rules of Thumb</h2>
            <div className="pad">
              <div className="guide-row">
                <div className="box">
                  <h3>🔹 <strong>For New Members</strong></h3>
                  <ul>
                    <li><strong>Bring cash</strong> → Get units at today's price</li>
                    <li><strong>Same price for everyone</strong> on the same day</li>
                    <li><strong>Your ownership percentage</strong> = Your units ÷ Total units</li>
                  </ul>
                </div>
                
                <div className="box">
                  <h3>🔹 <strong>For Existing Members</strong></h3>
                  <ul>
                    <li><strong>Unit count stays fixed</strong> unless you buy/sell</li>
                    <li><strong>Value changes daily</strong> as investments fluctuate</li>
                    <li><strong>Cash out anytime</strong> at current unit price</li>
                  </ul>
                </div>
                
                <div className="box">
                  <h3>🔹 <strong>Price Movement Rules</strong></h3>
                  <ul>
                    <li><strong>Price changes</strong> when investments gain/lose value</li>
                    <li><strong>Price stays constant</strong> during member transactions</li>
                    <li><strong>Expenses/dividends</strong> affect the unit price</li>
                  </ul>
                </div>
                
                <div className="box">
                  <h3>🔹 <strong>Fairness Guarantees</strong></h3>
                  <ul>
                    <li><strong>No dilution</strong> from new member deposits</li>
                    <li><strong>Proportional ownership</strong> is always maintained</li>
                    <li><strong>Transparent pricing</strong> for all transactions</li>
                  </ul>
                </div>
              </div>
              
              <div className="warning-box">
                <h4>🎯 <strong>Bottom Line:</strong></h4>
                <p>The unit system ensures <strong>mathematical fairness</strong> for all FFA Investment Club members. Whether you invested $500 or $50,000, everyone gets the same unit price on the same day, and your ownership percentage accurately reflects your contribution to the club's success.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}