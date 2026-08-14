import { supabase, isSupabaseConfigured } from './supabaseClient';
import { logAdminAction } from './adminService';
import { getTable, insertRow, genId, nowIso } from './localStore';

function withLocalOrder(invoice) {
  const order = getTable('orders').find((o) => o.id === invoice.order_id);
  const items = order
    ? getTable('order_items')
        .filter((oi) => oi.order_id === order.id)
        .map((oi) => ({
          quantity: oi.quantity,
          unit_price: oi.unit_price,
          products: getTable('products').find((p) => p.id === oi.product_id) || null,
        }))
    : [];
  return {
    ...invoice,
    orders: order
      ? {
          order_number: order.order_number,
          total: order.total,
          subtotal: order.subtotal,
          discount: order.discount,
          shipping_cost: order.shipping_cost,
          status: order.status,
          shipping_address: order.shipping_address,
          order_items: items,
        }
      : null,
  };
}

export async function fetchInvoices() {
  if (!isSupabaseConfigured) {
    return getTable('invoices')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(withLocalOrder);
  }
  const { data } = await supabase
    .from('invoices')
    .select(`*, orders(
      order_number, total, subtotal, discount, shipping_cost, status, shipping_address,
      order_items(quantity, unit_price, products(name, category, collection))
    )`)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function fetchUninvoicedCompletedOrders() {
  const invoices = await fetchInvoices();
  const invoicedOrderIds = new Set(invoices.map((i) => i.order_id));

  if (!isSupabaseConfigured) {
    return getTable('orders')
      .filter((o) => o.status === 'completed' && !invoicedOrderIds.has(o.id))
      .map((o) => ({ id: o.id, order_number: o.order_number, total: o.total }));
  }
  const { data: completedOrders } = await supabase
    .from('orders')
    .select('id, order_number, total')
    .eq('status', 'completed');
  return (completedOrders || []).filter((o) => !invoicedOrderIds.has(o.id));
}

export async function generateInvoice(orderId) {
  if (!isSupabaseConfigured) {
    const invoices = getTable('invoices');
    const nextNumber = invoices.length ? Math.max(...invoices.map((i) => i.invoice_number)) + 1 : 1;
    const row = insertRow('invoices', { id: genId('inv'), order_id: orderId, invoice_number: nextNumber, created_at: nowIso() });
    await logAdminAction('generated invoice', 'invoices', row.id);
    return row;
  }
  const { data, error } = await supabase.from('invoices').insert({ order_id: orderId }).select().single();
  if (error) throw error;
  await logAdminAction('generated invoice', 'invoices', data.id);
  return data;
}
