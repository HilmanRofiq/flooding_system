import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import DeviceManagementPanel from '../panels/DeviceManagementPanel';
import ExportCSVPanel from '../panels/ExportCSVPanel';

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('devices');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'devices':
        return <DeviceManagementPanel />;
      case 'export':
        return <ExportCSVPanel />;
      default:
        return <DeviceManagementPanel />;
    }
  };

  const linkClass = (tab) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left cursor-pointer ${
      activeTab === tab
        ? 'bg-badge-blue-bg text-badge-blue-text'
        : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Navbar */}
      <nav className="bg-nav-bg backdrop-blur-xl border-b border-nav-border sticky top-0 z-50 shadow-sm" id="admin-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-lg font-extrabold text-text-primary hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-base">
              📡
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Kalibrasi</span>
          </Link>

          {/* Admin badge + User Info */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-badge-amber-bg text-badge-amber-text border border-badge-amber-border">
              🛡 Admin Panel
            </span>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              id="theme-toggle-admin"
              className="w-9 h-9 rounded-lg bg-surface-card border border-border-default flex items-center justify-center text-base hover:bg-surface-card-hover hover:border-border-hover transition-all duration-200 active:scale-90 cursor-pointer"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-text-primary">{user?.name || 'Admin'}</div>
              <div className="text-[0.7rem] text-text-muted">{user?.email}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-sm font-bold text-white">
              {getInitials(user?.name)}
            </div>
            <button
              onClick={handleLogout}
              id="logout-btn"
              className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-1 max-md:flex-col">
        {/* Sidebar */}
        <aside className="w-[260px] bg-surface-card border-r border-border-default p-4 flex-shrink-0 max-md:w-full max-md:border-r-0 max-md:border-b max-md:p-3" id="admin-sidebar">
          {/* Navigation */}
          <div className="mb-6">
            <div className="text-[0.6875rem] font-bold uppercase tracking-widest text-text-muted px-3 mb-2">
              Management
            </div>
            <button
              className={linkClass('devices')}
              onClick={() => setActiveTab('devices')}
              id="nav-devices"
            >
              <span className="text-lg w-5 text-center">📱</span>
              Device Management
            </button>
          </div>

          <div className="mb-6">
            <div className="text-[0.6875rem] font-bold uppercase tracking-widest text-text-muted px-3 mb-2">
              Tools
            </div>
            <button
              className={linkClass('export')}
              onClick={() => setActiveTab('export')}
              id="nav-export"
            >
              <span className="text-lg w-5 text-center">📤</span>
              Export CSV
            </button>
          </div>

          {/* Quick link to homepage */}
          <div className="mt-auto pt-4 border-t border-border-default">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-all duration-200 w-full"
              id="nav-homepage"
            >
              <span className="text-lg w-5 text-center">🏠</span>
              View Homepage
            </Link>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-[calc(100vh-64px)] max-md:max-h-none">
          {renderPanel()}
        </main>
      </div>
    </div>
  );
}
