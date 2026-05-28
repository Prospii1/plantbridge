import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the admin client
const fromMock = vi.fn();
const upsertMock = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/server/supabase-admin', () => ({
  createSupabaseAdminClient: () => ({
    from: fromMock,
  }),
}));

vi.mock('@/lib/observability/log', () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { computeEffectiveness } from '@/lib/server/analytics/compute-effectiveness';

function makeSupabaseChain(data: unknown, error = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    upsert: upsertMock,
    data,
    error,
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  upsertMock.mockResolvedValue({ error: null });
});

describe('computeEffectiveness', () => {
  it('returns 0 when no outcome logs exist', async () => {
    fromMock.mockReturnValue(makeSupabaseChain([]));
    const count = await computeEffectiveness();
    expect(count).toBe(0);
  });

  it('returns 0 when no logs have care_plan_item_id', async () => {
    fromMock.mockReturnValue(makeSupabaseChain([]));
    const count = await computeEffectiveness();
    expect(count).toBe(0);
  });

  it('aggregates ratings per rule_id and upserts', async () => {
    const logs = [
      { rating: 5, care_plan_item_id: 'item-1' },
      { rating: 4, care_plan_item_id: 'item-1' },
      { rating: 2, care_plan_item_id: 'item-2' },
    ];
    const items = [
      { id: 'item-1', rule_id: 'rec.terpene.linalool.relaxation' },
      { id: 'item-2', rule_id: 'rec.cannabinoid.cbd.sleep' },
    ];

    let callCount = 0;
    fromMock.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSupabaseChain(logs);
      if (callCount === 2) {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          data: items,
          error: null,
        };
      }
      return {
        from: vi.fn(),
        upsert: upsertMock,
      };
    });

    const count = await computeEffectiveness();
    expect(count).toBe(2);
    expect(upsertMock).toHaveBeenCalledOnce();

    const upsertArg = upsertMock.mock.calls[0]?.[0] as Array<{
      rule_id: string;
      avg_rating: number;
      positive_rate: number;
      sample_count: number;
    }>;
    const linalool = upsertArg.find((r) => r.rule_id === 'rec.terpene.linalool.relaxation');
    expect(linalool?.avg_rating).toBe(4.5);
    expect(linalool?.positive_rate).toBe(1.0);
    expect(linalool?.sample_count).toBe(2);

    const cbd = upsertArg.find((r) => r.rule_id === 'rec.cannabinoid.cbd.sleep');
    expect(cbd?.avg_rating).toBe(2.0);
    expect(cbd?.positive_rate).toBe(0.0);
  });
});
