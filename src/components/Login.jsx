import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const legacyMemberId = params.get('memberId');
  const rawRedirectParam = params.get('redirect');
  const decodedRedirect = rawRedirectParam
    ? decodeURIComponent(rawRedirectParam)
    : legacyMemberId
    ? `/member/claim?memberId=${encodeURIComponent(legacyMemberId)}`
    : null;
  const safeRedirect = decodedRedirect && decodedRedirect.startsWith('/') ? decodedRedirect : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [forgotPasswordState, setForgotPasswordState] = useState({ loading: false, message: '', error: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const wasSuccessful = !error;

      // Log the login attempt (success or failure) – non-blocking
      try {
        await supabase.from('member_login_logs').insert({
          email,
          was_successful: wasSuccessful,
          failure_reason: wasSuccessful ? null : error?.message ?? null,
          ip_address: null,
          city: null,
          region: null,
          country: null,
          is_active_member: null,
          member_account_id: null,
        });
      } catch (logError) {
        console.warn('Failed to log login attempt', logError);
      }

      if (error) {
        throw error;
      }

      const user = data.user;
      if (!user) {
        throw new Error('No user returned from login');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const defaultDestination = !profileError && profile?.role === 'admin'
        ? '/admin/dashboard'
        : '/member/dashboard';

      const destination = safeRedirect || defaultDestination;

      navigate(destination, { replace: true });
    } catch (error) {
      setLoginError(error.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setForgotPasswordState({ loading: false, message: '', error: 'Enter your email first so we know where to send the reset link.' });
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback`;
    setForgotPasswordState({ loading: true, message: '', error: '' });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      setForgotPasswordState({
        loading: false,
        message: 'Check your email for a password reset link. Use it to set (or reset) your password, then return here to log in.',
        error: ''
      });
    } catch (error) {
      setForgotPasswordState({
        loading: false,
        message: '',
        error: error.message || 'Unable to start password reset. Try again in a moment.',
      });
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
              <label
                htmlFor="email"
                className="block text-sm font-medium text-default mb-1"
              >
                Email address
              </label>
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-default mb-1"
              >
                Password
              </label>
              <input
                type="password"
                className="input w-full"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
              <div className="flex items-center justify-between mt-2 text-xs">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordState.loading}
                >
                  {forgotPasswordState.loading ? 'Sending reset link…' : 'Forgot your password?'}
                </button>
                {safeRedirect && (
                  <span className="text-muted">Redirecting to your invite after login</span>
                )}
              </div>
            </div>

            {loginError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {loginError}
              </div>
            )}

            {forgotPasswordState.message && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                {forgotPasswordState.message}
              </div>
            )}

            {forgotPasswordState.error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {forgotPasswordState.error}
              </div>
            )}

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

          <div className="text-center mt-4 space-y-2">
            <small className="block text-muted">
              If you were pre-invited and never set a password, use “Forgot password” with the email
              on file to create one, then log in and return to your claim link.
            </small>
            <small className="block text-muted">
              This app uses your Supabase login. Contact an admin if you don't have access yet.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
