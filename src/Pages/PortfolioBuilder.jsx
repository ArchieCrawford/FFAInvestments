import React, { useState, useEffect } from 'react';

export default function PortfolioBuilder() {
  // Seed members with their unit counts from your FFA data
  const seedMembers = [
    ["Burrell, Felecia", 1852.53],
    ["Kirby, Phillip J. Jr.", 1648.90],
    ["Mauney, Larry", 2169.95],
    ["Sharpe, Tim", 1668.41],
    ["Cheatham, Davy", 1615.83],
    ["Jean, Joel L.", 1132.67],
    ["Jean, Joel Sr.", 2231.93],
    ["Walker, Jessee J.", 1893.57],
    ["Taylor, Clifton", 562.93],
    ["McCall, Anthony", 943.93],
    ["McCall, Shedrick D.", 513.84],
    ["Robinson, Luther Jr.", 331.17],
    ["Gwaltney, Rheba G.", 488.71],
    ["Adih, Kofi S.", 283.34],
    ["Greene, Kristen", 317.00],
    ["Nichols, Milton", 182.80],
    ["Hylton, Lequan", 149.34],
    ["Jackson, Dante", 159.98],
    ["Rodgers, James", 77.70],
    ["J. Archie", 11.08]
  ];

  // Initialize members array with seed data
  const [members, setMembers] = useState(() => 
    seedMembers.map((seedMember, index) => ({
      id: Date.now() + index,
      name: seedMember[0],
      units: seedMember[1],
      contribution: seedMember[1] * 50.29 // Using current unit price from your data
    }))
  );

  const [portfolioValue, setPortfolioValue] = useState(913810.31);
  const [memberName, setMemberName] = useState('');
  const [memberContribution, setMemberContribution] = useState('');
  const [balanceStatus, setBalanceStatus] = useState({ 
    show: false, 
    text: '', 
    isError: false, 
    details: '' 
  });

  // Calculate derived values
  const totalUnits = members.reduce((sum, m) => sum + m.units, 0);
  const unitPrice = totalUnits > 0 ? portfolioValue / totalUnits : 0;
  const totalContributions = members.reduce((sum, m) => sum + m.contribution, 0);
  const avgContribution = members.length > 0 ? totalContributions / members.length : 0;

  // Initialize portfolio value based on current data
  useEffect(() => {
    const calculatedValue = totalUnits * 50.29; // Current unit price from your data
    setPortfolioValue(calculatedValue);
  }, []);

  const addMember = () => {
    if (!memberName.trim()) {
      alert("Please enter a member name");
      return;
    }
    
    const contribution = parseFloat(memberContribution);
    if (isNaN(contribution) || contribution <= 0) {
      alert("Please enter a valid contribution amount");
      return;
    }

    // Check if member already exists
    if (members.find(m => m.name.toLowerCase() === memberName.toLowerCase())) {
      alert("Member already exists! Please use a different name.");
      return;
    }

    const units = contribution / unitPrice;
    const newMember = { 
      name: memberName, 
      contribution, 
      units,
      id: Date.now()
    };

    setMembers(prev => [...prev, newMember]);
    setMemberName('');
    setMemberContribution('');
  };

  const removeMember = (memberId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      setMembers(prev => prev.filter(m => m.id !== memberId));
    }
  };

  const addUnitsByDollar = (memberId) => {
    const dollarInput = document.getElementById(`dollarAdd_${memberId}`);
    const dollarAmount = parseFloat(dollarInput.value);
    
    if (isNaN(dollarAmount) || dollarAmount <= 0) {
      alert("Please enter a valid dollar amount");
      return;
    }
    
    const member = members.find(m => m.id === memberId);
    if (!member) {
      alert("Member not found");
      return;
    }
    
    // Calculate units based on current unit price
    const unitsToAdd = dollarAmount / unitPrice;
    
    // Update member data
    setMembers(prev => prev.map(m => 
      m.id === memberId 
        ? { 
            ...m, 
            units: m.units + unitsToAdd,
            contribution: m.contribution + dollarAmount 
          }
        : m
    ));
    
    // Clear the input
    dollarInput.value = '';
    
    alert(`Added ${unitsToAdd.toFixed(4)} units ($${dollarAmount.toFixed(2)}) to ${member.name}`);
  };

  const addUnitsByAmount = (memberId) => {
    const unitInput = document.getElementById(`unitAdd_${memberId}`);
    const unitAmount = parseFloat(unitInput.value);
    
    if (isNaN(unitAmount) || unitAmount <= 0) {
      alert("Please enter a valid unit amount");
      return;
    }
    
    const member = members.find(m => m.id === memberId);
    if (!member) {
      alert("Member not found");
      return;
    }
    
    // Calculate dollar value based on current unit price
    const dollarValue = unitAmount * unitPrice;
    
    // Update member data
    setMembers(prev => prev.map(m => 
      m.id === memberId 
        ? { 
            ...m, 
            units: m.units + unitAmount,
            contribution: m.contribution + dollarValue 
          }
        : m
    ));
    
    // Clear the input
    unitInput.value = '';
    
    alert(`Added ${unitAmount.toFixed(4)} units ($${dollarValue.toFixed(2)}) to ${member.name}`);
  };

  const removeUnitsByDollar = (memberId) => {
    const dollarInput = document.getElementById(`dollarAdd_${memberId}`);
    const dollarAmount = parseFloat(dollarInput.value);
    
    if (isNaN(dollarAmount) || dollarAmount <= 0) {
      alert("Please enter a valid dollar amount to remove");
      return;
    }
    
    const member = members.find(m => m.id === memberId);
    if (!member) {
      alert("Member not found");
      return;
    }
    
    // Calculate units to remove based on current unit price
    const unitsToRemove = dollarAmount / unitPrice;
    
    // Check if member has enough units to remove
    if (member.units < unitsToRemove) {
      alert(`Cannot remove ${unitsToRemove.toFixed(4)} units. ${member.name} only has ${member.units.toFixed(4)} units.`);
      return;
    }
    
    // Check if removing this amount would make contribution negative
    if (member.contribution < dollarAmount) {
      alert(`Cannot remove $${dollarAmount.toFixed(2)}. ${member.name}'s total contribution is only $${member.contribution.toFixed(2)}.`);
      return;
    }

    if (!window.confirm(`Remove ${unitsToRemove.toFixed(4)} units ($${dollarAmount.toFixed(2)}) from ${member.name}?`)) {
      return;
    }

    setMembers(prev => prev.map(m => 
      m.id === memberId 
        ? { 
            ...m, 
            units: m.units - unitsToRemove,
            contribution: m.contribution - dollarAmount 
          }
        : m
    ));
    
    // Clear the input
    dollarInput.value = '';
  };

  const removeUnitsByAmount = (memberId) => {
    const unitInput = document.getElementById(`unitAdd_${memberId}`);
    const unitAmount = parseFloat(unitInput.value);
    
    if (isNaN(unitAmount) || unitAmount <= 0) {
      alert("Please enter a valid unit amount to remove");
      return;
    }
    
    const member = members.find(m => m.id === memberId);
    if (!member) {
      alert("Member not found");
      return;
    }
    
    // Check if member has enough units to remove
    if (member.units < unitAmount) {
      alert(`Cannot remove ${unitAmount.toFixed(4)} units. ${member.name} only has ${member.units.toFixed(4)} units.`);
      return;
    }
    
    // Calculate dollar value based on current unit price
    const dollarValue = unitAmount * unitPrice;
    
    // Check if removing this amount would make contribution negative
    if (member.contribution < dollarValue) {
      alert(`Cannot remove ${unitAmount.toFixed(4)} units ($${dollarValue.toFixed(2)}). This would exceed ${member.name}'s total contribution of $${member.contribution.toFixed(2)}.`);
      return;
    }

    if (!window.confirm(`Remove ${unitAmount.toFixed(4)} units ($${dollarValue.toFixed(2)}) from ${member.name}?`)) {
      return;
    }

    setMembers(prev => prev.map(m => 
      m.id === memberId 
        ? { 
            ...m, 
            units: m.units - unitAmount,
            contribution: m.contribution - dollarValue 
          }
        : m
    ));
    
    // Clear the input
    unitInput.value = '';
  };

  const pullLiveBalance = async () => {
    setBalanceStatus({
      show: true,
      text: '⏳ Fetching live balance from Schwab...',
      isError: false,
      details: ''
    });

    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response - replace with actual API call
      const mockBalance = 925000.50;
      setPortfolioValue(mockBalance);
      
      setBalanceStatus({
        show: true,
        text: `✅ Live balance: $${mockBalance.toLocaleString()}`,
        isError: false,
        details: `Updated: ${new Date().toLocaleString()} • Source: Schwab API`
      });
      
    } catch (error) {
      setBalanceStatus({
        show: true,
        text: '❌ Failed to fetch live balance',
        isError: true,
        details: 'Please try again or check your Schwab connection'
      });
    }
  };

  const exportToExcel = () => {
    if (members.length === 0) {
      alert("No data to export. Please add members first.");
      return;
    }

    // Create CSV content
    const headers = ["Member Name", "Units Owned", "Total Contribution", "Ownership %", "Current Value"];
    const csvData = [headers];
    
    members.forEach(member => {
      const ownershipPercent = totalUnits > 0 ? (member.units / totalUnits * 100) : 0;
      const currentValue = member.units * unitPrice;
      
      csvData.push([
        member.name,
        member.units.toFixed(4),
        member.contribution.toFixed(2),
        ownershipPercent.toFixed(2),
        currentValue.toFixed(2)
      ]);
    });

    // Add summary data
    csvData.push([]);
    csvData.push(["SUMMARY", "", "", "", ""]);
    csvData.push(["Total Portfolio Value", "", "", "", portfolioValue.toFixed(2)]);
    csvData.push(["Total Members", "", "", "", members.length]);
    csvData.push(["Total Units Outstanding", "", "", "", totalUnits.toFixed(4)]);
    csvData.push(["Current Unit Price", "", "", "", unitPrice.toFixed(4)]);
    csvData.push(["Average Member Contribution", "", "", "", avgContribution.toFixed(2)]);

    // Convert to CSV string
    const csvString = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `InvestmentClub_Portfolio_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    alert(`Portfolio exported successfully as CSV file`);
  };

  const clearAll = () => {
    if (members.length === 0) {
      alert("No data to clear.");
      return;
    }
    
    if (window.confirm("Are you sure you want to clear all member data? This cannot be undone.")) {
      setMembers([]);
      setPortfolioValue(100000);
    }
  };

  return (
    <>
      <style>{`
        .portfolio-builder-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #f7f7f7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          min-height: 100vh;
        }
        
        .builder-header {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .builder-header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          color: #333;
          font-weight: bold;
        }
        
        .builder-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }
        
        .builder-controls {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .control-group {
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .control-group label {
          display: inline-block;
          min-width: 200px;
          font-weight: bold;
          color: #333;
          font-size: 14px;
        }
        
        .control-group input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 150px;
          font-size: 14px;
        }
        
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
        }
        
        .btn-primary:hover {
          background: #0056b3;
        }
        
        .btn-success {
          background: #28a745;
          color: white;
        }
        
        .btn-success:hover {
          background: #1e7e34;
        }
        
        .btn-export {
          background: #17a2b8;
          color: white;
          margin: 5px;
        }
        
        .btn-export:hover {
          background: #138496;
        }
        
        .unit-price-display {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
          font-size: 1.2em;
          font-weight: bold;
        }
        
        .members-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .members-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
        }
        
        .members-table th {
          background: #f8f9fa;
          color: #333;
          font-weight: bold;
          padding: 12px;
          text-align: center;
          border-bottom: 2px solid #dee2e6;
          font-size: 14px;
        }
        
        .members-table td {
          padding: 12px;
          text-align: center;
          border-bottom: 1px solid #dee2e6;
          font-size: 14px;
          vertical-align: middle;
        }
        
        .members-table tbody tr:hover {
          background: #f8f9fa;
        }
        
        .no-members {
          text-align: center;
          padding: 40px;
          color: #6c757d;
          font-style: italic;
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        
        .stat-value {
          font-size: 1.8em;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 5px;
        }
        
        .stat-label {
          color: #6c757d;
          font-size: 0.9em;
        }
        
        .actions-bar {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .balance-status {
          margin-top: 15px;
          padding: 12px 16px;
          border-radius: 6px;
          background: #d4edda;
          border-left: 4px solid #28a745;
        }

        .balance-status.error {
          background: #f8d7da;
          border-left-color: #dc3545;
        }

        .status-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .unit-controls {
          display: grid;
          grid-template-columns: 60px 30px 30px 60px 30px 30px;
          gap: 3px;
          align-items: center;
          justify-content: center;
          padding: 5px;
        }

        .unit-input {
          width: 60px !important;
          padding: 3px 6px !important;
          font-size: 0.8em !important;
          border: 1px solid #ccc;
          border-radius: 3px;
          text-align: center;
        }

        .unit-btn {
          padding: 3px 6px !important;
          font-size: 0.7em !important;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-weight: bold;
          min-width: 30px;
          transition: all 0.2s ease;
        }

        .unit-btn.dollar {
          background: #28a745;
          color: white;
        }

        .unit-btn.dollar:hover {
          background: #218838;
        }

        .unit-btn.units {
          background: #007bff;
          color: white;
        }

        .unit-btn.units:hover {
          background: #0056b3;
        }

        .unit-btn.dollar-remove {
          background: #dc3545;
          color: white;
        }

        .unit-btn.dollar-remove:hover {
          background: #c82333;
        }

        .unit-btn.units-remove {
          background: #fd7e14;
          color: white;
        }

        .unit-btn.units-remove:hover {
          background: #e8650e;
        }

        .members-table th:nth-child(6),
        .members-table td:nth-child(6) {
          min-width: 280px;
          text-align: center;
        }
        
        .instructions-box {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 12px;
          margin: 10px 0;
          border-radius: 4px;
        }
        
        .instructions-box strong {
          color: #1976d2;
        }
        
        .instructions-box small {
          display: block;
          margin-top: 4px;
          color: #555;
        }
        
        .member-name {
          font-weight: bold;
          color: #333;
        }
        
        .currency {
          color: #28a745;
          font-weight: 600;
        }
        
        .units-count {
          color: #007bff;
          font-weight: 600;
        }
        
        .percentage {
          color: #6f42c1;
          font-weight: 600;
        }
      `}</style>
      
      <div className="portfolio-builder-container">
        {/* Header */}
        <div className="builder-header">
          <h1>Investment Club – Unit Value Tracker</h1>
          <p>Build and manage your investment club portfolio with automatic unit calculations and Excel export functionality.</p>
        </div>

        {/* Portfolio Controls */}
        <div className="builder-controls">
          <div className="control-group">
            <label htmlFor="portfolio">Total Portfolio Value ($):</label>
            <input 
              type="number" 
              id="portfolio" 
              value={portfolioValue} 
              step="0.01"
              onChange={(e) => setPortfolioValue(parseFloat(e.target.value) || 0)}
            />
            <button className="btn btn-primary">Recalculate</button>
            <button 
              className="btn" 
              onClick={pullLiveBalance} 
              style={{background: '#28a745', color: 'white'}}
            >
              📊 Pull Live Balance
            </button>
          </div>

          <div className="control-group">
            <label htmlFor="memberName">Member Name:</label>
            <input 
              type="text" 
              id="memberName" 
              placeholder="Enter member name"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && document.getElementById('memberContribution').focus()}
            />
            <label htmlFor="memberContribution">Contribution ($):</label>
            <input 
              type="number" 
              id="memberContribution" 
              step="0.01" 
              placeholder="0.00"
              value={memberContribution}
              onChange={(e) => setMemberContribution(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addMember()}
            />
            <button className="btn btn-success" onClick={addMember}>Add Member</button>
          </div>

          {/* Unit Addition/Removal Instructions */}
          <div className="instructions-box">
            <strong>💡 Manage Units for Existing Members:</strong>
            <small><strong>Add:</strong> Use <strong>+$</strong> (dollar amount) or <strong>+U</strong> (unit count) buttons</small>
            <small><strong>Remove:</strong> Use <strong>-$</strong> (dollar amount) or <strong>-U</strong> (unit count) buttons</small>
            <small>⚠️ Removal requires confirmation and prevents negative balances</small>
          </div>

          {/* Live Balance Status */}
          {balanceStatus.show && (
            <div className={`balance-status ${balanceStatus.isError ? 'error' : ''}`}>
              <div className="status-info">
                <span>{balanceStatus.text}</span>
                {balanceStatus.details && <small>{balanceStatus.details}</small>}
              </div>
            </div>
          )}
        </div>

        {/* Unit Price Display */}
        <div className="unit-price-display">
          Current Unit Price: ${unitPrice.toFixed(4)}
        </div>

        {/* Summary Statistics */}
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-value">{members.length}</div>
            <div className="stat-label">Total Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${totalContributions.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="stat-label">Total Contributions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalUnits.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="stat-label">Total Units</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${avgContribution.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="stat-label">Average Contribution</div>
          </div>
        </div>

        {/* Members Table */}
        <div className="members-table-container">
          <table className="members-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Contribution ($)</th>
                <th>Units</th>
                <th>Current Value ($)</th>
                <th>% Ownership</th>
                <th>Add Units</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr className="no-members">
                  <td colSpan="7">No members added yet. Add your first member above to get started!</td>
                </tr>
              ) : (
                members.map(member => {
                  const currentValue = member.units * unitPrice;
                  const ownership = portfolioValue > 0 ? (currentValue / portfolioValue * 100).toFixed(2) : 0;
                  
                  return (
                    <tr key={member.id}>
                      <td><span className="member-name">{member.name}</span></td>
                      <td><span className="currency">${member.contribution.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></td>
                      <td><span className="units-count">{member.units.toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 4})}</span></td>
                      <td><span className="currency">${currentValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></td>
                      <td><span className="percentage">{ownership}%</span></td>
                      <td>
                        <div className="unit-controls">
                          <input 
                            type="number" 
                            id={`dollarAdd_${member.id}`}
                            placeholder="$" 
                            step="0.01" 
                            className="unit-input" 
                            title="Add/remove by dollar amount"
                          />
                          <button 
                            className="unit-btn dollar" 
                            onClick={() => addUnitsByDollar(member.id)} 
                            title="Add units by dollar amount"
                          >+$</button>
                          <button 
                            className="unit-btn dollar-remove" 
                            onClick={() => removeUnitsByDollar(member.id)} 
                            title="Remove units by dollar amount"
                          >-$</button>
                          <input 
                            type="number" 
                            id={`unitAdd_${member.id}`}
                            placeholder="#" 
                            step="0.01" 
                            className="unit-input" 
                            title="Add/remove by unit count"
                          />
                          <button 
                            className="unit-btn units" 
                            onClick={() => addUnitsByAmount(member.id)} 
                            title="Add specific number of units"
                          >+U</button>
                          <button 
                            className="unit-btn units-remove" 
                            onClick={() => removeUnitsByAmount(member.id)} 
                            title="Remove specific number of units"
                          >-U</button>
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn" 
                          style={{background: '#dc3545', color: 'white', padding: '4px 8px', fontSize: '0.8em'}} 
                          onClick={() => removeMember(member.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="actions-bar">
          <button className="btn btn-export" onClick={exportToExcel}>📤 Export to Excel</button>
          <button className="btn btn-primary">💾 Quick Save</button>
          <button className="btn" onClick={clearAll} style={{background: '#dc3545', color: 'white'}}>🗑️ Clear All</button>
        </div>
      </div>
    </>
  );
}