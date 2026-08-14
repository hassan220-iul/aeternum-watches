import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTable, insertRow, deleteRow, genId, nowIso } from './localStore';
import { logAdminAction } from './adminService';

export async function submitFeedback({ name, email, message }) {
  if (!isSupabaseConfigured) {
    return insertRow('feedback', { id: genId('fb'), name, email, message, created_at: nowIso() });
  }
  const { error } = await supabase.from('feedback').insert({ name, email, message });
  if (error) throw error;
  return true;
}

export async function fetchFeedback() {
  if (!isSupabaseConfigured) {
    return getTable('feedback').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteFeedback(id) {
  if (!isSupabaseConfigured) {
    deleteRow('feedback', id);
    await logAdminAction('deleted feedback', 'feedback', id);
    return;
  }
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  if (error) throw error;
  await logAdminAction('deleted feedback', 'feedback', id);
}
