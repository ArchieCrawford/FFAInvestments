import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

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
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('invite_token', token)
        .eq('membership_status', 'invited')
        .single();

      if (error || !data) {
        setError('Invalid or expired invitation link');
      } else {
        setInviteData(data);
      }
    } catch (err) {
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

    if (!inviteData) {
      alert('Invitation data missing');
      return;
    }

    setSubmitting(true);

    try {
      let userId = null;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: formData.password
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: inviteData.email,
            password: formData.password
          });

          if (signInError || !signInData.user) {
            throw signInError || new Error('Failed to log in existing account');
          }

          userId = signInData.user.id;
        } else {
          throw signUpError;
        }
      } else {
        if (!signUpData.user) {
          throw new Error('Sign up succeeded but no user returned');
        }
        userId = signUpData.user.id;
      }

      const { error: updateError } = await supabase
        .from('members')
        .update({
          membership_status: 'active',
          invite_token: null,
          activated_at: new Date().toISOString(),
          profile_user_id: userId
        })
        .eq('id', inviteData.id);

      if (updateError) {
        throw updateError;
      }

      alert('Account activated successfully! Welcome to FFA Investments!');

      if (inviteData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/member/dashboard');
      }
    } catch (err) {
      alert('Failed to activate account: ' + (err && err.message ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f9fc' }}>
        <div className="spinner-page" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f9fc' }}>
        <div className="app-card" style={{ width: 400 }}>
          <div className="app-card-content text-center">
            <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h4>Invalid Invitation</h4>
            <p className="app-text-muted">{error}</p>
            <a href="/login" className="app-btn app-btn-primary" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f9fc' }}>
      <div className="app-card" style={{ width: 450 }}>
        <div className="app-card-content">
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <i className="fas fa-dollar-sign text-primary fs-1 mb-3"></i>
            <h2 className="fw-bold">Welcome to FFA Investments</h2>
            <p className="app-text-muted">Complete your account setup</p>
          </div>

          <div className="app-alert app-alert-info">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Hello {inviteData?.name || inviteData?.member_name}!</strong><br />
            You've been invited to join as a <strong>{inviteData?.role || 'member'}</strong>.
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="app-text-muted">Email Address</label>
              <input
                type="email"
                className="app-input"
                value={inviteData?.email || ''}
                disabled
              />
              <div className="app-text-muted">This email is associated with your invitation</div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label className="app-text-muted">Create Password</label>
              <input
                type="password"
                className="app-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter a secure password"
                minLength={6}
                required
              />
              <div className="app-text-muted">Password must be at least 6 characters long</div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label className="app-text-muted">Confirm Password</label>
              <input
                type="password"
                className="app-input"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                minLength={6}
                required
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                  required
                />
                <span>
                  I agree to the <a href="#">Terms and Conditions</a> and <a href="#">Privacy Policy</a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="app-btn app-btn-primary w-100"
              style={{ marginBottom: '0.75rem' }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-inline me-2" role="status" />
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

          <div style={{ textAlign: 'center' }}>
            <small className="app-text-muted">
              Need help? Contact your administrator
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
