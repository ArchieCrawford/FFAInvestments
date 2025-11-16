import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    validateInvite();
  }, [token]);

  const validateInvite = async () => {
    try {
      const members = JSON.parse(localStorage.getItem('members') || '[]');
      const member = members.find(m => m.inviteToken === token && m.status === 'invited');
      
      if (!member) {
        setError('Invalid or expired invitation link');
      } else {
        setInviteData(member);
      }
    } catch (error) {
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (!formData.agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setSubmitting(true);

    try {
      // Update member status and set password
      await base44.entities.User.update(inviteData.id, {
        status: 'active',
        password: formData.password, // In real app, this would be hashed
        inviteToken: null,
        activatedAt: new Date().toISOString()
      });

      // Auto-login the user
      localStorage.setItem('user', JSON.stringify({
        ...inviteData,
        status: 'active'
      }));

      alert('Account activated successfully! Welcome to FFA Investments!');
      
      // Redirect based on role
      if (inviteData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(`/member/${inviteData.id}/dashboard`);
      }
    } catch (error) {
      alert('Failed to activate account: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f7f9fc' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f7f9fc' }}>
        <div className="card shadow-lg" style={{ width: '400px' }}>
          <div className="card-body p-4 text-center">
            <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h4>Invalid Invitation</h4>
            <p className="text-muted">{error}</p>
            <a href="/login" className="btn btn-primary">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f7f9fc' }}>
      <div className="card shadow-lg" style={{ width: '450px' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <i className="fas fa-dollar-sign text-primary fs-1 mb-3"></i>
            <h2 className="fw-bold">Welcome to FFA Investments</h2>
            <p className="text-muted">Complete your account setup</p>
          </div>

          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Hello {inviteData?.name}!</strong><br/>
            You've been invited to join as a <strong>{inviteData?.role}</strong>.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={inviteData?.email || ''}
                disabled
              />
              <div className="form-text">This email is associated with your invitation</div>
            </div>

            <div className="mb-3">
              <label className="form-label">Create Password</label>
              <input
                type="password"
                className="form-control"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter a secure password"
                minLength="6"
                required
              />
              <div className="form-text">Password must be at least 6 characters long</div>
            </div>

            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Confirm your password"
                minLength="6"
                required
              />
            </div>

            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData({...formData, agreedToTerms: e.target.checked})}
                  required
                />
                <label className="form-check-label" htmlFor="agreedToTerms">
                  I agree to the <a href="#" className="text-decoration-none">Terms and Conditions</a> and <a href="#" className="text-decoration-none">Privacy Policy</a>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100 mb-3"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Activating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-1"></i>
                  Activate My Account
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <small className="text-muted">
              Need help? Contact your administrator
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}