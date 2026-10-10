import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pirurcbfqcbrgbuqtmka.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcnVyY2JmcWNicmdidXF0bWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODU1NTMsImV4cCI6MjEwNTU2MTU1M30.oPNs9EzMzp796u1D9sNek_dAUli_SfSjnCyYGijNP2E';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  supabaseAnonKey !== 'demo-anon-key'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
