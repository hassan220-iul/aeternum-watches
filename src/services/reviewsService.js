import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTable, insertRow, setTable, updateRow, genId, nowIso } from './localStore';

function withLocalReviewer(review) {
  const profile = getTable('profiles').find((p) => p.id === review.user_id);
  return { ...review, profiles: profile ? { full_name: profile.full_name } : null };
}

function recomputeLocalProductRating(productId) {
  const reviews = getTable('reviews').filter((r) => r.product_id === productId);
  const reviewCount = reviews.length;
  const rating = reviewCount > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
    : 0;
  updateRow('products', productId, { rating, reviewCount });
}

export async function fetchReviews(productId) {
  if (!isSupabaseConfigured) {
    return getTable('reviews')
      .filter((r) => r.product_id === productId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(withLocalReviewer);
  }
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(full_name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchUserReview(productId, userId) {
  if (!userId) return null;
  if (!isSupabaseConfigured) {
    return getTable('reviews').find((r) => r.product_id === productId && r.user_id === userId) || null;
  }
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle();
  return data || null;
}

export async function submitReview(productId, userId, rating, body) {
  if (!userId) throw new Error('You need to be signed in to leave a review.');

  if (!isSupabaseConfigured) {
    const existing = getTable('reviews').find((r) => r.product_id === productId && r.user_id === userId);
    let saved;
    if (existing) {
      saved = updateRow('reviews', existing.id, { rating, body, created_at: nowIso() });
    } else {
      saved = insertRow('reviews', { id: genId('rev'), product_id: productId, user_id: userId, rating, body, created_at: nowIso() });
    }
    recomputeLocalProductRating(productId);
    return saved;
  }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('reviews')
      .update({ rating, body })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({ product_id: productId, user_id: userId, rating, body })
    .select()
    .single();
  if (error) throw error;
  return data;
}
