import { useState, useEffect } from 'react';
import { api, Pulse } from '../api/client';

export function History() {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyHistory(90);
      setPulses(data.pulses);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getMoodLabel = (m: number) => {
    const labels = ['😔', '😕', '😐', '🙂', '😊'];
    return labels[m - 1];
  };

  return (
    <div
      style={{
        maxWidth: '800px',
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
        My History
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
            onClick={loadHistory}
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
      ) : pulses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            No pulses yet
          </span>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 'var(--space-md)',
          }}
        >
          {pulses.map((pulse) => (
            <div
              key={pulse.id}
              style={{
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-sm)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {pulse.day}
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                  }}
                >
                  {getMoodLabel(pulse.mood)}
                </span>
              </div>
              {pulse.note && (
                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-sm)',
                    marginBottom: 'var(--space-sm)',
                  }}
                >
                  {pulse.note}
                </p>
              )}
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                {new Date(pulse.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
