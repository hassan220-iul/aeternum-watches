import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTable, insertRow, updateRow, deleteRow, genId, nowIso } from './localStore';
import { logAdminAction } from './adminService';

function isExpired(d) {
  return d.expires_at ? new Date(d.expires_at).getTime() < Date.now() : false;
}

// Validates a coupon code for checkout use. Returns { code, percent_off }
// on success, or null if the code doesn't exist, is inactive, or expired.
export async function validateCoupon(code) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  if (!isSupabaseConfigured) {
    const found = getTable('discounts').find((d) => d.code.toUpperCase() === normalized);
    if (!found || !found.active || isExpired(found)) return null;
    return { code: found.code, percent_off: Number(found.percent_off) };
  }

  const { data, error } = await supabase
    .from('discounts')
    .select('code, percent_off, active, expires_at')
    .ilike('code', normalized)
    .single();
  if (error || !data || !data.active || isExpired(data)) return null;
  return { code: data.code, percent_off: Number(data.percent_off) };
}

export async function fetchCoupons() {
  if (!isSupabaseConfigured) {
    return getTable('discounts').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  const { data, error } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCoupon({ code, percentOff, expiresAt }) {
  const payload = {
    code: code.trim().toUpperCase(),
    percent_off: Number(percentOff),
    active: true,
    expires_at: expiresAt || null,
  };
  if (!isSupabaseConfigured) {
    const exists = getTable('discounts').some((d) => d.code === payload.code);
    if (exists) throw new Error('A coupon with that code already exists.');
    const row = insertRow('discounts', { id: genId('disc'), created_at: nowIso(), ...payload });
    await logAdminAction(`created coupon ${payload.code}`, 'discounts', row.id);
    return row;
  }
  const { data, error } = await supabase.from('discounts').insert(payload).select().single();
  if (error) throw error;
  await logAdminAction(`created coupon ${payload.code}`, 'discounts', data.id);
  return data;
}

export async function setCouponActive(id, active) {
  if (!isSupabaseConfigured) {
    const updated = updateRow('discounts', id, { active });
    await logAdminAction(`${active ? 'activated' : 'deactivated'} coupon`, 'discounts', id);
    return updated;
  }
  const { data, error } = await supabase.from('discounts').update({ active }).eq('id', id).select().single();
  if (error) throw error;
  await logAdminAction(`${active ? 'activated' : 'deactivated'} coupon`, 'discounts', id);
  return data;
}

export async function deleteCoupon(id) {
  if (!isSupabaseConfigured) {
    deleteRow('discounts', id);
    await logAdminAction('deleted coupon', 'discounts', id);
    return;
  }
  const { error } = await supabase.from('discounts').delete().eq('id', id);
  if (error) throw error;
  await logAdminAction('deleted coupon', 'discounts', id);
}
