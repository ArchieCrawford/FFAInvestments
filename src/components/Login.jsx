import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Use actual authentication
      const user = await base44.auth.login(email, password);
      window.location.reload();
    } catch (error) {
      alert('Login failed: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="card shadow-lg w-full max-w-md mx-4">
        <div className="p-6">
          <div className="text-center mb-6">
            <i className="fas fa-dollar-sign text-primary text-4xl mb-3"></i>
            <h2 className="text-2xl font-bold text-default">FFA Investments</h2>
            <p className="text-muted mt-1">Investment Club Portal</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-default mb-1">Email address</label>
              <input
                type="email"
                className="input w-full"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-default mb-1">Password</label>
              <input
                type="password"
                className="input w-full"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-inline mr-2" role="status"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="text-center mt-4">
            <small className="text-muted">
              <strong>Admin Login:</strong><br/>
              admin@ffa.com / admin123<br/>
              archie.crawford1@gmail.com / archie123
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}