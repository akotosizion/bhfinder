'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.isLoggedIn) setUser({ username: data.username, role: data.role });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  if (loading) return null;

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>BH FINDER</span>
        </div>
        <div className="nav-actions">
          {user ? (
            <>
              <div className="user-chip">
                <i className="ph ph-user-circle" style={{ fontSize: '1.3rem' }} />
                <span>{user.username}</span>
              </div>
              {user.role === 'admin' && (
                <button className="btn-post" onClick={() => router.push('/admin')}>Admin Panel</button>
              )}
              <button className="btn-post" onClick={() => router.push('/dashboard')}>Browse</button>
              <button className="btn-logout" onClick={handleLogout} title="Logout">
                <i className="ph ph-sign-out" />
              </button>
            </>
          ) : (
            <>
              <button className="btn-login-hero" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => router.push('/login')}>Log In</button>
              <button className="btn-signup-hero" style={{ padding: '8px 18px', fontSize: '0.9rem' }} onClick={() => router.push('/register')}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      <main className="hero">
        <div className="hero-content">
          <div className="hero-icon">🏠</div>
          {user ? (
            <>
              <h1>Welcome back, {user.username}!</h1>
              <p>Browse the latest boarding house listings or manage your own posts.</p>
              <div className="hero-nav">
                <button className="btn-login-hero" onClick={() => router.push('/dashboard')}>Browse Listings</button>
                {user.role === 'admin' && (
                  <button className="btn-signup-hero" onClick={() => router.push('/admin')}>Admin Dashboard</button>
                )}
              </div>
            </>
          ) : (
            <>
              <h1>BH FINDER</h1>
              <p>Find your perfect boarding house or post your own listing.<br />Sign in to get started.</p>
              <div className="hero-nav">
                <button className="btn-login-hero" onClick={() => router.push('/login')}>Log In</button>
                <button className="btn-signup-hero" onClick={() => router.push('/register')}>Create Account</button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
