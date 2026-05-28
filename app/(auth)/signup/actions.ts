'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { trackEvent } from '@/lib/observability/events';

const CONSENT_TERMS_VERSION = '1.0';
const CONSENT_PRIVACY_VERSION = '1.0';

const SignupSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  consent: z.literal('on', { error: 'You must agree to the Terms and Privacy Policy.' }),
});

export type SignupState = {
  error?: string;
};

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    consent: formData.get('consent'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { data: signUpData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // When email confirmation is disabled (local dev), Supabase returns a session
  // immediately. Record consent now and go straight to the app.
  if (signUpData.session && signUpData.user) {
    const consentedAt = new Date().toISOString();
    const adminSupabase = createSupabaseAdminClient();
    await adminSupabase
      .from('profiles')
      .update({
        consent_versions: {
          terms: { version: CONSENT_TERMS_VERSION, accepted_at: consentedAt },
          privacy: { version: CONSENT_PRIVACY_VERSION, accepted_at: consentedAt },
        },
      })
      .eq('user_id', signUpData.user.id)
      .eq('consent_versions', '{}');
    await trackEvent({ event: 'signup', userId: signUpData.user.id });
    redirect('/age-gate');
  }

  // Email confirmation required — send user to wait page.
  // Consent + event are recorded in /auth/callback once the link is clicked.
  redirect('/confirm');
}
