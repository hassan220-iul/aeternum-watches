import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTable, insertRow, genId, nowIso } from './localStore';

// In Supabase mode all figures come from live aggregates. In local mode
// they're computed from the localStorage tables seeded by localStore.js —
// either way the admin dashboard shows real numbers, never fabricated ones.

export async function fetchDashboardStats() {
  if (!isSupabaseConfigured) {
    const orders = getTable('orders');
    const completed = orders.filter((o) => o.status === 'completed');
    const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;
    const totalCustomers = getTable('profiles').filter((p) => p.role === 'customer').length;
    const totalVisitors = getTable('visitors').length;
    const conversionRate = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;
    const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;
    return { totalRevenue, totalOrders, totalCustomers, totalVisitors, conversionRate, avgOrderValue };
  }

  const [{ count: totalOrders }, { count: totalCustomers }, revenueRes, visitorsRes] =
    await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total').eq('status', 'completed'),
      supabase.from('visitors').select('*', { count: 'exact', head: true }),
    ]);

  const totalRevenue = (revenueRes.data || []).reduce((sum, o) => sum + Number(o.total), 0);
  const totalVisitors = visitorsRes.count || 0;
  const conversionRate = totalVisitors > 0 ? ((totalOrders || 0) / totalVisitors) * 100 : 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue,
    totalOrders: totalOrders || 0,
    totalCustomers: totalCustomers || 0,
    totalVisitors,
    conversionRate,
    avgOrderValue,
  };
}

export async function fetchOrdersInRange(days) {
  if (!isSupabaseConfigured) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return getTable('orders')
      .filter((o) => new Date(o.created_at).getTime() >= since)
      .map((o) => ({ created_at: o.created_at, total: o.total, status: o.status }));
  }
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('orders')
    .select('created_at, total, status')
    .gte('created_at', since);
  return data || [];
}

export async function logPageView(path) {
  if (!isSupabaseConfigured) {
    insertRow('analytics', { id: genId('ev'), event_type: 'page_view', path, created_at: nowIso() });
    return;
  }
  await supabase.from('analytics').insert({ event_type: 'page_view', path });
}

export async function logVisitorSession(sessionId) {
  if (!isSupabaseConfigured) {
    // Only count once per browser tab so refreshing/navigating doesn't
    // inflate the visitor count on every render.
    if (sessionStorage.getItem('aeternum_visitor_logged')) return;
    sessionStorage.setItem('aeternum_visitor_logged', '1');
    insertRow('visitors', { id: genId('vis'), session_id: sessionId, created_at: nowIso() });
    return;
  }
  await supabase.from('visitors').insert({ session_id: sessionId }).select();
}
