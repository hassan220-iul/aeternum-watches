import { supabase, isSupabaseConfigured } from './supabaseClient';
import { mockProducts, getProductBySlug } from '../data/mockProducts';
import { getTable, insertRow, updateRow, deleteRow, deleteRows, genId, nowIso } from './localStore';

function mapProductRow(row) {
  if (!row) return row;
  return {
    ...row,
    caseMaterial: row.case_material ?? row.caseMaterial,
    waterResistance: row.water_resistance ?? row.waterResistance,
    reviewCount: row.review_count ?? row.reviewCount ?? 0,
    isLimited: row.is_limited ?? row.isLimited ?? false,
    isNew: row.is_new ?? row.isNew ?? false,
  };
}

function toDbPayload(payload) {
  const {
    caseMaterial, waterResistance, isLimited, isNew,
    rating, reviewCount, id, created_at,
    ...rest
  } = payload;
  const out = { ...rest };
  if (caseMaterial !== undefined) out.case_material = caseMaterial;
  if (waterResistance !== undefined) out.water_resistance = waterResistance;
  if (isLimited !== undefined) out.is_limited = isLimited;
  if (isNew !== undefined) out.is_new = isNew;
  return out;
}

export async function fetchProducts(filters = {}) {
  if (!isSupabaseConfigured) {
    return applyFiltersLocally(getTable('products'), filters);
  }

  let query = supabase.from('products').select('*').eq('is_active', true);

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.collection) query = query.eq('collection', filters.collection);
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);
  if (filters.sort === 'price-asc') query = query.order('price', { ascending: true });
  else if (filters.sort === 'price-desc') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('fetchProducts error, falling back to mock data:', error.message);
    return applyFiltersLocally(mockProducts, filters);
  }
  return (data || []).map(mapProductRow);
}

export async function fetchProductBySlug(slug) {
  if (!isSupabaseConfigured) return getTable('products').find((p) => p.slug === slug);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('fetchProductBySlug error, falling back to mock data:', error.message);
    return getProductBySlug(slug);
  }
  return mapProductRow(data);
}

export async function createProduct(payload) {
  const withDefaults = { currency: 'USD', ...payload };
  if (!isSupabaseConfigured) {
    const row = { id: genId('prod'), created_at: nowIso(), is_active: true, ...withDefaults };
    return insertRow('products', row);
  }
  const { data, error } = await supabase.from('products').insert(toDbPayload(withDefaults)).select().single();
  if (error) throw error;
  return mapProductRow(data);
}

export async function updateProduct(id, payload) {
  if (!isSupabaseConfigured) return updateRow('products', id, payload);
  const { data, error } = await supabase.from('products').update(toDbPayload(payload)).eq('id', id).select().single();
  if (error) throw error;
  return mapProductRow(data);
}

export async function deleteProduct(id) {
  if (!isSupabaseConfigured) {
    deleteRow('products', id);
    return;
  }
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateProduct(p) {
  const { id, created_at, ...rest } = p;
  const payload = { ...rest, name: `${p.name} (Copy)`, slug: `${p.slug}-copy-${Date.now()}` };
  if (!isSupabaseConfigured) {
    const row = { ...payload, id: genId('prod'), created_at: nowIso() };
    return insertRow('products', row);
  }
  const { data, error } = await supabase.from('products').insert(toDbPayload(payload)).select().single();
  if (error) throw error;
  return mapProductRow(data);
}

export async function bulkDeleteProducts(ids) {
  if (!isSupabaseConfigured) {
    deleteRows('products', ids);
    return;
  }
  const { error } = await supabase.from('products').delete().in('id', ids);
  if (error) throw error;
}

function applyFiltersLocally(products, filters) {
  let result = [...products];
  if (filters.category) result = result.filter((p) => p.category === filters.category);
  if (filters.collection) result = result.filter((p) => p.collection === filters.collection);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(q));
  }
  if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  else if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  return result;
}
