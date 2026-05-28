import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { trackEvent } from '@/lib/observability/events';

const CONSENT_TERMS_VERSION = '1.0';
const CONSENT_PRIVACY_VERSION = '1.0';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/age-gate';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const adminSupabase = createSupabaseAdminClient();
        const consentedAt = new Date().toISOString();
        // Record consent only on first confirmation (consent_versions defaults to {})
        await adminSupabase
          .from('profiles')
          .update({
            consent_versions: {
              terms: { version: CONSENT_TERMS_VERSION, accepted_at: consentedAt },
              privacy: { version: CONSENT_PRIVACY_VERSION, accepted_at: consentedAt },
            },
          })
          .eq('user_id', user.id)
          .eq('consent_versions', '{}');
        await trackEvent({ event: 'signup', userId: user.id });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
