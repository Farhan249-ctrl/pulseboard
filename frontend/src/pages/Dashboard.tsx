import React, { useState, useEffect } from 'react';
import { api, Pulse } from '../api/client';
import { ApiError } from '../api/client';

export function Dashboard() {
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [postedToday, setPostedToday] = useState(false);
  const [feed, setFeed] = useState<Pulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const data = await api.getTodayFeed();
      setFeed(data.pulses);
    } catch (err) {
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mood === null) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.postPulse({ mood, note: note || undefined });
      setPostedToday(true);
      await loadFeed();
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.error?.code === 'ALREADY_POSTED') {
        setPostedToday(true);
      } else {
        setError(apiError.error?.message || 'Failed to post pulse');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getMoodColor = (m: number) => {
    const colors = [
      'var(--mood-1)',
      'var(--mood-2)',
      'var(--mood-3)',
      'var(--mood-4)',
      'var(--mood-5)',
    ];
    return colors[m - 1];
  };

  const getMoodLabel = (m: number) => {
    const labels = ['😔', '😕', '😐', '🙂', '😊'];
    return labels[m - 1];
  };

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
        Dashboard
      </h1>

      {/* Post Pulse Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-2xl)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: 'var(--space-2xl)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          {postedToday ? "You've posted today" : "Post today's pulse"}
        </h2>

        {postedToday ? (
          <div
            style={{
              padding: 'var(--space-xl)',
              backgroundColor: 'var(--color-primary-light)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 0 }}>
              Come back tomorrow to post another pulse!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--space-md)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                How are you feeling?
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-md)',
                  flexWrap: 'wrap',
                }}
              >
                {[1, 2, 3, 4, 5].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    aria-label={`Mood ${m}: ${getMoodLabel(m)}`}
                    style={{
                      flex: '1',
                      minWidth: '60px',
                      padding: 'var(--space-lg)',
                      borderRadius: 'var(--radius-lg)',
                      border: '2px solid',
                      borderColor:
                        mood === m ? getMoodColor(m) : 'var(--color-border)',
                      backgroundColor:
                        mood === m ? getMoodColor(m) : 'var(--color-surface)',
                      color: mood === m ? 'white' : 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-2xl)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {getMoodLabel(m)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label
                htmlFor="note"
                style={{
                  display: 'block',
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Note (optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                maxLength={280}
                rows={3}
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-base)',
                  resize: 'vertical',
                }}
              />
              <div
                style={{
                  textAlign: 'right',
                  fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
                  marginTop: 'var(--space-xs)',
                }}
              >
                {note.length}/280
              </div>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: 'var(--color-error-bg)',
                  color: 'var(--color-error)',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-lg)',
                  fontSize: 'var(--font-size-sm)',
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || mood === null}
              style={{
                padding: 'var(--space-md) var(--space-xl)',
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  mood === null ? 'var(--color-border)' : 'var(--color-primary)',
                color: 'white',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor:
                  submitting || mood === null ? 'not-allowed' : 'pointer',
                opacity: submitting || mood === null ? 0.7 : 1,
              }}
            >
              {submitting ? 'Posting...' : 'Post Pulse'}
            </button>
          </form>
        )}
      </div>

      {/* Team Today Feed */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-2xl)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          Team Today
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Loading...
            </span>
          </div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              No pulses posted yet today
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 'var(--space-md)',
            }}
          >
            {feed.map((pulse) => (
              <div
                key={pulse.id}
                style={{
                  padding: 'var(--space-lg)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border-subtle)',
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
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {pulse.user?.name}
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
                  {new Date(pulse.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
