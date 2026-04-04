import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { ApiError } from '../../lib/api';

export const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect back to the page they were trying to visit, or /profile
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) { setError('Phone number is required'); return; }
    if (!password) { setError('Password is required'); return; }

    setLoading(true);
    try {
      await login(phone.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/15 shadow-sm p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold font-headline text-primary tracking-tight">SevaSetu</h1>
            <p className="text-on-surface-variant text-sm">Sign in to your account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-error-container/40 border border-error/30 text-error rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant/40 bg-surface-container text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-outline-variant/40 bg-surface-container text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full primary-gradient text-on-primary py-3 rounded-xl font-bold text-sm shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
