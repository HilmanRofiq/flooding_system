import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/api';

export default function AdminLoginPage() {
  const { isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.login(email, password);

      // Check if user is admin
      if (!result.data.user.isAdmin) {
        setError('Access denied. Only administrators can login here.');
        setLoading(false);
        return;
      }

      login(result.data.user, result.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-surface-input border border-border-default rounded-lg text-text-primary text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-15 bg-blue-500 -top-[200px] -right-[200px] animate-float" />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-15 bg-cyan-400 -bottom-[200px] -left-[200px] animate-float-delayed" />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-15 bg-blue-700 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-delayed-2" />
      </div>

      {/* Theme toggle - floating */}
      <button
        onClick={toggleTheme}
        id="theme-toggle-login"
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-xl bg-surface-card border border-border-default flex items-center justify-center text-lg hover:bg-surface-card-hover hover:border-border-hover transition-all duration-200 active:scale-90 cursor-pointer"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-surface-card backdrop-blur-3xl border border-border-default rounded-2xl p-6 sm:p-10 shadow-2xl">
        {/* Back to Home link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-blue-500 transition-colors mb-6"
          id="back-to-home"
        >
          ← Kembali ke Homepage
        </Link>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-2xl">
            🛡
          </div>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Admin Panel
          </span>
        </div>

        {/* Title */}
        <h2 className="text-center text-xl font-bold text-text-primary mb-1">
          Admin Login
        </h2>
        <p className="text-center text-text-muted text-sm mb-6 sm:mb-8">
          Sign in to manage devices and export sensor data
        </p>

        {/* Error Alert */}
        {error && (
          <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-red-bg text-badge-red-text border border-badge-red-border" id="auth-error">
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} id="login-form">
          <div className="mb-5">
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className={inputClass}
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className={inputClass}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(51,120,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            id="login-submit"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              '🔐 Sign In as Admin'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-text-dim">
          Only administrators can access this area.
        </div>
      </div>
    </div>
  );
}
