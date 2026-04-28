import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const THEME_KEY = 'kalibrasi_theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    // Default to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return; // User has explicit preference, skip system listener

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => setTheme(e.matches ? 'light' : 'dark');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;

    // Add transition class to coordinate all elements simultaneously
    root.classList.add('theme-transition');

    // Toggle the theme
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    // Remove transition class after animation completes (slightly longer than CSS 250ms)
    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
