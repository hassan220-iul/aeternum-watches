import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import {
  fetchProducts, createProduct, updateProduct, deleteProduct, duplicateProduct, bulkDeleteProducts,
} from '../../services/productsService';
import { fetchCategories, addCategory, deleteCategory } from '../../services/categoriesService';
import { fetchVariants, addVariant, deleteVariant } from '../../services/variantsService';
import { adjustStock, fetchInventoryLog } from '../../services/inventoryService';
import { uploadProductImage } from '../../services/storageService';
import { logAdminAction } from '../../services/adminService';
import { sendWhatsAppNotification } from '../../services/whatsappService';
import { formatCurrency } from '../../utils/formatCurrency';

const LOW_STOCK_THRESHOLD = 5;
const emptyForm = { name: '', slug: '', price: '', category: '', collection: '', stock: '', image_url: '', model_url: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [variantsProduct, setVariantsProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({ name: '', value: '', sku: '', priceDelta: '', stock: '' });

  const [inventoryProduct, setInventoryProduct] = useState(null);
  const [inventoryLog, setInventoryLog] = useState([]);
  const [stockDelta, setStockDelta] = useState('');
  const [stockReason, setStockReason] = useState('');

  async function reload() {
    const data = await fetchProducts({ search });
    setProducts(data);
    setSelected([]);
  }
  async function reloadCategories() {
    setCategories(await fetchCategories());
  }

  useEffect(() => { reload(); }, [search]);
  useEffect(() => { reloadCategories(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }
  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, price: p.price, category: p.category,
      collection: p.collection, stock: p.stock, image_url: p.image_url || '', model_url: p.model_url || '',
    });
    setModalOpen(true);
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const slugForFile = form.slug || form.name.toLowerCase().replace(/\s+/g, '-') || 'product';
      const url = await uploadProductImage(file, slugForFile);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      price: Number(form.price),
      category: form.category,
      collection: form.collection,
      stock: Number(form.stock),
      image_url: form.image_url || null,
      model_url: form.model_url || null,
      is_active: true,
    };
    if (editing) {
      await updateProduct(editing.id, payload);
      await logAdminAction('edited product', 'products', editing.id);
    } else {
      const created = await createProduct(payload);
      await logAdminAction('created product', 'products', created?.id);
    }
    if (payload.stock <= LOW_STOCK_THRESHOLD) {
      await sendWhatsAppNotification('low_stock', { productName: payload.name, stock: payload.stock });
    }
    setModalOpen(false);
    reload();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product permanently?')) return;
    await deleteProduct(id);
    await logAdminAction('deleted product', 'products', id);
    reload();
  }

  async function handleDuplicate(p) {
    const created = await duplicateProduct(p);
    await logAdminAction('duplicated product', 'products', created?.id);
    reload();
  }

  async function handleBulkDelete() {
    if (selected.length === 0) return;
    if (!confirm(`Delete ${selected.length} products?`)) return;
    await bulkDeleteProducts(selected);
    await logAdminAction(`bulk deleted ${selected.length} products`, 'products');
    reload();
  }

  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await addCategory(newCategoryName.trim());
    setNewCategoryName('');
    reloadCategories();
  }
  async function handleDeleteCategory(id) {
    if (!confirm('Delete this category?')) return;
    await deleteCategory(id);
    reloadCategories();
  }

  async function openVariants(p) {
    setVariantsProduct(p);
    setVariants(await fetchVariants(p.id));
  }
  async function handleAddVariant(e) {
    e.preventDefault();
    if (!variantsProduct) return;
    await addVariant(variantsProduct.id, {
      name: variantForm.name,
      value: variantForm.value,
      sku: variantForm.sku || null,
      price_delta: Number(variantForm.priceDelta) || 0,
      stock: Number(variantForm.stock) || 0,
    });
    setVariantForm({ name: '', value: '', sku: '', priceDelta: '', stock: '' });
    setVariants(await fetchVariants(variantsProduct.id));
  }
  async function handleDeleteVariant(id) {
    await deleteVariant(id);
    setVariants(await fetchVariants(variantsProduct.id));
  }

  async function openInventory(p) {
    setInventoryProduct(p);
    setInventoryLog(await fetchInventoryLog(p.id));
  }
  async function handleAdjustStock(e) {
    e.preventDefault();
    if (!inventoryProduct || !stockDelta) return;
    await adjustStock(inventoryProduct, Number(stockDelta), stockReason || 'Manual adjustment');
    await logAdminAction(`adjusted stock by ${stockDelta}`, 'products', inventoryProduct.id);
    setStockDelta('');
    setStockReason('');
    setInventoryLog(await fetchInventoryLog(inventoryProduct.id));
    reload();
  }

  return (
    <div>
      <h1 className="admin-page-title">Products</h1>

      <div className="admin-toolbar">
        <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div>
          <button className="admin-btn" onClick={() => setCategoryModalOpen(true)}>Categories</button>
          {selected.length > 0 && <button className="admin-btn danger" onClick={handleBulkDelete}>Bulk Delete ({selected.length})</button>}
          <button className="admin-btn solid" onClick={openCreate}>+ Add Product</button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <p className="admin-empty">Managing the local catalog — every action here (add, edit, duplicate, delete, variants, inventory) is saved in your browser. Connect Supabase for a live, shared catalog with real image storage.</p>
      )}

      {products.some((p) => p.stock <= LOW_STOCK_THRESHOLD) && (
        <div style={{ border: '1px solid rgba(220,120,120,0.35)', background: 'rgba(220,120,120,0.08)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <strong style={{ color: '#dc7878', fontSize: '0.85rem' }}>Low Stock Alerts</strong>
          <ul style={{ listStyle: 'none', margin: '0.6rem 0 0', padding: 0, fontSize: '0.85rem' }}>
            {products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).map((p) => (
              <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                <span>{p.name} — {p.stock} left</span>
                <button className="admin-btn" onClick={() => openInventory(p)}>Restock</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th><th>Name</th><th>Category</th><th>Collection</th><th>Price</th><th>Stock</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.collection}</td>
                <td>{formatCurrency(p.price, p.currency)}</td>
                <td>
                  {p.stock}
                  {p.stock <= LOW_STOCK_THRESHOLD && <span className="status-pill cancelled" style={{ marginLeft: '0.5rem' }}>Low</span>}
                </td>
                <td>
                  <button className="admin-btn" onClick={() => openEdit(p)}>Edit</button>
                  <button className="admin-btn" onClick={() => handleDuplicate(p)}>Duplicate</button>
                  <button className="admin-btn" onClick={() => openVariants(p)}>Variants</button>
                  <button className="admin-btn" onClick={() => openInventory(p)}>Inventory</button>
                  <button className="admin-btn danger" onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSave}>
              <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label>Slug (optional)<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
              <label>Price (USD)<input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
              <label>
                Category
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select…</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </label>
              <label>Collection<input value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })} /></label>
              <label>Stock<input required type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
              <label>
                Product Image (upload a file)
                <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
              </label>
              <label>
                Or paste an image URL
                <input
                  type="url"
                  placeholder="https://example.com/watch.jpg"
                  value={form.image_url && form.image_url.startsWith('data:') ? '' : form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                />
              </label>
              {uploading && <p style={{ fontSize: '0.8rem', color: '#d4af37' }}>Uploading…</p>}
              {form.image_url && <img src={form.image_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', marginBottom: '1rem' }} />}
              <label>
                3D Model URL (optional — a .glb file link)
                <input
                  type="url"
                  placeholder="https://example.com/watch.glb"
                  value={form.model_url}
                  onChange={(e) => setForm({ ...form, model_url: e.target.value })}
                />
              </label>
              <p style={{ fontSize: '0.72rem', color: 'rgba(245,242,234,0.45)', marginTop: '-0.6rem', marginBottom: '1rem' }}>
                Leave blank to show the built-in animated placeholder in the "3D View" tab instead.
              </p>
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn solid" disabled={uploading}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCategoryModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Categories</h2>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input placeholder="New category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" className="admin-btn solid">Add</button>
            </form>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {categories.map((c) => (
                <li key={c.slug} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {c.name}
                  {c.id && <button className="admin-btn danger" onClick={() => handleDeleteCategory(c.id)}>Delete</button>}
                </li>
              ))}
            </ul>
            <div className="admin-modal__actions">
              <button className="admin-btn" onClick={() => setCategoryModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {variantsProduct && (
        <div className="admin-modal-backdrop" onClick={() => setVariantsProduct(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Variants — {variantsProduct.name}</h2>
            <form onSubmit={handleAddVariant} style={{ marginBottom: '1.25rem' }}>
              <label>Option Name (e.g. Dial Color)<input required value={variantForm.name} onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })} /></label>
              <label>Value (e.g. Midnight Blue)<input required value={variantForm.value} onChange={(e) => setVariantForm({ ...variantForm, value: e.target.value })} /></label>
              <label>SKU (optional)<input value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} /></label>
              <label>Price Adjustment (+/-)<input type="number" value={variantForm.priceDelta} onChange={(e) => setVariantForm({ ...variantForm, priceDelta: e.target.value })} /></label>
              <label>Stock<input type="number" value={variantForm.stock} onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })} /></label>
              <button type="submit" className="admin-btn solid">Add Variant</button>
            </form>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {variants.length === 0 ? <p className="admin-empty">No variants yet.</p> : variants.map((v) => (
                <li key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>{v.name}: {v.value} {v.price_delta ? `(${v.price_delta > 0 ? '+' : ''}${v.price_delta})` : ''} — {v.stock} in stock</span>
                  <button className="admin-btn danger" onClick={() => handleDeleteVariant(v.id)}>Delete</button>
                </li>
              ))}
            </ul>
            <div className="admin-modal__actions">
              <button className="admin-btn" onClick={() => setVariantsProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {inventoryProduct && (
        <div className="admin-modal-backdrop" onClick={() => setInventoryProduct(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Inventory — {inventoryProduct.name}</h2>
            <p style={{ color: 'rgba(245,242,234,0.6)', marginBottom: '1rem' }}>Current stock: <strong>{inventoryProduct.stock}</strong></p>
            <form onSubmit={handleAdjustStock} style={{ marginBottom: '1.25rem' }}>
              <label>Change (use negative to remove, e.g. -3)<input required type="number" value={stockDelta} onChange={(e) => setStockDelta(e.target.value)} /></label>
              <label>Reason<input value={stockReason} onChange={(e) => setStockReason(e.target.value)} placeholder="Restock, sale correction, damage…" /></label>
              <button type="submit" className="admin-btn solid">Apply Adjustment</button>
            </form>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Movement Log</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 220, overflowY: 'auto' }}>
              {inventoryLog.length === 0 ? <p className="admin-empty">No movements logged yet.</p> : inventoryLog.map((l) => (
                <li key={l.id} style={{ padding: '0.5rem 0', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem' }}>
                  {l.change > 0 ? '+' : ''}{l.change} — {l.reason} <span style={{ color: 'rgba(245,242,234,0.4)' }}>({new Date(l.created_at).toLocaleString()})</span>
                </li>
              ))}
            </ul>
            <div className="admin-modal__actions">
              <button className="admin-btn" onClick={() => setInventoryProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
