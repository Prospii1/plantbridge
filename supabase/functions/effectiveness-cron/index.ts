// Supabase Edge Function — daily effectiveness recompute (02:00 UTC)
// Schedule via Supabase Dashboard → Edge Functions → effectiveness-cron → Schedule: "0 2 * * *"

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(async () => {
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL');
  const cronSecret = Deno.env.get('CRON_SECRET');

  if (!appUrl || !cronSecret) {
    return new Response(
      JSON.stringify({ error: 'Missing NEXT_PUBLIC_APP_URL or CRON_SECRET env vars' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const res = await fetch(`${appUrl}/api/analytics/effectiveness`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const body = await res.json();
  return new Response(JSON.stringify(body), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
});
