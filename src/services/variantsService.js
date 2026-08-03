import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTable, insertRow, deleteRow, genId, nowIso } from './localStore';

export async function fetchVariants(productId) {
  if (!isSupabaseConfigured) {
    return getTable('product_variants')
      .filter((v) => v.product_id === productId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function addVariant(productId, variant) {
  if (!isSupabaseConfigured) {
    return insertRow('product_variants', { id: genId('var'), product_id: productId, created_at: nowIso(), ...variant });
  }
  const { data, error } = await supabase
    .from('product_variants')
    .insert({ product_id: productId, ...variant })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVariant(id) {
  if (!isSupabaseConfigured) {
    deleteRow('product_variants', id);
    return;
  }
  const { error } = await supabase.from('product_variants').delete().eq('id', id);
  if (error) throw error;
}
