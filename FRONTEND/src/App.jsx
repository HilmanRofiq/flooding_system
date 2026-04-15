import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Route - Homepage with flood monitoring dashboard */}
      <Route path="/" element={<HomePage />} />

      {/* Catch-all redirect to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}
