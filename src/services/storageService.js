import { supabase, isSupabaseConfigured } from './supabaseClient';

const BUCKET = 'product-images';

export async function uploadProductImage(file, productSlug) {
  if (!isSupabaseConfigured) {

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.readAsDataURL(file);
    });
  }

  const ext = file.name.split('.').pop();
  const path = `${productSlug}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
