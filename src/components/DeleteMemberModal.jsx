import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function DeleteMemberModal({ member, show, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== member?.name) {
      alert('Please type the member name exactly to confirm deletion');
      return;
    }

    setDeleting(true);
    try {
      await base44.entities.User.delete(member.id);
      onDeleted();
      onClose();
      setConfirmText('');
    } catch (error) {
      alert('Failed to delete member: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!show || !member) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Delete Member Account
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <div className="alert alert-danger">
              <i className="fas fa-warning me-2"></i>
              <strong>Warning:</strong> This action cannot be undone!
            </div>

            <p>You are about to permanently delete the following member:</p>
            
            <div className="card">
              <div className="card-body">
                <h6 className="card-title">{member.name}</h6>
                <div className="row">
                  <div className="col-sm-6">
                    <small className="text-muted">Email:</small><br/>
                    <span>{member.email || 'Not provided'}</span>
                  </div>
                  <div className="col-sm-6">
                    <small className="text-muted">Role:</small><br/>
                    <span className={`badge ${member.role === 'admin' ? 'bg-primary' : 'bg-info'}`}>
                      {member.role}
                    </span>
                  </div>
                </div>
                <hr/>
                <div className="row">
                  <div className="col-sm-4">
                    <small className="text-muted">Portfolio Value:</small><br/>
                    <strong className="text-success">{formatCurrency(member.currentBalance || 0)}</strong>
                  </div>
                  <div className="col-sm-4">
                    <small className="text-muted">Total Units:</small><br/>
                    <strong>{member.totalUnits?.toFixed(4) || '0.0000'}</strong>
                  </div>
                  <div className="col-sm-4">
                    <small className="text-muted">Status:</small><br/>
                    <span className={`badge ${
                      member.status === 'active' ? 'bg-success' : 
                      member.status === 'invited' ? 'bg-warning' : 'bg-secondary'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h6>What will be deleted:</h6>
              <ul className="list-unstyled">
                <li><i className="fas fa-check text-danger me-2"></i>Member profile and account information</li>
                <li><i className="fas fa-check text-danger me-2"></i>All portfolio timeline history</li>
                <li><i className="fas fa-check text-danger me-2"></i>Investment records and performance data</li>
                <li><i className="fas fa-check text-danger me-2"></i>Access credentials and permissions</li>
              </ul>
            </div>

            <div className="mt-4">
              <label className="form-label fw-bold">
                Type "<code>{member.name}</code>" to confirm deletion:
              </label>
              <input
                type="text"
                className="form-control"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${member.name}" here`}
                autoComplete="off"
              />
              <div className="form-text">
                This confirms you understand the consequences of deleting this member.
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={handleDelete}
              disabled={deleting || confirmText !== member.name}
            >
              {deleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
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