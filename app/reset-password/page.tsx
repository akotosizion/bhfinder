'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) { setEmail(data.email); setStatus('valid'); }
        else setStatus('invalid');
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();

    if (!res.ok) { setError(data.error || 'Something went wrong.'); setSubmitting(false); return; }
    setStatus('success');
  };

  if (status === 'loading') {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>Validating your reset link...</p>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h3 style={{ fontWeight: 700, marginBottom: 10 }}>Link Invalid or Expired</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 24 }}>
            This password reset link is either invalid or has already expired (links expire after 1 hour).
          </p>
          <a href="/forgot-password" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Request a new link
          </a>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h3 style={{ fontWeight: 700, marginBottom: 10 }}>Password Reset!</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 24 }}>
            Your password has been updated. You can now sign in with your new password.
          </p>
          <a href="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Back to Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-logo" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
          BH FINDER
        </h2>

        <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginBottom: '24px', marginTop: '-16px' }}>
          Resetting password for <strong>{email}</strong>
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>New Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                required
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
