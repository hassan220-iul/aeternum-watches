import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {

  console.warn(
    '[Aeternum] Supabase env vars are missing. The app will run against local ' +
    'mock data (see src/data/mockProducts.js) until VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY are set in .env — see DEPLOYMENT_GUIDE.md.'
  );
}

export const supabase = createClient(
  url || 'https://jisudkpbysolcowesewp.supabase.co',
  anonKey || 'sb_publishable_ZgdxWbXbRwM6Xln4Kw1s5w_uLRrS7V7'
);
