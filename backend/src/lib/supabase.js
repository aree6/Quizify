import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function decodeJwtRole(token) {
  if (!token || !token.includes('.')) return null;
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    return typeof parsed?.role === 'string' ? parsed.role : null;
  } catch {
    return null;
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const decodedRole = decodeJwtRole(serviceRoleKey);
if (serviceRoleKey.startsWith('sb_publishable_') || serviceRoleKey.startsWith('sb_anon_') || decodedRole === 'anon') {
  console.warn(
    '[Supabase] SUPABASE_SERVICE_ROLE_KEY appears to be a publishable/anon key. Backend writes may fail due to RLS. Use the service_role key from Supabase project settings.',
  );
}

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});
