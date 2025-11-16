import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function MemberEditModal({ member, show, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'member',
    status: 'pending_invite',
    totalUnits: 0,
    currentBalance: 0,
    totalContribution: 0
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        role: member.role || 'member',
        status: member.status || 'pending_invite',
        totalUnits: member.totalUnits || 0,
        currentBalance: member.currentBalance || 0,
        totalContribution: member.totalContribution || 0
      });
    }
  }, [member]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.totalUnits < 0) {
      newErrors.totalUnits = 'Units cannot be negative';
    }
    
    if (formData.currentBalance < 0) {
      newErrors.currentBalance = 'Balance cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await base44.entities.User.update(member.id, formData);
      onSaved();
      onClose();
    } catch (error) {
      alert('Failed to update member: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (window.confirm(`Are you sure you want to change ${member.name}'s role to ${newRole}?`)) {
      try {
        await base44.entities.User.update(member.id, { role: newRole });
        setFormData({ ...formData, role: newRole });
        onSaved();
      } catch (error) {
        alert('Failed to update role: ' + error.message);
      }
    }
  };

  if (!show || !member) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-user-edit me-2"></i>
              Edit Member Profile
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <div className="row g-3">
              {/* Basic Information */}
              <div className="col-12">
                <h6 className="border-bottom pb-2 mb-3">
                  <i className="fas fa-user me-1"></i>
                  Basic Information
                </h6>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter full name"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              {/* Role and Status Management */}
              <div className="col-12">
                <h6 className="border-bottom pb-2 mb-3 mt-4">
                  <i className="fas fa-shield-alt me-1"></i>
                  Access & Permissions
                </h6>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Role</label>
                <div className="d-flex gap-2">
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button 
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => handleRoleChange(formData.role === 'admin' ? 'member' : 'admin')}
                    title={`Change to ${formData.role === 'admin' ? 'Member' : 'Admin'}`}
                  >
                    <i className="fas fa-exchange-alt"></i>
                  </button>
                </div>
                <div className="form-text">
                  <strong>Member:</strong> View own account only | <strong>Admin:</strong> Full system access
                </div>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Account Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pending_invite">Pending Invite</option>
                  <option value="invited">Invited</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Financial Information */}
              <div className="col-12">
                <h6 className="border-bottom pb-2 mb-3 mt-4">
                  <i className="fas fa-dollar-sign me-1"></i>
                  Financial Information
                </h6>
              </div>
              
              <div className="col-md-4">
                <label className="form-label">Total Units</label>
                <input
                  type="number"
                  step="0.0001"
                  className={`form-control ${errors.totalUnits ? 'is-invalid' : ''}`}
                  value={formData.totalUnits}
                  onChange={(e) => setFormData({...formData, totalUnits: parseFloat(e.target.value) || 0})}
                />
                {errors.totalUnits && <div className="invalid-feedback">{errors.totalUnits}</div>}
              </div>
              
              <div className="col-md-4">
                <label className="form-label">Current Balance</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-control ${errors.currentBalance ? 'is-invalid' : ''}`}
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({...formData, currentBalance: parseFloat(e.target.value) || 0})}
                  />
                </div>
                {errors.currentBalance && <div className="invalid-feedback">{errors.currentBalance}</div>}
              </div>
              
              <div className="col-md-4">
                <label className="form-label">Total Contribution</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.totalContribution}
                    onChange={(e) => setFormData({...formData, totalContribution: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              {/* Member Statistics */}
              <div className="col-12">
                <div className="alert alert-light">
                  <div className="row text-center">
                    <div className="col-md-3">
                      <div className="fw-bold text-primary">{formData.totalUnits.toFixed(4)}</div>
                      <small className="text-muted">Units</small>
                    </div>
                    <div className="col-md-3">
                      <div className="fw-bold text-success">${formData.currentBalance.toFixed(2)}</div>
                      <small className="text-muted">Portfolio Value</small>
                    </div>
                    <div className="col-md-3">
                      <div className="fw-bold text-info">${formData.totalContribution.toFixed(2)}</div>
                      <small className="text-muted">Contributions</small>
                    </div>
                    <div className="col-md-3">
                      <div className="fw-bold text-warning">
                        {formData.totalUnits > 0 ? `$${(formData.currentBalance / formData.totalUnits).toFixed(2)}` : '$0.00'}
                      </div>
                      <small className="text-muted">Unit Value</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-1"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}