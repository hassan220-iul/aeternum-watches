import { useEffect, useState } from 'react';
import { fetchAllOrders, updateOrderStatus, confirmManualPayment } from '../../services/ordersService';
import { fetchRefundRequests, resolveRefundRequest } from '../../services/refundsService';
import { logAdminAction } from '../../services/adminService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUSES = ['pending', 'processing', 'completed', 'cancelled'];
const PAYMENT_METHOD_LABELS = { stripe: 'Card (Stripe)', whish_money: 'Whish Money (Manual)', whish_card: 'Whish Money (Card)', cash_on_delivery: 'Cash on Delivery' };

export default function AdminOrders() {
  const [view, setView] = useState('orders'); // 'orders' | 'refunds'
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [refunds, setRefunds] = useState([]);
  const [refundFilter, setRefundFilter] = useState('pending');

  async function reloadOrders() {
    const data = await fetchAllOrders(filter ? { status: filter } : {});
    setOrders(data);
  }
  async function reloadRefunds() {
    setRefunds(await fetchRefundRequests(refundFilter || undefined));
  }

  useEffect(() => { reloadOrders(); }, [filter]);
  useEffect(() => { reloadRefunds(); }, [refundFilter]);

  async function handleStatusChange(id, status) {
    await updateOrderStatus(id, status);
    await logAdminAction(`set order status to ${status}`, 'orders', id);
    reloadOrders();
  }

  async function handleConfirmPayment(id) {
    if (!confirm('Confirm that payment for this order has been received?')) return;
    await confirmManualPayment(id);
    await logAdminAction('confirmed manual payment', 'orders', id);
    reloadOrders();
  }

  async function handleResolveRefund(id, status) {
    await resolveRefundRequest(id, status);
    await logAdminAction(`${status} refund request`, 'refund_requests', id);
    reloadRefunds();
    reloadOrders();
  }

  return (
    <div>
      <h1 className="admin-page-title">Orders</h1>

      <div className="admin-toolbar">
        <div>
          <button className={`admin-btn ${view === 'orders' ? 'solid' : ''}`} onClick={() => setView('orders')}>All Orders</button>
          <button className={`admin-btn ${view === 'refunds' ? 'solid' : ''}`} onClick={() => setView('refunds')}>Refund Requests</button>
        </div>
      </div>

      {view === 'orders' && (
        <>
          <div className="admin-toolbar">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {!isSupabaseConfigured && <p className="admin-empty">Managing locally stored orders — connect Supabase for a live, shared dataset.</p>}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} className="admin-empty">No orders found.</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.order_number ?? o.id}</td>
                    <td>{o.profiles?.full_name || o.profiles?.email || 'Guest'}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>{formatCurrency(o.total)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(245,242,234,0.7)' }}>
                          {PAYMENT_METHOD_LABELS[o.payment_method] || o.payment_method || 'Stripe'}
                        </span>
                        <span className={`status-pill ${o.payment_status === 'paid' ? 'completed' : o.payment_status === 'failed' ? 'cancelled' : 'pending'}`}>
                          {o.payment_status || 'unpaid'}
                        </span>
                        {o.payment_reference && (
                          <span style={{ fontSize: '0.7rem', color: 'rgba(245,242,234,0.4)' }}>Ref: {o.payment_reference}</span>
                        )}
                        {o.payment_status !== 'paid' && o.payment_method !== 'stripe' && (
                          <button className="admin-btn solid" style={{ marginLeft: 0, marginTop: '0.2rem' }} onClick={() => handleConfirmPayment(o.id)}>
                            Confirm Payment
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        <option value="refunded">refunded</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === 'refunds' && (
        <>
          <div className="admin-toolbar">
            <select value={refundFilter} onChange={(e) => setRefundFilter(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>

          {!isSupabaseConfigured && <p className="admin-empty">Managing locally stored refund requests — connect Supabase for a live, shared dataset.</p>}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr><td colSpan={5} className="admin-empty">No refund requests found.</td></tr>
                ) : refunds.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.orders?.order_number}</td>
                    <td>{r.profiles?.full_name || r.profiles?.email || 'Guest'}</td>
                    <td>{r.reason || '—'}</td>
                    <td><span className={`status-pill ${r.status === 'approved' ? 'completed' : r.status === 'denied' ? 'cancelled' : 'pending'}`}>{r.status}</span></td>
                    <td>
                      {r.status === 'pending' ? (
                        <>
                          <button className="admin-btn" onClick={() => handleResolveRefund(r.id, 'approved')}>Approve</button>
                          <button className="admin-btn danger" onClick={() => handleResolveRefund(r.id, 'denied')}>Deny</button>
                        </>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
