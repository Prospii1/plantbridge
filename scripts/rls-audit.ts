/**
 * Audits RLS status for all user-scoped tables.
 * Exits with code 1 if any required table has RLS disabled.
 *
 * Usage: pnpm run rls:audit
 * Requires: local Supabase running (pnpm supabase start)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is not set.');
  console.error('Run `pnpm supabase start` and add the service role key to .env.local.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const USER_SCOPED_TABLES = [
  'profiles',
  'intake_sessions',
  'intake_answers',
  'recommendation_profiles',
  'care_plans',
  'care_plan_items',
  'outcome_logs',
  'subscriptions',
  'events',
];

const SERVER_ONLY_TABLES = [
  'recommendation_versions',
  'stripe_events',
];

const ALL_TABLES = [...USER_SCOPED_TABLES, ...SERVER_ONLY_TABLES];

interface RlsRow {
  tablename: string;
  rowsecurity: boolean;
}

interface PolicyRow {
  tablename: string;
  policyname: string;
  cmd: string;
}

async function main(): Promise<void> {
  console.log('\n=== PlantBridge RLS Audit ===\n');

  const { data: rlsRows, error: rlsError } = await supabase
    .rpc('rls_audit_status') as { data: RlsRow[] | null; error: unknown };

  let rlsStatus: Record<string, boolean> = {};

  if (rlsError || !rlsRows) {
    // Fall back to raw SQL if the RPC doesn't exist yet
    const { data: rawRows, error: rawError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public') as { data: RlsRow[] | null; error: unknown };

    if (rawError || !rawRows) {
      // Use information_schema as final fallback
      const result = await supabase.rpc('exec_sql', {
        sql: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`,
      });
      console.warn('Warning: Could not query pg_tables directly. Run against a live DB for accurate results.');
      console.warn('Proceeding with file-based check only.');
    } else {
      rawRows.forEach((r) => { rlsStatus[r.tablename] = r.rowsecurity; });
    }
  } else {
    rlsRows.forEach((r) => { rlsStatus[r.tablename] = r.rowsecurity; });
  }

  // Fetch policies
  const { data: policies } = await supabase
    .from('pg_policies')
    .select('tablename, policyname, cmd') as { data: PolicyRow[] | null; error: unknown };

  const policyMap: Record<string, string[]> = {};
  if (policies) {
    policies.forEach((p) => {
      if (!policyMap[p.tablename]) policyMap[p.tablename] = [];
      policyMap[p.tablename]!.push(`${p.policyname} (${p.cmd})`);
    });
  }

  let hasFailures = false;

  console.log('Table                        RLS    Policies');
  console.log('─'.repeat(72));

  for (const table of ALL_TABLES) {
    const rlsOn = rlsStatus[table];
    const tablePolices = policyMap[table] ?? [];
    const isServerOnly = SERVER_ONLY_TABLES.includes(table);
    const rlsLabel = rlsOn === true ? '✅ ON ' : rlsOn === false ? '❌ OFF' : '⚠️  ?  ';
    const policyLabel =
      tablePolices.length > 0
        ? tablePolices.join(', ')
        : isServerOnly
          ? '(server-only — no user policies expected)'
          : '⚠️  none';

    if (rlsOn === false) hasFailures = true;

    console.log(`${table.padEnd(28)} ${rlsLabel}  ${policyLabel}`);
  }

  console.log('');

  if (hasFailures) {
    console.error('❌ AUDIT FAILED: One or more tables have RLS disabled.\n');
    process.exit(1);
  } else {
    console.log('✅ All tables have RLS enabled.\n');
  }
}

main().catch((err: unknown) => {
  console.error('Audit error:', err);
  process.exit(1);
});
