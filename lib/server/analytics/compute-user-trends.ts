import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient_data';

export interface UserTrendResult {
  userId: string;
  logCount: number;
  avgRating: number;
  recentAvg: number;       // avg of most recent 3 logs
  earlierAvg: number;      // avg of logs before the most recent 3
  trend: TrendDirection;
  hasSevere: boolean;
  lastLoggedAt: string | null;
}

export interface PlatformTrendSummary {
  totalUsersWithLogs: number;
  improving: number;
  declining: number;
  stable: number;
  avgPlatformRating: number;
  usersWithSevere: number;
  computedAt: string;
}

function computeTrend(ratings: number[]): TrendDirection {
  if (ratings.length < 4) return 'insufficient_data';
  const recent  = ratings.slice(-3);
  const earlier = ratings.slice(0, -3);
  const recentAvg  = recent.reduce((s, r) => s + r, 0) / recent.length;
  const earlierAvg = earlier.reduce((s, r) => s + r, 0) / earlier.length;
  const delta = recentAvg - earlierAvg;
  if (delta >= 0.5)  return 'improving';
  if (delta <= -0.5) return 'declining';
  return 'stable';
}

export async function computeUserTrends(): Promise<PlatformTrendSummary> {
  const supabase = createSupabaseAdminClient();

  const { data: logs, error } = await supabase
    .from('outcome_logs')
    .select('user_id, rating, logged_at, metadata')
    .order('logged_at', { ascending: true });

  if (error) {
    log.error('user_trends_fetch_failed', { error: error.message });
    throw new Error(error.message);
  }

  if (!logs || logs.length === 0) {
    return {
      totalUsersWithLogs: 0,
      improving: 0,
      declining: 0,
      stable: 0,
      avgPlatformRating: 0,
      usersWithSevere: 0,
      computedAt: new Date().toISOString(),
    };
  }

  // Group by user
  const byUser = new Map<string, typeof logs>();
  for (const l of logs) {
    const uid = l.user_id as string;
    const bucket = byUser.get(uid) ?? [];
    bucket.push(l);
    byUser.set(uid, bucket);
  }

  const results: UserTrendResult[] = [];
  let allRatings: number[] = [];

  for (const [userId, userLogs] of Array.from(byUser.entries())) {
    const ratings = userLogs.map((l) => l.rating as number);
    allRatings = allRatings.concat(ratings);

    const recent  = ratings.slice(-3);
    const earlier = ratings.slice(0, -3);
    const recentAvg  = recent.length  > 0 ? recent.reduce((s, r) => s + r, 0)  / recent.length  : 0;
    const earlierAvg = earlier.length > 0 ? earlier.reduce((s, r) => s + r, 0) / earlier.length : recentAvg;
    const avgRating  = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const hasSevere  = userLogs.some((l) => {
      const meta = (l.metadata ?? {}) as Record<string, unknown>;
      return meta.side_effects === 'severe';
    });
    const lastLog = userLogs[userLogs.length - 1];

    results.push({
      userId,
      logCount: ratings.length,
      avgRating: Math.round(avgRating * 100) / 100,
      recentAvg:  Math.round(recentAvg  * 100) / 100,
      earlierAvg: Math.round(earlierAvg * 100) / 100,
      trend: computeTrend(ratings),
      hasSevere,
      lastLoggedAt: lastLog ? (lastLog.logged_at as string) : null,
    });
  }

  const improving      = results.filter((r) => r.trend === 'improving').length;
  const declining      = results.filter((r) => r.trend === 'declining').length;
  const stable         = results.filter((r) => r.trend === 'stable').length;
  const usersWithSevere = results.filter((r) => r.hasSevere).length;
  const avgPlatformRating = allRatings.length > 0
    ? Math.round((allRatings.reduce((s, r) => s + r, 0) / allRatings.length) * 100) / 100
    : 0;

  const summary: PlatformTrendSummary = {
    totalUsersWithLogs: results.length,
    improving,
    declining,
    stable,
    avgPlatformRating,
    usersWithSevere,
    computedAt: new Date().toISOString(),
  };

  log.info('user_trends_computed', { ...summary });
  return summary;
}
