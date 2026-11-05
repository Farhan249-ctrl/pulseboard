import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-2xl)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-xl)',
            textAlign: 'center',
          }}
        >
          Create Account
        </h1>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
              style={{
                width: '100%',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              style={{
                width: '100%',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p
          style={{
            marginTop: 'var(--space-lg)',
            textAlign: 'center',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
