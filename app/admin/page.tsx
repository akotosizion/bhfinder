'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface Listing {
  id: number;
  title: string;
  price: string;
  location: string;
  image_url: string;
  owner_name: string;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  listing_count: number;
  created_at: string;
}

interface Stats {
  totalListings: number;
  activeListings: number;
  totalUsers: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ totalListings: 0, activeListings: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);

  // Verify admin session
  const checkSession = useCallback(async () => {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const data = await res.json();
    if (!data.isLoggedIn || data.role !== 'admin') {
      router.replace('/login');
      return;
    }
    setAdminUser({ username: data.username });
  }, [router]);

  useEffect(() => { checkSession(); }, [checkSession]);

  // Block bfcache back-button access after logout
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) checkSession();
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [checkSession]);

  // Disable browser back button for ALL login methods (credentials + Google OAuth)
  useEffect(() => {
    window.history.replaceState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadData = useCallback(async () => {
    const [listRes, userRes, statsRes] = await Promise.all([
      fetch('/api/listings'),
      fetch('/api/admin/users'),
      fetch('/api/admin/stats'),
    ]);
    const listData = await listRes.json();
    const userData = await userRes.json();
    const statsData = await statsRes.json();

    setListings(listData.listings || []);
    setUsers(userData.users || []);
    setStats(statsData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const deleteListing = async (id: number) => {
    if (!confirm('Delete this listing?')) return;
    await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    loadData();
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Delete this user and all their listings?')) return;
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    loadData();
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22, flexShrink: 0 }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          BH FINDER
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-item ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <i className="ph ph-house" /> Listings
          </button>
          <button
            className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="ph ph-users" /> Users
          </button>
          <button className="sidebar-item" onClick={() => router.push('/dashboard')}>
            <i className="ph ph-layout" /> Browse
          </button>
          <button className="sidebar-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
            <i className="ph ph-sign-out" /> Logout
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <div className="admin-topbar">
          <h1>Admin Dashboard</h1>
          <div className="admin-user">
            <i className="ph ph-user-circle" style={{ fontSize: '1.5rem' }} />
            <span>{adminUser?.username || 'Admin'}</span>
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>Admin</span>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon gray"><i className="ph ph-house" /></div>
            <div>
              <div className="stat-label">Total Listings</div>
              <div className="stat-value">{loading ? '—' : stats.totalListings}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><i className="ph ph-check-circle" /></div>
            <div>
              <div className="stat-label">Active</div>
              <div className="stat-value">{loading ? '—' : stats.activeListings}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><i className="ph ph-x-circle" /></div>
            <div>
              <div className="stat-label">Inactive</div>
              <div className="stat-value">0</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><i className="ph ph-users" /></div>
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{loading ? '—' : stats.totalUsers}</div>
            </div>
          </div>
        </div>

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <>
            <div className="section-header">
              <h2>All Listings</h2>
              <button className="btn-post" onClick={() => router.push('/dashboard')}>+ Add Listing</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '38%', textAlign: 'left', paddingLeft: 20 }}>Title</th>
                    <th>Owner</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#888' }}>Loading...</td></tr>
                  ) : listings.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#888' }}>No listings yet. Users can post from the dashboard.</td></tr>
                  ) : (
                    listings.map(l => (
                      <tr key={l.id}>
                        <td>
                          <div className="title-cell">
                            {l.image_url ? (
                              <img src={l.image_url} alt={l.title} className="table-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="table-img-placeholder"><i className="ph ph-image" /></div>
                            )}
                            <span style={{ fontWeight: 600 }}>{l.title}</span>
                          </div>
                        </td>
                        <td>{l.owner_name}</td>
                        <td>{l.location}</td>
                        <td style={{ fontWeight: 700 }}>{l.price}</td>
                        <td><span className="status-badge status-active">active</span></td>
                        <td>
                          <button className="btn-icon-del" onClick={() => deleteListing(l.id)} title="Delete listing">
                            <i className="ph ph-trash" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <>
            <div className="section-header">
              <h2>All Users</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', paddingLeft: 20 }}>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Listings</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#888' }}>Loading...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#888' }}>No users yet.</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: 20 }}>{u.username}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`role-badge ${u.role === 'admin' ? 'admin' : ''}`}>{u.role}</span>
                        </td>
                        <td>{u.listing_count}</td>
                        <td>
                          {u.role !== 'admin' && (
                            <button className="btn-icon-del" onClick={() => deleteUser(u.id)} title="Delete user">
                              <i className="ph ph-trash" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
