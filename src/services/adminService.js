import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTable, insertRow, updateRow, genId, nowIso } from './localStore';

// Writes to `admin_logs` (Supabase) or the local `admin_logs` table so the
// Activity Log in Admin → Settings reflects real actions instead of staying
// empty. Failures here are non-critical — logging shouldn't block the
// actual admin action from completing.
export async function logAdminAction(action, tableName, recordId = null) {
  if (!isSupabaseConfigured) {
    insertRow('admin_logs', { id: genId('log'), action, table_name: tableName, record_id: recordId, created_at: nowIso() });
    return;
  }
  try {
    await supabase.rpc('log_admin_action', {
      p_action: action,
      p_table: tableName,
      p_record: recordId,
    });
  } catch (err) {
    console.warn('Activity log write failed (non-critical):', err.message);
  }
}

export async function fetchAdminLogs(limit = 20) {
  if (!isSupabaseConfigured) {
    return getTable('admin_logs')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function fetchCustomerProfiles(search, vipOnly) {
  if (!isSupabaseConfigured) {
    let rows = getTable('profiles');
    if (search) rows = rows.filter((r) => r.full_name?.toLowerCase().includes(search.toLowerCase()));
    if (vipOnly) rows = rows.filter((r) => r.vip_status);
    return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (search) query = query.ilike('full_name', `%${search}%`);
  if (vipOnly) query = query.eq('vip_status', true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchAdmins() {
  if (!isSupabaseConfigured) {
    return getTable('profiles').filter((p) => p.role === 'admin');
  }
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin');
  if (error) throw error;
  return data;
}

export async function findProfileByEmail(email) {
  if (!isSupabaseConfigured) {
    return getTable('profiles').find((p) => p.email === email) || null;
  }
  const { data } = await supabase.from('profiles').select('id, email').eq('email', email).single();
  return data || null;
}

export async function updateCustomerRole(id, role) {
  if (!isSupabaseConfigured) {
    updateRow('profiles', id, { role });
    await logAdminAction(`set role to ${role}`, 'profiles', id);
    return;
  }
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
  await logAdminAction(`set role to ${role}`, 'profiles', id);
}

export async function updateCustomerVip(id, vipStatus) {
  if (!isSupabaseConfigured) {
    updateRow('profiles', id, { vip_status: vipStatus });
    await logAdminAction(vipStatus ? 'granted VIP status' : 'revoked VIP status', 'profiles', id);
    return;
  }
  const { error } = await supabase.from('profiles').update({ vip_status: vipStatus }).eq('id', id);
  if (error) throw error;
  await logAdminAction(vipStatus ? 'granted VIP status' : 'revoked VIP status', 'profiles', id);
}
