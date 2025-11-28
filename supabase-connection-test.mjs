import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('[TEST] URL:', url);

if (!url || !anonKey) {
  console.error('[TEST] Missing URL or anon key in .env.local');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

try {
  const { data, error } = await supabase
    .from('member_monthly_balances')
    .select('id')
    .limit(1);

  if (error) {
    console.error('[TEST] Supabase error:', error);
  } else {
    console.log('[TEST] Connected! Rows in member_monthly_balances:', data.length);
  }
} catch (e) {
  console.error('[TEST] Unexpected error:', e);
}
