import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
        name: member.name || member.full_name || '',
        email: member.email || '',
        role: member.role || 'member',
        status: member.status || member.membership_status || 'pending_invite',
        totalUnits: member.totalUnits || member.current_units || 0,
        currentBalance: member.currentBalance || member.current_value || 0,
        totalContribution: member.totalContribution || member.total_contributions || 0
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
    if (!member) return;

    setSaving(true);
    try {
      const basicUpdatePromise = supabase
        .from('members')
        .update({
          full_name: formData.name,
          email: formData.email || null,
          role: formData.role,
          membership_status: formData.status
        })
        .eq('id', member.id);

      const financialUpdatePromise = supabase
        .from('member_accounts')
        .upsert(
          {
            member_id: member.id,
            member_name: formData.name,
            email: formData.email || null,
            current_units: formData.totalUnits,
            current_value: formData.currentBalance,
            total_contributions: formData.totalContribution
          },
          { onConflict: 'member_id' }
        );

      const [{ error: basicError }, { error: financialError }] = await Promise.all([
        basicUpdatePromise,
        financialUpdatePromise
      ]);

      if (basicError) throw basicError;
      if (financialError) throw financialError;

      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      alert('Failed to update member: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (!member) return;

    if (window.confirm(`Are you sure you want to change ${member.name || member.full_name}'s role to ${newRole}?`)) {
      try {
        const { error } = await supabase
          .from('members')
          .update({ role: newRole })
          .eq('id', member.id);

        if (error) {
          throw error;
        }

        setFormData({ ...formData, role: newRole });
        if (onSaved) onSaved();
      } catch (error) {
        alert('Failed to update role: ' + error.message);
      }
    }
  };

  if (!show || !member) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" role="dialog" aria-modal="true">
        <div className="app-card">
          <div className="app-card-header">
            <h5 className="app-card-title">
              <i className="fas fa-user-edit me-2"></i>
              Edit Member Profile
            </h5>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close" />
          </div>

          <div className="app-card-content">
            <div className="app-grid" style={{ gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <h6 className="border-bottom pb-2 mb-3">
                  <i className="fas fa-user me-1"></i>
                  Basic Information
                </h6>
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className={`app-input ${errors.name ? 'app-input-invalid' : ''}`}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter full name"
                />
                {errors.name && <div className="app-text-destructive">{errors.name}</div>}
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className={`app-input ${errors.email ? 'app-input-invalid' : ''}`}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address"
                />
                {errors.email && <div className="app-text-destructive">{errors.email}</div>}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <h6 className="border-bottom pb-2 mb-3 mt-4">
                  <i className="fas fa-shield-alt me-1"></i>
                  Access & Permissions
                </h6>
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <label className="form-label">Role</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    className="app-input"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button 
                    className="app-btn app-btn-outline app-btn-sm"
                    onClick={() => handleRoleChange(formData.role === 'admin' ? 'member' : 'admin')}
                    title={`Change to ${formData.role === 'admin' ? 'Member' : 'Admin'}`}
                  >
                    <i className="fas fa-exchange-alt"></i>
                  </button>
                </div>
                <div className="app-text-muted">
                  <strong>Member:</strong> View own account only | <strong>Admin:</strong> Full system access
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <label className="form-label">Account Status</label>
                <select
                  className="app-input"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pending_invite">Pending Invite</option>
                  <option value="invited">Invited</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <h6 className="border-bottom pb-2 mb-3 mt-4">
                  <i className="fas fa-dollar-sign me-1"></i>
                  Financial Information
                </h6>
              </div>

              <div style={{ flex: '1 1 30%' }}>
                <label className="form-label">Total Units</label>
                <input
                  type="number"
                  step="0.0001"
                  className={`app-input ${errors.totalUnits ? 'app-input-invalid' : ''}`}
                  value={formData.totalUnits}
                  onChange={(e) => setFormData({...formData, totalUnits: parseFloat(e.target.value) || 0})}
                />
                {errors.totalUnits && <div className="app-text-destructive">{errors.totalUnits}</div>}
              </div>

              <div style={{ flex: '1 1 30%' }}>
                <label className="form-label">Current Balance</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    className={`app-input ${errors.currentBalance ? 'app-input-invalid' : ''}`}
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({...formData, currentBalance: parseFloat(e.target.value) || 0})}
                  />
                </div>
                {errors.currentBalance && <div className="app-text-destructive">{errors.currentBalance}</div>}
              </div>

              <div style={{ flex: '1 1 30%' }}>
                <label className="form-label">Total Contribution</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="app-input"
                    value={formData.totalContribution}
                    onChange={(e) => setFormData({...formData, totalContribution: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div className="app-card">
                  <div className="app-card-content">
                    <div style={{ display: 'flex', gap: '1rem', textAlign: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div className="fw-bold text-primary">{formData.totalUnits.toFixed(4)}</div>
                        <small className="app-text-muted">Units</small>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="fw-bold text-success">${formData.currentBalance.toFixed(2)}</div>
                        <small className="app-text-muted">Portfolio Value</small>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="fw-bold text-info">${formData.totalContribution.toFixed(2)}</div>
                        <small className="app-text-muted">Contributions</small>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="fw-bold text-warning">
                          {formData.totalUnits > 0 ? `$${(formData.currentBalance / formData.totalUnits).toFixed(2)}` : '$0.00'}
                        </div>
                        <small className="app-text-muted">Unit Value</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="app-card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="app-btn app-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="app-btn app-btn-primary" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-inline" role="status" />
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
