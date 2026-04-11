import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

console.log('Supabase URL:', supabaseUrl ? '✓ Configured' : '✗ Missing');
console.log('Supabase Key:', supabaseAnonKey ? '✓ Configured' : '✗ Missing');