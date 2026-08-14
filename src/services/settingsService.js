import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getSettings, setSettings, nowIso } from './localStore';

export async function fetchStoreSettings() {
  if (!isSupabaseConfigured) return getSettings();
  const { data, error } = await supabase.from('store_settings').select('*').single();
  if (error) throw error;
  return data;
}

export async function updateStoreSettings(fields) {
  if (!isSupabaseConfigured) return setSettings({ ...fields, updated_at: nowIso() });
  const { data, error } = await supabase
    .from('store_settings')
    .update({ ...fields, updated_at: nowIso() })
    .eq('id', true)
    .select()
    .single();
  if (error) throw error;
  return data;
}
