import { supabase, isSupabaseConfigured } from './supabaseClient';
import { sendWhatsAppNotification } from './whatsappService';
import { formatCurrency } from '../utils/formatCurrency';
import { getTable, insertRow, updateRow, genId, nowIso } from './localStore';

function localProfileFor(userId) {
  return getTable('profiles').find((p) => p.id === userId) || null;
}
function localProductFor(productId) {
  return getTable('products').find((p) => p.id === productId) || null;
}
function withLocalJoins(order) {
  const profile = localProfileFor(order.user_id);
  const items = getTable('order_items')
    .filter((oi) => oi.order_id === order.id)
    .map((oi) => ({ ...oi, products: localProductFor(oi.product_id) }));
  return {
    ...order,
    profiles: profile ? { id: profile.id, full_name: profile.full_name, email: profile.email } : null,
    order_items: items,
  };
}

export async function createOrder({ userId, items, shipping, totals, isVip, paymentMethod = 'stripe', paymentReference = null }) {
  const orderPayload = {
    user_id: userId,
    status: 'pending',
    // Stripe: stays 'unpaid' until the webhook confirms the charge.
    // Whish Money: 'awaiting_verification' until an admin checks the
    // transfer arrived and confirms it from Admin → Orders.
    // Cash on Delivery: also 'unpaid' until the courier collects payment
    // and an admin marks it received.
    payment_status: paymentMethod === 'whish_money' ? 'awaiting_verification' : 'unpaid',
    payment_method: paymentMethod,
    payment_reference: paymentReference,
    subtotal: totals.subtotal,
    discount: totals.discount || 0,
    shipping_cost: totals.shippingCost || 0,
    total: totals.total,
    shipping_address: shipping,
  };

  let order;

  if (!isSupabaseConfigured) {
    const existing = getTable('orders');
    const nextNumber = existing.length
      ? Math.max(...existing.map((o) => o.order_number || 0)) + 1
      : 100001;
    order = {
      id: genId('ord'),
      order_number: nextNumber,
      ...orderPayload,
      created_at: nowIso(),
    };
    insertRow('orders', order);
    items.forEach((item) => {
      insertRow('order_items', {
        id: genId('oi'),
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      });
    });
  } else {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();
    if (error) throw error;
    order = data;

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;
  }

  await sendWhatsAppNotification('new_order', {
    orderNumber: order.order_number ?? order.id,
    customerName: shipping?.fullName || 'Guest',
    total: formatCurrency(totals.total),
  });

  if (paymentMethod === 'whish_money') {
    await sendWhatsAppNotification('whish_money_pending', {
      orderNumber: order.order_number ?? order.id,
      customerName: shipping?.fullName || 'Guest',
      total: formatCurrency(totals.total),
      reference: paymentReference || 'none provided',
    });
  }

  if (isVip) {
    await sendWhatsAppNotification('vip_purchase', {
      customerName: shipping?.fullName || 'Guest',
      orderNumber: order.order_number ?? order.id,
      total: formatCurrency(totals.total),
    });
  }

  return order;
}

export async function fetchOrdersForUser(userId) {
  if (!isSupabaseConfigured) {
    return getTable('orders')
      .filter((o) => o.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(withLocalJoins);
  }
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, slug))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchAllOrders(filters = {}) {
  if (!isSupabaseConfigured) {
    let orders = getTable('orders');
    if (filters.status) orders = orders.filter((o) => o.status === filters.status);
    return orders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(withLocalJoins);
  }
  let query = supabase.from('orders').select('*, profiles(full_name, email)');
  if (filters.status) query = query.eq('status', filters.status);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchOrderById(id) {
  if (!isSupabaseConfigured) {
    const order = getTable('orders').find((o) => o.id === id);
    return order ? withLocalJoins(order) : null;
  }
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, slug)), profiles(full_name, email)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// For Whish Money and Cash on Delivery — payment methods with no automated
// webhook. An admin uses this from Admin → Orders once they've verified the
// transfer landed (Whish Money) or the courier collected cash (COD). Mirrors
// what the Stripe webhook does automatically: marks paid, generates the
// invoice if there isn't one yet.
export async function confirmManualPayment(orderId) {
  if (!isSupabaseConfigured) {
    const updated = updateRow('orders', orderId, { payment_status: 'paid' });
    const hasInvoice = getTable('invoices').some((i) => i.order_id === orderId);
    if (!hasInvoice) {
      const invoices = getTable('invoices');
      const nextNumber = invoices.length ? Math.max(...invoices.map((i) => i.invoice_number)) + 1 : 1;
      insertRow('invoices', { id: genId('inv'), order_id: orderId, invoice_number: nextNumber, created_at: nowIso() });
    }
    return updated;
  }
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;

  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();
  if (!existingInvoice) {
    await supabase.from('invoices').insert({ order_id: orderId });
  }
  return data;
}

export async function updateOrderStatus(orderId, status) {
  if (!isSupabaseConfigured) {
    const updated = updateRow('orders', orderId, { status });
    if (status === 'cancelled') {
      await sendWhatsAppNotification('order_cancelled', { orderNumber: updated?.order_number ?? orderId });
    }
    // Mirror the schema.sql trigger: completing an order auto-generates an
    // invoice if it doesn't have one yet.
    if (status === 'completed') {
      const hasInvoice = getTable('invoices').some((i) => i.order_id === orderId);
      if (!hasInvoice) {
        const invoices = getTable('invoices');
        const nextNumber = invoices.length ? Math.max(...invoices.map((i) => i.invoice_number)) + 1 : 1;
        insertRow('invoices', { id: genId('inv'), order_id: orderId, invoice_number: nextNumber, created_at: nowIso() });
      }
    }
    return updated;
  }
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;

  if (status === 'cancelled') {
    await sendWhatsAppNotification('order_cancelled', { orderNumber: data.order_number ?? orderId });
  }
  return data;
}
