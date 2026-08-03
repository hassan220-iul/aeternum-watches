import { NavLink, Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import './admin.css';

const LINKS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/coupons', label: 'Coupons' },
  { to: '/admin/feedback', label: 'Feedback' },
  { to: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout() {
  const { user, profile, isStaff, loading } = useAuth();

  if (loading) return <div className="admin-loading">Loading…</div>;

  // Not signed in at all → send to login.
  if (!user) return <Navigate to="/login" replace />;

  // Signed in, but this account isn't staff (admin/manager/staff role).
  if (!isStaff) {
    return (
      <div className="admin-loading" style={{ maxWidth: 520 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '1rem' }}>
          This account isn't an admin
        </h1>
        <p style={{ color: 'rgba(245,242,234,0.65)', marginBottom: '1.5rem' }}>
          You're signed in as <code>{profile?.email}</code>, but that account's role is{' '}
          <code>{profile?.role || 'customer'}</code>, not an admin/manager/staff role.
          {isSupabaseConfigured ? (
            <> Promote it from the Supabase SQL editor: <code>update profiles set role = 'admin' where email = '{profile?.email}';</code></>
          ) : (
            <> In local demo mode, sign in instead with <code>admin@aeternum.test</code> / <code>admin123</code> (see the Login page for other demo accounts), or ask an admin to promote your account from Admin → Settings → Role Management.</>
          )}
        </p>
        <Link to="/" className="admin-btn">← Back to Site</Link>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="admin-sidebar__logo">AETERNUM<span>Admin</span></p>
        <nav>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <p style={{ fontSize: '0.72rem', color: 'rgba(245,242,234,0.45)', padding: '0 0 0.5rem' }}>
          Signed in as {profile?.full_name || profile?.email} ({profile?.role})
        </p>
        <NavLink to="/" className="admin-sidebar__exit">← Back to Site</NavLink>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
