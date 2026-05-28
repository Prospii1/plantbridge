import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// RLS-respecting server client — reads session from cookies.
// Safe to use in Server Components and Server Actions.
// Does NOT bypass RLS. For admin operations use supabase-admin.ts.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from Server Components where cookies are read-only.
            // The middleware handles cookie refresh for those cases.
          }
        },
      },
    },
  );
}
