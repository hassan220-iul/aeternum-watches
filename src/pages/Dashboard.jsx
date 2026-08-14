import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { fetchOrdersForUser } from '../services/ordersService';
import { createRefundRequest } from '../services/refundsService';
import { formatCurrency } from '../utils/formatCurrency';

const TABS = ['Overview', 'Orders', 'Wishlist', 'Addresses', 'Notifications'];

export default function Dashboard() {
  const { user, profile, loading, signOut, isVip } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const [tab, setTab] = useState('Overview');
  const [orders, setOrders] = useState([]);
  const [refundingId, setRefundingId] = useState(null);

  useEffect(() => {
    if (user) fetchOrdersForUser(user.id).then(setOrders).catch(() => setOrders([]));
  }, [user]);

  async function handleRequestRefund(order) {
    const reason = window.prompt('Briefly, why are you requesting a refund for order #' + (order.order_number ?? order.id) + '?');
    if (reason === null) return;
    setRefundingId(order.id);
    try {
      await createRefundRequest(order.id, user.id, reason, order.order_number ?? order.id, profile?.full_name);
      alert('Refund request submitted — our team will review it shortly.');
    } catch (err) {
      alert(`Couldn't submit the request: ${err.message}`);
    } finally {
      setRefundingId(null);
    }
  }

  if (loading) return <div className="section container">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="section container dashboard">
      <div className="dashboard__header">
        <div>
          <p className="eyebrow">{isVip ? 'VIP Member' : 'Member'}</p>
          <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: '0.5rem' }}>
            Welcome, {profile?.full_name || 'Collector'}
          </h1>
        </div>
        <button className="btn btn-ghost" onClick={signOut}><span>Sign Out</span></button>
      </div>

      <div className="dashboard__tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="dashboard__stats">
          <StatBlock label="Orders" value={orders.length} />
          <StatBlock label="Loyalty Points" value={profile?.loyalty_points ?? 0} />
          <StatBlock label="Wishlist" value={wishlistItems.length} />
          <StatBlock label="Status" value={isVip ? 'VIP' : 'Standard'} />
        </div>
      )}

      {tab === 'Orders' && (
        <div className="dashboard__list">
          {orders.length === 0 ? <p className="dashboard__empty">No orders yet.</p> : orders.map((o) => (
            <div key={o.id} className="dashboard__row card-glass">
              <span>#{o.order_number ?? o.id}</span>
              <span>{o.status}</span>
              <span>{formatCurrency(o.total)}</span>
              {(o.status === 'completed' || o.status === 'processing') && (
                <button
                  className="btn btn-ghost"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}
                  onClick={() => handleRequestRefund(o)}
                  disabled={refundingId === o.id}
                >
                  <span>{refundingId === o.id ? 'Submitting…' : 'Request Refund'}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'Wishlist' && (
        <div className="dashboard__list">
          {wishlistItems.length === 0 ? <p className="dashboard__empty">No saved watches yet.</p> : wishlistItems.map((w) => (
            <div key={w.id} className="dashboard__row card-glass">
              <Link to={`/product/${w.slug}`}>{w.name}</Link>
              <span>{formatCurrency(w.price, w.currency)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'Addresses' && (
        <p className="dashboard__empty">Saved addresses are pulled from Supabase's <code>addresses</code> table for signed-in users.</p>
      )}

      {tab === 'Notifications' && (
        <p className="dashboard__empty">Order status and restock alerts appear here in real time once Supabase Realtime is connected.</p>
      )}
    </div>
  );
}

function StatBlock({ label, value }) {
  return (
    <div className="dashboard__stat card-glass">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
