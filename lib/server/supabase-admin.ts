import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS.
// ONLY import this file from lib/server/ or supabase/functions/.
// Never import from app/, components/, or lib/client/.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.',
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
