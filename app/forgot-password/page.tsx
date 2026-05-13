'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) { setError('Please enter your email or username.'); return; }
    setError('');
    setLoading(true);

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    // Always show success (never reveal if account exists)
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-logo" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
          BH FINDER
        </h2>

        {!submitted ? (
          <>
            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="text"
                  placeholder="Type your email or Username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <p style={{ textAlign: 'center', fontSize: '0.88rem', margin: '12px 0 18px', color: '#555' }}>
                Back to <a href="/login" style={{ color: '#0066ff', fontWeight: 600 }}>Sign in</a>
              </p>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✉️</div>
            <h3 style={{ fontWeight: 700, marginBottom: '10px' }}>Check your inbox</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
              If an account with that email or username exists, a password reset link has been sent.
              Check your spam folder if you don&apos;t see it.
            </p>
            <a href="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Back to Sign in
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
