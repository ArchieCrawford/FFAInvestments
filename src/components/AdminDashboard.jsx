import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalAUM: 0,
    activeAccounts: 0,
    unitPrice: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const members = await base44.entities.User.list();
      const timeline = await base44.entities.Timeline.getAll();
      
      const totalAUM = members.reduce((sum, member) => sum + (member.currentBalance || 0), 0);
      const activeAccounts = members.filter(m => m.status === 'active').length;
      
      setStats({
        totalMembers: members.length,
        totalAUM: totalAUM,
        activeAccounts: activeAccounts,
        unitPrice: timeline.length > 0 ? (totalAUM / members.reduce((sum, m) => sum + (m.totalUnits || 0), 0)) : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <div>
          <button className="btn btn-primary me-2">+ Add Member</button>
          <button className="btn btn-outline-primary">+ Record Transaction</button>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card-stat blue">
            <div>
              <div className="fw-bold">Assets Under Management</div>
              <div className="fs-4">{formatCurrency(stats.totalAUM)}</div>
            </div>
            <i className="fas fa-dollar-sign fa-2x"></i>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-stat">
            <div>
              <div className="fw-bold">Total Members</div>
              <div className="fs-4">{stats.totalMembers}</div>
            </div>
            <i className="fas fa-user fa-2x text-muted"></i>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-stat">
            <div>
              <div className="fw-bold">Active Accounts</div>
              <div className="fs-4">{stats.activeAccounts}</div>
            </div>
            <i className="fas fa-wallet fa-2x text-muted"></i>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-stat">
            <div>
              <div className="fw-bold">Unit Price</div>
              <div className="fs-4">
                {formatCurrency(stats.unitPrice)} 
                <span className="badge bg-success text-white ms-2">Current</span>
              </div>
            </div>
            <i className="fas fa-chart-line fa-2x text-muted"></i>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="task-box mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <i className="fas fa-clock text-warning me-2"></i>
            <strong>Today's Tasks</strong>
            <div className="text-muted mt-1">
              <i className="fas fa-info-circle text-primary me-1"></i> Unit price not finalized for current period
            </div>
          </div>
          <button className="btn btn-outline-secondary">Finalize Now <i className="fas fa-arrow-right ms-2"></i></button>
        </div>
      </div>

      {/* Transactions and Quick Actions */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="task-box">
            <h5>Recent Transactions</h5>
            <p className="text-muted">No recent transactions</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="task-box">
            <h5>Quick Actions</h5>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary flex-fill">
                <i className="fas fa-users me-2"></i> Manage Members
              </button>
              <button className="btn btn-outline-primary flex-fill">
                <i className="fas fa-wallet me-2"></i> Manage Accounts
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}