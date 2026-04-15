import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const SESSION_KEY = 'kalibrasi_session';
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        const elapsed = Date.now() - session.loginTime;

        if (elapsed < SESSION_DURATION) {
          setUser(session.user);
          setToken(session.token);

          // Set a timeout to auto-logout when 1 hour expires
          const remaining = SESSION_DURATION - elapsed;
          const timer = setTimeout(() => {
            logout();
          }, remaining);

          setLoading(false);
          return () => clearTimeout(timer);
        } else {
          // Session expired
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (e) {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData, authToken) => {
    const session = {
      user: userData,
      token: authToken,
      loginTime: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(userData);
    setToken(authToken);

    // Auto-logout after 1 hour
    setTimeout(() => {
      logout();
    }, SESSION_DURATION);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
