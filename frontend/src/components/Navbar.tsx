import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-md) var(--space-xl)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Link
        to="/"
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-primary)',
        }}
      >
        PulseBoard
      </Link>

      {user && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-lg)',
          }}
        >
          <Link
            to="/"
            style={{
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            Dashboard
          </Link>
          <Link
            to="/history"
            style={{
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            History
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              to="/admin"
              style={{
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
              }}
            >
              Admin
            </Link>
          )}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <span
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
