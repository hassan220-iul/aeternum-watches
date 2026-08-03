import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Aeternum] Supabase env vars are missing. The app will run against local ' +
    'mock data (see src/data/mockProducts.js) until VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY are set in .env — see DEPLOYMENT_GUIDE.md.'
  );
}

// When not configured, export a client pointed at placeholder values so
// imports don't throw; every service function checks isSupabaseConfigured
// first and falls back to mock data.
export const supabase = createClient(
  url || 'https://jisudkpbysolcowesewp.supabase.co',
  anonKey || 'sb_publishable_ZgdxWbXbRwM6Xln4Kw1s5w_uLRrS7V7'
);
