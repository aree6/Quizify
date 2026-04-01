import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const key = env.supabase.serviceRoleKey;
if (key.startsWith('sb_publishable_') || key.startsWith('eyJ') || /anon/i.test(key)) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] Non-service-role key detected. RLS writes may fail.');
}
