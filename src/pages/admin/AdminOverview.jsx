import { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../../services/analyticsService';
import { fetchAllOrders } from '../../services/ordersService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchDashboardStats().then(setStats);
    fetchAllOrders().then((orders) => setRecentOrders(orders.slice(0, 6)));
  }, []);

  return (
    <div>
      <h1 className="admin-page-title">Overview</h1>

      {!isSupabaseConfigured && (
        <p className="admin-empty">
          Running in local demo mode — figures below are computed from data stored in your
          browser. Connect Supabase to switch to a live, shared backend (see DEPLOYMENT_GUIDE.md).
        </p>
      )}

      <div className="admin-stats-grid">
        <Stat label="Total Revenue" value={stats ? formatCurrency(stats.totalRevenue) : '—'} />
        <Stat label="Total Orders" value={stats?.totalOrders ?? '—'} />
        <Stat label="Total Customers" value={stats?.totalCustomers ?? '—'} />
        <Stat label="Total Visitors" value={stats?.totalVisitors ?? '—'} />
        <Stat label="Conversion Rate" value={stats ? `${stats.conversionRate.toFixed(2)}%` : '—'} />
        <Stat label="Avg Order Value" value={stats ? formatCurrency(stats.avgOrderValue) : '—'} />
      </div>

      <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.1rem' }}>Recent Orders</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr><td colSpan={4} className="admin-empty">No orders yet.</td></tr>
            ) : recentOrders.map((o) => (
              <tr key={o.id}>
                <td>#{o.order_number ?? o.id}</td>
                <td>{o.profiles?.full_name || 'Guest'}</td>
                <td><span className={`status-pill ${o.status}`}>{o.status}</span></td>
                <td>{formatCurrency(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="admin-stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
