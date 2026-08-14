import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { fetchCoupons, createCoupon, setCouponActive, deleteCoupon } from '../../services/discountsService';

const emptyForm = { code: '', percentOff: '', expiresAt: '' };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  async function reload() {
    setCoupons(await fetchCoupons());
  }
  useEffect(() => { reload(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await createCoupon(form);
      setForm(emptyForm);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(c) {
    await setCouponActive(c.id, !c.active);
    reload();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this coupon permanently?')) return;
    await deleteCoupon(id);
    reload();
  }

  return (
    <div>
      <h1 className="admin-page-title">Coupons</h1>
      {!isSupabaseConfigured && (
        <p className="admin-empty">Managing locally stored coupons — connect Supabase for a live, shared set of codes.</p>
      )}

      <form onSubmit={handleCreate} className="admin-modal" style={{ marginBottom: '2rem', maxWidth: 480, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>New Coupon</h2>
        <label>Code<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER15" /></label>
        <label>Percent Off<input required type="number" min="1" max="100" value={form.percentOff} onChange={(e) => setForm({ ...form, percentOff: e.target.value })} /></label>
        <label>Expires (optional)<input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></label>
        {error && <p style={{ color: '#dc7878', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" className="admin-btn solid">Create Coupon</button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Discount</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={5} className="admin-empty">No coupons yet.</td></tr>
            ) : coupons.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.percent_off}%</td>
                <td><span className={`status-pill ${c.active ? 'completed' : 'cancelled'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                <td>
                  <button className="admin-btn" onClick={() => handleToggle(c)}>{c.active ? 'Deactivate' : 'Activate'}</button>
                  <button className="admin-btn danger" onClick={() => handleDelete(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
