import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTable, insertRow, deleteRow, genId } from './localStore';

export async function fetchCategories() {
  if (!isSupabaseConfigured) return getTable('categories');
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function addCategory(name) {
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
  if (!isSupabaseConfigured) {
    return insertRow('categories', { id: genId('cat'), slug, name });
  }
  const { data, error } = await supabase.from('categories').insert({ slug, name }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  if (!isSupabaseConfigured) {
    deleteRow('categories', id);
    return;
  }
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
