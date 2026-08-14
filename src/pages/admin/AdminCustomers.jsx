import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { fetchCustomerProfiles, updateCustomerRole, updateCustomerVip } from '../../services/adminService';
import { fetchOrdersForUser } from '../../services/ordersService';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [vipOnly, setVipOnly] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);

  async function reload() {
    setCustomers(await fetchCustomerProfiles(search, vipOnly));
  }
  useEffect(() => { reload(); }, [search, vipOnly]);

  async function openProfile(customer) {
    setSelectedCustomer(customer);
    setCustomerOrders(await fetchOrdersForUser(customer.id));
  }

  async function handleToggleVip(customer) {
    await updateCustomerVip(customer.id, !customer.vip_status);
    if (selectedCustomer?.id === customer.id) setSelectedCustomer({ ...customer, vip_status: !customer.vip_status });
    reload();
  }

  async function handleToggleRole(customer) {
    const nextRole = customer.role === 'admin' ? 'customer' : 'admin';
    if (!confirm(`Set ${customer.full_name || customer.email} to "${nextRole}"?`)) return;
    await updateCustomerRole(customer.id, nextRole);
    if (selectedCustomer?.id === customer.id) setSelectedCustomer({ ...customer, role: nextRole });
    reload();
  }

  return (
    <div>
      <h1 className="admin-page-title">Customers</h1>
      <div className="admin-toolbar">
        <input placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={vipOnly} onChange={(e) => setVipOnly(e.target.checked)} /> VIP only
        </label>
      </div>

      {!isSupabaseConfigured && <p className="admin-empty">Managing locally stored customer profiles — connect Supabase for a live, shared dataset.</p>}
      <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Loyalty Points</th><th>VIP</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} className="admin-empty">No customers found.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id}>
                  <td><button className="admin-btn" style={{ borderColor: 'transparent', color: '#f5f2ea', padding: 0, textAlign: 'left' }} onClick={() => openProfile(c)}>{c.full_name}</button></td>
                  <td>{c.email}</td>
                  <td>{c.role}</td>
                  <td>{c.loyalty_points ?? 0}</td>
                  <td>{c.vip_status ? <span className="status-pill completed">VIP</span> : '—'}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="admin-btn" onClick={() => handleToggleVip(c)}>{c.vip_status ? 'Revoke VIP' : 'Grant VIP'}</button>
                    <button className="admin-btn" onClick={() => handleToggleRole(c)}>{c.role === 'admin' ? 'Demote' : 'Make Admin'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {selectedCustomer && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h2>{selectedCustomer.full_name || selectedCustomer.email}</h2>
            <p style={{ color: 'rgba(245,242,234,0.6)', marginBottom: '0.5rem' }}>{selectedCustomer.email}</p>
            <p style={{ color: 'rgba(245,242,234,0.6)', marginBottom: '1.5rem' }}>
              Role: {selectedCustomer.role} · {selectedCustomer.vip_status ? 'VIP Member' : 'Standard Member'} ·{' '}
              {selectedCustomer.loyalty_points ?? 0} loyalty points
            </p>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Purchase History</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 260, overflowY: 'auto' }}>
              {customerOrders.length === 0 ? (
                <p className="admin-empty">No orders yet.</p>
              ) : customerOrders.map((o) => (
                <li key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem' }}>
                  <span>#{o.order_number ?? o.id} — {o.status}</span>
                  <span>{formatCurrency(o.total)}</span>
                </li>
              ))}
            </ul>
            <div className="admin-modal__actions">
              <button className="admin-btn" onClick={() => setSelectedCustomer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
