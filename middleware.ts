import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAllowedState } from '@/lib/shared/config/allowed-states';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — must happen before any redirects.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      // Supabase not yet running locally — pass through so marketing/auth pages load.
      console.warn('[middleware] Supabase unreachable, passing through (dev only):', (err as Error).message);
      return supabaseResponse;
    }
    throw err;
  }

  const { pathname } = request.nextUrl;

  // ── Unauthenticated users hitting protected routes → login ────────────────
  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // ── Authenticated users: enforce age gate and state gate ──────────────────
  if (user && isProtectedPath(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('age_verified_at, state')
      .eq('user_id', user.id)
      .single();

    // Age gate: must confirm 21+ before accessing the app.
    if (!profile?.age_verified_at && !pathname.startsWith('/age-gate')) {
      const url = request.nextUrl.clone();
      url.pathname = '/age-gate';
      return NextResponse.redirect(url);
    }

    // State gate: must select an allowed state after age verification.
    if (
      profile?.age_verified_at &&
      (!profile.state || !isAllowedState(profile.state)) &&
      !pathname.startsWith('/state-select') &&
      pathname !== '/not-available'
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/state-select';
      return NextResponse.redirect(url);
    }

    // Short-circuit: if fully onboarded user hits age-gate or state-select, send forward.
    if (
      profile?.age_verified_at &&
      profile.state &&
      isAllowedState(profile.state) &&
      (pathname.startsWith('/age-gate') || pathname.startsWith('/state-select'))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/age-gate') ||
    pathname.startsWith('/state-select') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/care-plan') ||
    pathname.startsWith('/tracking') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/education') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/book') ||
    pathname.startsWith('/locator') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/coach') ||
    pathname.startsWith('/partner')
  );
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/stripe/webhook).*)',
  ],
};
