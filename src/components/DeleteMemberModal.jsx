import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DeleteMemberModal({ member, show, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== member?.name && confirmText !== member?.full_name) {
      alert('Please type the member name exactly to confirm deletion');
      return;
    }

    setDeleting(true);
    try {
      const memberId = member.id;

      await supabase.from('member_unit_transactions').delete().eq('member_id', memberId);
      await supabase.from('member_monthly_balances').delete().eq('member_id', memberId);
      await supabase.from('member_accounts').delete().eq('member_id', memberId);

      const { error: memberError } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (memberError) {
        throw memberError;
      }

      if (onDeleted) onDeleted();
      onClose();
      setConfirmText('');
    } catch (error) {
      alert('Failed to delete member: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  if (!show || !member) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const displayName = member.name || member.full_name || '';

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" role="dialog" aria-modal="true">
        <div className="app-card">
          <div className="app-card-header app-card-danger">
            <h5 className="app-card-title">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Delete Member Account
            </h5>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close" />
          </div>

          <div className="app-card-content">
            <div className="app-alert app-alert-destructive">
              <i className="fas fa-warning me-2"></i>
              <strong>Warning:</strong> This action cannot be undone!
            </div>

            <p>You are about to permanently delete the following member:</p>

            <div className="app-card">
              <div className="app-card-content">
                <h6 className="app-heading-md">{displayName}</h6>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <small className="app-text-muted">Email:</small><br/>
                    <span>{member.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <small className="app-text-muted">Role:</small><br/>
                    <span className="app-pill">{member.role || 'member'}</span>
                  </div>
                </div>
                <hr/>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div>
                    <small className="app-text-muted">Portfolio Value:</small><br/>
                    <strong className="text-success">
                      {formatCurrency(member.currentBalance ?? member.current_value ?? 0)}
                    </strong>
                  </div>
                  <div>
                    <small className="app-text-muted">Total Units:</small><br/>
                    <strong>
                      {(member.totalUnits ?? member.current_units ?? 0).toFixed(4)}
                    </strong>
                  </div>
                  <div>
                    <small className="app-text-muted">Status:</small><br/>
                    <span className="app-pill">
                      {member.status || member.membership_status || 'unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h6>What will be deleted:</h6>
              <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                <li><i className="fas fa-check text-danger me-2"></i>Member profile and account information</li>
                <li><i className="fas fa-check text-danger me-2"></i>All portfolio timeline and balance history</li>
                <li><i className="fas fa-check text-danger me-2"></i>Investment records and performance data</li>
                <li><i className="fas fa-check text-danger me-2"></i>Access credentials and permissions</li>
              </ul>
            </div>

            <div className="mt-4">
              <label className="fw-bold">
                Type "<code>{displayName}</code>" to confirm deletion:
              </label>
              <input
                type="text"
                className="app-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${displayName}" here`}
                autoComplete="off"
              />
              <div className="app-text-muted">
                This confirms you understand the consequences of deleting this member.
              </div>
            </div>
          </div>

          <div className="app-card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="app-btn app-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="app-btn app-btn-destructive"
              onClick={handleDelete}
              disabled={deleting || confirmText !== displayName}
            >
              {deleting ? (
                <>
                  <span className="spinner-inline" role="status" />
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash me-1"></i>
                  Delete Member Permanently
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
