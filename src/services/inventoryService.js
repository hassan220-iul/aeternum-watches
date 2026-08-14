import { supabase, isSupabaseConfigured } from './supabaseClient';
import { sendWhatsAppNotification } from './whatsappService';
import { getTable, insertRow, updateRow, genId, nowIso } from './localStore';

export async function adjustStock(product, change, reason) {
  const newStock = Math.max(0, product.stock + change);

  if (!isSupabaseConfigured) {
    updateRow('products', product.id, { stock: newStock });
    insertRow('inventory', { id: genId('mv'), product_id: product.id, change, reason, created_at: nowIso() });
    if (newStock <= 5) {
      await sendWhatsAppNotification('low_stock', { productName: product.name, stock: newStock });
    }
    return newStock;
  }

  const { error: productError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', product.id);
  if (productError) throw productError;

  const { error: logError } = await supabase
    .from('inventory')
    .insert({ product_id: product.id, change, reason });
  if (logError) throw logError;

  if (newStock <= 5) {
    await sendWhatsAppNotification('low_stock', { productName: product.name, stock: newStock });
  }
  return newStock;
}

export async function fetchInventoryLog(productId) {
  if (!isSupabaseConfigured) {
    return getTable('inventory')
      .filter((l) => l.product_id === productId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
