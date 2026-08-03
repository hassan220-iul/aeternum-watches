// Local-mode data layer
// ----------------------
// When Supabase isn't configured (no VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY),
// every service in src/services falls back to this module instead of showing
// "connect Supabase" placeholders. It's a small localStorage-backed store that
// gives the admin dashboard (and storefront) a fully working, persistent
// backend out of the box — products, orders, customers, invoices, activity
// logs, everything. Swap in real Supabase credentials at any time and the
// app switches to live data with zero code changes elsewhere.
//
// This is a demo/local data layer, not a security boundary — passwords are
// stored in plain text in the browser's localStorage purely so the bundled
// demo accounts (see seed() below) can "sign in" without a real auth server.

import { mockProducts, categories as mockCategories } from '../data/mockProducts';

const NS = 'aeternum_local_db_v1';
const SESSION_KEY = 'aeternum_local_session_v1';

let cache = null;

function genId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function nowIso() {
  return new Date().toISOString();
}
function daysAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function buildSeed() {
  const products = mockProducts.map((p, i) => ({
    ...p,
    is_active: true,
    image_url: null,
    created_at: daysAgo(120 - i * 3),
  }));

  const categories = mockCategories.map((c) => ({ id: c.slug, slug: c.slug, name: c.name }));

  const profiles = [
    { id: 'admin-1', full_name: 'Store Admin', email: 'admin@aeternum.test', password: 'admin123', role: 'admin', vip_status: false, loyalty_points: 0, created_at: daysAgo(200) },
    { id: 'manager-1', full_name: 'Priya Nair', email: 'manager@aeternum.test', password: 'manager123', role: 'manager', vip_status: false, loyalty_points: 0, created_at: daysAgo(180) },
    { id: 'staff-1', full_name: 'Diego Alvarez', email: 'staff@aeternum.test', password: 'staff123', role: 'staff', vip_status: false, loyalty_points: 0, created_at: daysAgo(150) },
    { id: 'cust-1', full_name: 'Isabelle Laurent', email: 'isabelle.laurent@example.com', password: 'password123', role: 'customer', vip_status: true, loyalty_points: 4200, created_at: daysAgo(140) },
    { id: 'cust-2', full_name: 'Marcus Webb', email: 'marcus.webb@example.com', password: 'password123', role: 'customer', vip_status: false, loyalty_points: 650, created_at: daysAgo(110) },
    { id: 'cust-3', full_name: 'Sofia Chen', email: 'sofia.chen@example.com', password: 'password123', role: 'customer', vip_status: true, loyalty_points: 5100, created_at: daysAgo(95) },
    { id: 'cust-4', full_name: 'James Okafor', email: 'james.okafor@example.com', password: 'password123', role: 'customer', vip_status: false, loyalty_points: 120, created_at: daysAgo(60) },
    { id: 'cust-5', full_name: 'Elena Rossi', email: 'elena.rossi@example.com', password: 'password123', role: 'customer', vip_status: false, loyalty_points: 980, created_at: daysAgo(40) },
    { id: 'cust-6', full_name: 'Tom Harrington', email: 'tom.harrington@example.com', password: 'password123', role: 'customer', vip_status: false, loyalty_points: 30, created_at: daysAgo(12) },
  ];

  const orderSeeds = [
    { id: 'ord-1', order_number: 100231, user_id: 'cust-1', status: 'completed', items: [['aet-001', 1], ['aet-004', 1]], daysBack: 58 },
    { id: 'ord-2', order_number: 100232, user_id: 'cust-3', status: 'completed', items: [['aet-006', 1]], daysBack: 51 },
    { id: 'ord-3', order_number: 100233, user_id: 'cust-2', status: 'completed', items: [['aet-002', 1]], daysBack: 40 },
    { id: 'ord-4', order_number: 100234, user_id: 'cust-4', status: 'cancelled', items: [['aet-003', 1]], daysBack: 33 },
    { id: 'ord-5', order_number: 100235, user_id: 'cust-5', status: 'completed', items: [['aet-005', 1], ['aet-003', 1]], daysBack: 27 },
    { id: 'ord-6', order_number: 100236, user_id: 'cust-1', status: 'processing', items: [['aet-002', 1]], daysBack: 15 },
    { id: 'ord-7', order_number: 100237, user_id: 'cust-6', status: 'pending', items: [['aet-005', 1]], daysBack: 8 },
    { id: 'ord-8', order_number: 100238, user_id: 'cust-3', status: 'processing', items: [['aet-004', 1]], daysBack: 5 },
    { id: 'ord-9', order_number: 100239, user_id: 'cust-2', status: 'pending', items: [['aet-001', 1]], daysBack: 2 },
    { id: 'ord-10', order_number: 100240, user_id: 'cust-5', status: 'completed', items: [['aet-006', 1]], daysBack: 70 },
  ];

  const productById = Object.fromEntries(products.map((p) => [p.id, p]));
  const orders = [];
  const order_items = [];
  orderSeeds.forEach((o) => {
    const lineItems = o.items.map(([pid, qty]) => ({ product: productById[pid], qty }));
    const subtotal = lineItems.reduce((s, li) => s + li.product.price * li.qty, 0);
    const shipping_cost = 0;
    const discount = 0;
    const total = subtotal + shipping_cost - discount;
    orders.push({
      id: o.id,
      order_number: o.order_number,
      user_id: o.user_id,
      status: o.status,
      payment_status: o.status === 'cancelled' ? 'failed' : 'paid',
      subtotal,
      discount,
      shipping_cost,
      total,
      shipping_address: null,
      created_at: daysAgo(o.daysBack),
    });
    lineItems.forEach((li) => {
      order_items.push({
        id: genId('oi'),
        order_id: o.id,
        product_id: li.product.id,
        quantity: li.qty,
        unit_price: li.product.price,
      });
    });
  });

  const refund_requests = [
    { id: genId('ref'), order_id: 'ord-4', user_id: 'cust-4', reason: 'Changed my mind about the case size.', status: 'pending', created_at: daysAgo(30) },
    { id: genId('ref'), order_id: 'ord-3', user_id: 'cust-2', reason: 'Arrived with a scratch on the clasp.', status: 'approved', created_at: daysAgo(35) },
  ];

  const invoices = [
    { id: genId('inv'), order_id: 'ord-1', invoice_number: 1, created_at: daysAgo(57) },
    { id: genId('inv'), order_id: 'ord-2', invoice_number: 2, created_at: daysAgo(50) },
    { id: genId('inv'), order_id: 'ord-10', invoice_number: 3, created_at: daysAgo(69) },
    // ord-3 and ord-5 (completed) are left un-invoiced on purpose so the
    // "Completed Orders Awaiting Invoice" panel has something to show.
  ];

  const admin_logs = [
    { id: genId('log'), action: 'signed in', table_name: 'auth', record_id: null, created_at: daysAgo(1) },
    { id: genId('log'), action: 'set order status to processing', table_name: 'orders', record_id: 'ord-6', created_at: daysAgo(15) },
    { id: genId('log'), action: 'granted VIP status', table_name: 'profiles', record_id: 'cust-3', created_at: daysAgo(95) },
    { id: genId('log'), action: 'generated invoice', table_name: 'invoices', record_id: 'ord-1', created_at: daysAgo(57) },
  ];

  const product_variants = [
    { id: genId('var'), product_id: 'aet-001', name: 'Dial Colour', value: 'Champagne', sku: 'AET-001-CH', price_delta: 0, stock: 4, created_at: daysAgo(100) },
    { id: genId('var'), product_id: 'aet-001', name: 'Dial Colour', value: 'Midnight Blue', sku: 'AET-001-MB', price_delta: 350, stock: 2, created_at: daysAgo(100) },
  ];

  const inventory = [
    { id: genId('mv'), product_id: 'aet-001', change: 10, reason: 'Initial stock', created_at: daysAgo(118) },
    { id: genId('mv'), product_id: 'aet-001', change: -4, reason: 'Sales', created_at: daysAgo(60) },
  ];

  const reviews = [
    { id: genId('rev'), product_id: 'aet-001', user_id: 'cust-1', rating: 5, body: 'Exceeded expectations — the finishing on the case back alone is worth the price.', created_at: daysAgo(90) },
    { id: genId('rev'), product_id: 'aet-001', user_id: 'cust-3', rating: 5, body: 'Ordering process and white-glove delivery were seamless.', created_at: daysAgo(70) },
    { id: genId('rev'), product_id: 'aet-002', user_id: 'cust-2', rating: 4, body: 'Beautiful chronograph, runs a touch fast but well within tolerance.', created_at: daysAgo(38) },
    { id: genId('rev'), product_id: 'aet-006', user_id: 'cust-5', rating: 5, body: 'The bracelet on this is a work of art. Worth every pound.', created_at: daysAgo(65) },
  ];

  const store_settings = {
    store_name: 'Aeternum Watches',
    support_email: 'concierge@aeternum-watches.test',
    low_stock_threshold: 5,
    whish_money_name: 'Aeternum Watches',
    whish_money_phone: '+961 70 674 606',
    updated_at: daysAgo(100),
  };

  const visitors = Array.from({ length: 42 }, (_, i) => ({ id: genId('vis'), session_id: genId('sess'), created_at: daysAgo(Math.floor(i / 2)) }));

  const discounts = [
    { id: genId('disc'), code: 'WELCOME5', percent_off: 5, active: true, expires_at: null, created_at: daysAgo(90) },
    { id: genId('disc'), code: 'VIP10', percent_off: 10, active: true, expires_at: null, created_at: daysAgo(90) },
  ];

  const feedback = [
    { id: genId('fb'), name: 'Isabelle Laurent', email: 'isabelle.laurent@example.com', message: 'The Heritage 1959 arrived beautifully packaged — exactly as described.', created_at: daysAgo(45) },
    { id: genId('fb'), name: 'Marcus Webb', email: 'marcus.webb@example.com', message: 'Would love to see more strap colour options for the Obsidian Carbon.', created_at: daysAgo(20) },
  ];

  return {
    products, categories, profiles, orders, order_items, refund_requests,
    invoices, admin_logs, product_variants, inventory, store_settings, visitors,
    discounts, feedback, reviews,
    analytics: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(NS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage and reseed
  }
  const seeded = buildSeed();
  localStorage.setItem(NS, JSON.stringify(seeded));
  return seeded;
}

function db() {
  if (!cache) cache = load();
  return cache;
}
function persist() {
  try {
    localStorage.setItem(NS, JSON.stringify(cache));
  } catch {
    // storage full or unavailable — local mode degrades to in-memory only
  }
}

export function getTable(name) {
  return db()[name] || [];
}
export function setTable(name, rows) {
  db()[name] = rows;
  persist();
  return rows;
}
export function insertRow(name, row) {
  const rows = getTable(name);
  rows.push(row);
  setTable(name, rows);
  return row;
}
export function updateRow(name, id, patch) {
  const rows = getTable(name);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...patch };
  setTable(name, rows);
  return rows[idx];
}
export function deleteRow(name, id) {
  setTable(name, getTable(name).filter((r) => r.id !== id));
}
export function deleteRows(name, ids) {
  const idSet = new Set(ids);
  setTable(name, getTable(name).filter((r) => !idSet.has(r.id)));
}
export function getSettings() {
  return db().store_settings;
}
export function setSettings(patch) {
  db().store_settings = { ...db().store_settings, ...patch };
  persist();
  return db().store_settings;
}
export function resetLocalStore() {
  cache = buildSeed();
  persist();
  return cache;
}

export { genId, nowIso };

// --- local session (used by AuthContext when Supabase isn't configured) ---
export function getLocalSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setLocalSession(userId) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
}
export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
}
