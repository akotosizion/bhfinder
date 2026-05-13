'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface Listing {
  id: number;
  title: string;
  description: string;
  price: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  contact_number: string;
  amenities: string[];
  image_url: string;
  user_id: number;
  owner_name: string;
  created_at: string;
}

interface SessionUser {
  userId: number;
  username: string;
  role: string;
}

const AMENITY_OPTIONS = ['Wifi', 'Security', 'Kitchen', 'Aircon', 'Laundry', 'Parking', 'Water', 'Electricity'];

const DEFAULT_FORM = {
  title: '', description: '', price: '', location: '',
  bedrooms: '', bathrooms: '', contact_number: '',
  amenities: [] as string[], image_url: '',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

  const checkSession = useCallback(async () => {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const data = await res.json();
    if (!data.isLoggedIn) { router.replace('/login'); return; }
    setUser({ userId: data.userId, username: data.username, role: data.role });
  }, [router]);

  // Load session
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Re-check session when page is restored from browser back-cache (bfcache)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) checkSession();
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [checkSession]);


  // Load listings
  const loadListings = useCallback(async () => {
    const res = await fetch('/api/listings');
    const data = await res.json();
    setListings(data.listings || []);
    setFiltered(data.listings || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  // Search filter
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFiltered(listings.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q)
    ));
  }, [searchQuery, listings]);

  // Modal body lock
  useEffect(() => {
    document.body.classList.toggle('modal-open', showViewModal || showPostModal);
  }, [showViewModal, showPostModal]);

  const openView = (listing: Listing) => {
    setSelectedListing(listing);
    setShowViewModal(true);
  };

  const openPost = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setFormError('');
    setImagePreview('');
    setShowViewModal(false);
    setShowPostModal(true);
  };

  const openEdit = (listing: Listing) => {
    setIsEditing(true);
    setEditingId(listing.id);
    setForm({
      title: listing.title,
      description: listing.description || '',
      price: listing.price,
      location: listing.location,
      bedrooms: String(listing.bedrooms),
      bathrooms: String(listing.bathrooms),
      contact_number: listing.contact_number || '',
      amenities: listing.amenities || [],
      image_url: listing.image_url || '',
    });
    setImagePreview(listing.image_url || '');
    setFormError('');
    setShowViewModal(false);
    setShowPostModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setForm(prev => ({ ...prev, image_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const closeAll = () => {
    setShowViewModal(false);
    setShowPostModal(false);
  };

  const toggleAmenity = (a: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.title || !form.location || !form.price) {
      setFormError('Title, location and price are required.');
      return;
    }
    setSubmitting(true);

    const payload = {
      ...form,
      bedrooms: parseInt(form.bedrooms) || 0,
      bathrooms: parseInt(form.bathrooms) || 0,
    };

    const url = isEditing ? `/api/listings/${editingId}` : '/api/listings';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setFormError(data.error || 'Failed to save listing'); return; }

    setShowPostModal(false);
    loadListings();
  };

  const handleDelete = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Delete this listing?')) return;
    await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    setShowViewModal(false);
    loadListings();
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const canModify = (listing: Listing) =>
    user?.role === 'admin' || listing.user_id === user?.userId;

  return (
    <>
      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo" onClick={() => router.push('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>BH FINDER</span>
        </div>
        <div className="nav-actions">
          <button className="btn-post" onClick={openPost}>+ Post Listing</button>
          <div className="user-chip">
            <i className="ph ph-user-circle" style={{ fontSize: '1.3rem' }} />
            <span>{user?.username || '...'}</span>
          </div>
          {user?.role === 'admin' && (
            <button className="btn-post" style={{ background: '#0056b3' }} onClick={() => router.push('/admin')}>
              Admin
            </button>
          )}
          <button className="btn-logout" onClick={handleLogout} title="Logout">
            <i className="ph ph-sign-out" />
          </button>
        </div>
      </header>

      {/* SEARCH */}
      <section className="search-section">
        <div className="search-bar">
          <i className="ph ph-magnifying-glass" style={{ fontSize: '1.2rem', color: '#aaa' }} />
          <input
            type="text"
            placeholder="Search by title, location, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="filter-btn">
          <i className="ph ph-sliders-horizontal" />
        </button>
      </section>

      {/* LISTINGS GRID */}
      <main className="property-grid">
        {loading ? (
          <div className="loading-spinner" style={{ gridColumn: '1/-1' }}>
            <i className="ph ph-circle-notch" style={{ animation: 'spin 1s linear infinite' }} />
            Loading listings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>{searchQuery ? 'No results found' : 'No listings yet'}</h3>
            <p>{searchQuery ? 'Try a different search term.' : 'Be the first to post a listing!'}</p>
          </div>
        ) : (
          filtered.map(listing => (
            <div key={listing.id} className="card" onClick={() => openView(listing)}>
              {canModify(listing) && (
                <button
                  className="card-delete-btn"
                  onClick={e => handleDelete(listing.id, e)}
                  title="Delete listing"
                >
                  <i className="ph ph-trash" />
                </button>
              )}
              <div className="card-image">
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.title} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="card-image-placeholder">
                    <i className="ph ph-house" />
                    <span>No image</span>
                  </div>
                )}
              </div>
              <div className="card-content">
                <h2 className="card-title">{listing.title}</h2>
                <p className="card-location">
                  <i className="ph ph-map-pin" /> {listing.location}
                </p>
                <div className="card-features">
                  {listing.bedrooms > 0 && (
                    <span className="feature"><i className="ph ph-bed" /> {listing.bedrooms} bed</span>
                  )}
                  {listing.amenities?.includes('Wifi') && (
                    <span className="feature"><i className="ph ph-wifi-high" /> WiFi</span>
                  )}
                </div>
                <hr className="card-divider" />
                <div className="card-footer">
                  <div className="card-owner">
                    <i className="ph ph-user-circle" />
                    <span>{listing.owner_name}</span>
                  </div>
                  <span className="card-price">{listing.price}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <button className="scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <i className="ph ph-arrow-up" />
      </button>

      {/* VIEW MODAL */}
      {showViewModal && selectedListing && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) closeAll(); }}>
          <div className="view-modal">
            <button className="modal-close" onClick={closeAll}>×</button>
            <div className="modal-image-pane">
              {selectedListing.image_url ? (
                <img src={selectedListing.image_url} alt={selectedListing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="modal-image-placeholder">
                  <i className="ph ph-house" />
                </div>
              )}
            </div>
            <div className="modal-info-pane">
              <h1 className="modal-title">{selectedListing.title}</h1>
              <div className="modal-sub">
                <span className="modal-location"><i className="ph ph-map-pin" /> {selectedListing.location}</span>
                <span className="modal-price">{selectedListing.price}<small style={{ fontWeight: 400, fontSize: '0.75rem', color: '#888' }}>/mo</small></span>
              </div>
              <div className="modal-specs">
                {selectedListing.bedrooms > 0 && (
                  <span className="modal-spec"><i className="ph ph-bed" /> {selectedListing.bedrooms} Bedroom{selectedListing.bedrooms > 1 ? 's' : ''}</span>
                )}
                {selectedListing.bathrooms > 0 && (
                  <span className="modal-spec"><i className="ph ph-bathtub" /> {selectedListing.bathrooms} Bathroom{selectedListing.bathrooms > 1 ? 's' : ''}</span>
                )}
              </div>
              <hr className="modal-sep" />
              {selectedListing.description && (
                <div className="modal-section">
                  <h3>Description</h3>
                  <p className="modal-desc">{selectedListing.description}</p>
                </div>
              )}
              {selectedListing.amenities?.length > 0 && (
                <div className="modal-section">
                  <h3>Amenities</h3>
                  <div className="amenities-list">
                    {selectedListing.amenities.map(a => (
                      <div key={a} className="amenity-item">
                        <i className="ph ph-check-circle" style={{ color: '#22c55e' }} /> {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="contact-card">
                <h4>Contact Owner</h4>
                <div className="contact-row"><i className="ph ph-user-circle" /> {selectedListing.owner_name}</div>
                {selectedListing.contact_number && (
                  <div className="contact-row"><i className="ph ph-phone" /> {selectedListing.contact_number}</div>
                )}
              </div>
              {canModify(selectedListing) && (
                <div className="modal-actions">
                  <button className="btn-edit" onClick={() => openEdit(selectedListing)}>Edit Listing</button>
                  <button className="btn-delete" onClick={() => handleDelete(selectedListing.id)}>Delete</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POST / EDIT MODAL */}
      {showPostModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) closeAll(); }}>
          <div className="post-modal">
            <div className="post-modal-header">
              <h2>{isEditing ? 'Edit Listing' : 'Add New Listing'}</h2>
              <button onClick={closeAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>

            {formError && <div className="error-msg">{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" placeholder="e.g. Cozy Studio near Guagua" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="Describe the unit..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical', padding: '10px 13px', border: '1px solid #e0e0e0', borderRadius: 6, width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Monthly Rent *</label>
                  <input type="text" placeholder="₱0,000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input type="text" placeholder="Guagua, Pampanga" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Bedrooms</label>
                  <input type="number" min="0" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Bathrooms</label>
                  <input type="number" min="0" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input type="text" placeholder="+63 XXX XXX XXXX" value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Photo</label>
                <div style={{ border: '2px dashed #e0e0e0', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer', position: 'relative', background: '#fafafa', transition: 'border-color 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = '#000')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
                >
                  {imagePreview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                      <button type="button" onClick={() => { setImagePreview(''); setForm(prev => ({ ...prev, image_url: '' })); }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >×</button>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      <div style={{ color: '#888' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>Click to upload photo</div>
                        <div style={{ fontSize: '0.78rem', color: '#aaa' }}>JPG, PNG, WEBP — max 5MB</div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Amenities</label>
                <div className="amenities-grid">
                  {AMENITY_OPTIONS.map(a => (
                    <div
                      key={a}
                      className={`amenity-check ${form.amenities.includes(a) ? 'selected' : ''}`}
                      onClick={() => toggleAmenity(a)}
                    >{a}</div>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel-form" onClick={closeAll}>Cancel</button>
                <button type="submit" className="btn-submit-form" disabled={submitting}>
                  {submitting ? 'Saving...' : isEditing ? 'Update Listing' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
