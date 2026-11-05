import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function Admin() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<{
    day: string;
    postsToday: number;
    averageMoodToday: number | null;
    totalUsers: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }
    loadSummary();
  }, [user]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminSummary();
      setSummary(data);
    } catch (err: any) {
      if (err.error?.code === 'FORBIDDEN') {
        setError('Access denied');
      } else {
        setError('Failed to load summary');
      }
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'var(--space-xl)',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        Admin Dashboard
      </h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            Loading...
          </span>
        </div>
      ) : error ? (
        <div>
          <div
            style={{
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
            }}
            role="alert"
          >
            {error}
          </div>
          <button
            onClick={loadSummary}
            style={{
              padding: 'var(--space-md) var(--space-xl)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-xl)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-2xl)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Date
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
                marginBottom: 0,
              }}
            >
              {summary?.day}
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-2xl)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Posts Today
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary)',
                marginBottom: 0,
              }}
            >
              {summary?.postsToday}
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-2xl)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Average Mood Today
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-success)',
                marginBottom: 0,
              }}
            >
              {summary?.averageMoodToday !== null
                ? summary!.averageMoodToday.toFixed(1)
                : 'N/A'}
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-2xl)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Total Users
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
                marginBottom: 0,
              }}
            >
              {summary?.totalUsers}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
