import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { fetchInvoices, fetchUninvoicedCompletedOrders, generateInvoice } from '../../services/invoicesService';
import { formatInvoiceNumber } from '../../utils/invoiceId';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [uninvoicedOrders, setUninvoicedOrders] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [printing, setPrinting] = useState(null);

  async function reload() {
    setInvoices(await fetchInvoices());
    setUninvoicedOrders(await fetchUninvoicedCompletedOrders());
  }

  useEffect(() => { reload(); }, []);

  async function handleGenerate(orderId) {
    await generateInvoice(orderId);
    reload();
  }

  function handlePrint(inv) {

    setPrinting(inv);
    setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 50);
  }

  return (
    <div>
      <h1 className="admin-page-title">Invoices</h1>
      {!isSupabaseConfigured && (
        <p className="admin-empty">
          Managing locally stored invoices — completing an order auto-generates one, just like
          the <code>generate_invoice_number()</code> trigger does once Supabase is connected.
        </p>
      )}

      {uninvoicedOrders.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Completed Orders Awaiting Invoice</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Total</th><th>Action</th></tr></thead>
              <tbody>
                {uninvoicedOrders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.order_number}</td>
                    <td>{formatCurrency(o.total)}</td>
                    <td><button className="admin-btn solid" onClick={() => handleGenerate(o.id)}>Generate Invoice</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Invoice History</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Invoice #</th><th>Order</th><th>Items</th><th>Total</th><th>Issued</th><th>Actions</th></tr></thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="admin-empty">No invoices generated yet.</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{formatInvoiceNumber(inv.invoice_number)}</td>
                <td>#{inv.orders?.order_number}</td>
                <td>{(inv.orders?.order_items || []).length} watch{(inv.orders?.order_items || []).length === 1 ? '' : 'es'}</td>
                <td>{formatCurrency(inv.orders?.total)}</td>
                <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="admin-btn" onClick={() => setViewing(inv)}>View</button>
                  <button className="admin-btn" onClick={() => handlePrint(inv)}>Print</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="admin-modal-backdrop" onClick={() => setViewing(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <InvoiceContent inv={viewing} />
            <div className="admin-modal__actions">
              <button className="admin-btn" onClick={() => setViewing(null)}>Close</button>
              <button className="admin-btn solid" onClick={() => handlePrint(viewing)}>Print</button>
            </div>
          </div>
        </div>
      )}

      {printing && (
        <div className="invoice-print-only">
          <InvoiceContent inv={printing} />
        </div>
      )}
    </div>
  );
}

function InvoiceContent({ inv }) {
  const order = inv.orders || {};
  const items = order.order_items || [];
  const shipping = order.shipping_address || {};

  return (
    <div>
      <h2 style={{ marginBottom: '0.25rem' }}>Aeternum Watches</h2>
      <p style={{ marginBottom: '1rem', color: 'rgba(245,242,234,0.6)' }}>
        Invoice {formatInvoiceNumber(inv.invoice_number)} — Order #{order.order_number} —{' '}
        {new Date(inv.created_at).toLocaleDateString()}
      </p>

      {shipping.fullName && (
        <p style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
          Billed to: {shipping.fullName}
          {shipping.email ? `, ${shipping.email}` : ''}
          {shipping.address ? ` — ${shipping.address}, ${shipping.city || ''} ${shipping.country || ''}` : ''}
        </p>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'left' }}>
            <th style={{ padding: '0.4rem 0' }}>Watch</th>
            <th style={{ padding: '0.4rem 0' }}>Type</th>
            <th style={{ padding: '0.4rem 0', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Price</th>
            <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: '0.5rem 0', color: 'rgba(245,242,234,0.5)' }}>No item details available.</td></tr>
          ) : items.map((it, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '0.4rem 0' }}>{it.products?.name || 'Watch'}</td>
              <td style={{ padding: '0.4rem 0', color: 'rgba(245,242,234,0.6)' }}>
                {[it.products?.category, it.products?.collection].filter(Boolean).join(' · ') || '—'}
              </td>
              <td style={{ padding: '0.4rem 0', textAlign: 'center' }}>{it.quantity}</td>
              <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>{formatCurrency(it.unit_price)}</td>
              <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>{formatCurrency(it.unit_price * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginLeft: 'auto', width: 220, fontSize: '0.85rem' }}>
        <Row label="Subtotal" value={order.subtotal} />
        {order.discount > 0 && <Row label="Discount" value={-order.discount} />}
        <Row label="Shipping" value={order.shipping_cost} />
        <Row label="Total" value={order.total} bold />
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontWeight: bold ? 700 : 400, borderTop: bold ? '1px solid rgba(255,255,255,0.15)' : 'none', marginTop: bold ? '0.25rem' : 0 }}>
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}
