const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn('⚠️ Supabase server client not fully configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.server');
}

const supabase = createClient(url || 'http://localhost', serviceKey || '');

module.exports = { supabase };