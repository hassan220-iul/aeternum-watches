import { supabase, isSupabaseConfigured } from './supabaseClient';
import { sendWhatsAppNotification } from './whatsappService';
import { getTable, insertRow, updateRow, genId, nowIso } from './localStore';

function withLocalJoins(refund) {
  const order = getTable('orders').find((o) => o.id === refund.order_id);
  const profile = getTable('profiles').find((p) => p.id === refund.user_id);
  return {
    ...refund,
    orders: order ? { order_number: order.order_number, total: order.total } : null,
    profiles: profile ? { full_name: profile.full_name, email: profile.email } : null,
  };
}

export async function createRefundRequest(orderId, userId, reason, orderNumber, customerName) {
  if (!isSupabaseConfigured) {
    const row = insertRow('refund_requests', {
      id: genId('ref'), order_id: orderId, user_id: userId, reason, status: 'pending', created_at: nowIso(),
    });
    await sendWhatsAppNotification('refund_request', { orderNumber, customerName });
    return row;
  }
  const { data, error } = await supabase
    .from('refund_requests')
    .insert({ order_id: orderId, user_id: userId, reason })
    .select()
    .single();
  if (error) throw error;

  await sendWhatsAppNotification('refund_request', { orderNumber, customerName });
  return data;
}

export async function fetchRefundRequests(status) {
  if (!isSupabaseConfigured) {
    let refunds = getTable('refund_requests');
    if (status) refunds = refunds.filter((r) => r.status === status);
    return refunds
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(withLocalJoins);
  }
  let query = supabase
    .from('refund_requests')
    .select('*, orders(order_number, total), profiles(full_name, email)')
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function resolveRefundRequest(id, status) {
  if (!isSupabaseConfigured) return updateRow('refund_requests', id, { status });
  const { data, error } = await supabase
    .from('refund_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
