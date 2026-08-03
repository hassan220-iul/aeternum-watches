import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { fetchInvoices, fetchUninvoicedCompletedOrders, generateInvoice } from '../../services/invoicesService';
import { formatInvoiceNumber } from '../../utils/invoiceId';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [uninvoicedOrders, setUninvoicedOrders] = useState([]);
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
    // A production build would render a dedicated printable invoice
    // template (see docx/pdf skill) instead of window.print() on the
    // admin table. We briefly show a print-only summary so the browser's
    // print dialog has something focused to print rather than the whole
    // admin shell.
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
          <thead><tr><th>Invoice #</th><th>Order</th><th>Total</th><th>Issued</th><th>Actions</th></tr></thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={5} className="admin-empty">No invoices generated yet.</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{formatInvoiceNumber(inv.invoice_number)}</td>
                <td>#{inv.orders?.order_number}</td>
                <td>{formatCurrency(inv.orders?.total)}</td>
                <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                <td><button className="admin-btn" onClick={() => handlePrint(inv)}>Print</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {printing && (
        <div className="invoice-print-only">
          <h2>Aeternum Watches</h2>
          <p>Invoice {formatInvoiceNumber(printing.invoice_number)}</p>
          <p>Order #{printing.orders?.order_number}</p>
          <p>Total: {formatCurrency(printing.orders?.total)}</p>
          <p>Issued: {new Date(printing.created_at).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
