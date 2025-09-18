import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
  console.log('✅ SUPABASE CLIENT: Initialized');
} else {
  console.warn('⚠️ SUPABASE CLIENT: Missing env vars, client not initialized');
}

export default supabase;