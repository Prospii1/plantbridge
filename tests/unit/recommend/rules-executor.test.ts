import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ml-scorer so tests don't need a real DB
vi.mock('@/lib/server/recommend/ml-scorer', () => ({
  mlBoost: vi.fn().mockResolvedValue(0),
}));

// Mock supabase-admin (transitively required by ml-scorer before mock kicks in)
vi.mock('@/lib/server/supabase-admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { executeRules, type RecommendationRule } from '@/lib/server/recommend/rules-executor';
import { mlBoost } from '@/lib/server/recommend/ml-scorer';

const mlBoostMock = vi.mocked(mlBoost);

function makeRule(overrides: Partial<RecommendationRule> = {}): RecommendationRule {
  return {
    id: 'rec.test.rule',
    category: 'terpene',
    subject: 'linalool',
    when: { all: [{ answer: 'goal.primary', in: ['relaxation'] }] },
    weight: 0.7,
    education_ref: 'edu.test',
    copy_ref: 'copy.test',
    deprecated: false,
    ...overrides,
  };
}

beforeEach(() => {
  mlBoostMock.mockResolvedValue(0);
});

describe('executeRules — condition operators', () => {
  it('matches `in` condition when value is in list', async () => {
    const rule = makeRule({ when: { all: [{ answer: 'goal', in: ['sleep', 'relaxation'] }] } });
    const matches = await executeRules([rule], { goal: 'sleep' });
    expect(matches).toHaveLength(1);
    expect(matches[0]?.ruleId).toBe('rec.test.rule');
  });

  it('does not match `in` condition when value is not in list', async () => {
    const rule = makeRule({ when: { all: [{ answer: 'goal', in: ['sleep'] }] } });
    const matches = await executeRules([rule], { goal: 'focus' });
    expect(matches).toHaveLength(0);
  });

  it('matches `gte` condition', async () => {
    const rule = makeRule({ when: { all: [{ answer: 'severity', gte: 3 }] } });
    expect(await executeRules([rule], { severity: 3 })).toHaveLength(1);
    expect(await executeRules([rule], { severity: 5 })).toHaveLength(1);
    expect(await executeRules([rule], { severity: 2 })).toHaveLength(0);
  });

  it('matches `lte` condition', async () => {
    const rule = makeRule({ when: { all: [{ answer: 'severity', lte: 3 }] } });
    expect(await executeRules([rule], { severity: 3 })).toHaveLength(1);
    expect(await executeRules([rule], { severity: 1 })).toHaveLength(1);
    expect(await executeRules([rule], { severity: 4 })).toHaveLength(0);
  });

  it('matches `eq` condition', async () => {
    const rule = makeRule({ when: { all: [{ answer: 'level', eq: 'beginner' }] } });
    expect(await executeRules([rule], { level: 'beginner' })).toHaveLength(1);
    expect(await executeRules([rule], { level: 'expert' })).toHaveLength(0);
  });

  it('matches `all` — all sub-conditions must pass', async () => {
    const rule = makeRule({
      when: { all: [{ answer: 'goal', in: ['sleep'] }, { answer: 'severity', gte: 3 }] },
    });
    expect(await executeRules([rule], { goal: 'sleep', severity: 4 })).toHaveLength(1);
    expect(await executeRules([rule], { goal: 'sleep', severity: 2 })).toHaveLength(0);
    expect(await executeRules([rule], { goal: 'focus', severity: 4 })).toHaveLength(0);
  });

  it('matches `any` — at least one sub-condition must pass', async () => {
    const rule = makeRule({
      when: { any: [{ answer: 'goal', in: ['sleep'] }, { answer: 'goal', in: ['relaxation'] }] },
    });
    expect(await executeRules([rule], { goal: 'sleep' })).toHaveLength(1);
    expect(await executeRules([rule], { goal: 'relaxation' })).toHaveLength(1);
    expect(await executeRules([rule], { goal: 'focus' })).toHaveLength(0);
  });
});

describe('executeRules — rule lifecycle', () => {
  it('skips deprecated rules', async () => {
    const rule = makeRule({ deprecated: true });
    expect(await executeRules([rule], { 'goal.primary': 'relaxation' })).toHaveLength(0);
  });

  it('sorts results by confidence descending', async () => {
    const low = makeRule({ id: 'rec.low', weight: 0.5, when: { all: [{ answer: 'x', eq: 'y' }] } });
    const high = makeRule({ id: 'rec.high', weight: 0.9, when: { all: [{ answer: 'x', eq: 'y' }] } });
    const matches = await executeRules([low, high], { x: 'y' });
    expect(matches[0]?.ruleId).toBe('rec.high');
    expect(matches[1]?.ruleId).toBe('rec.low');
  });
});

describe('executeRules — ML boost', () => {
  it('adds boost to ml_boost_eligible rules', async () => {
    mlBoostMock.mockResolvedValue(0.2);
    const rule = makeRule({ weight: 0.7, ml_boost_eligible: true });
    const matches = await executeRules([rule], { 'goal.primary': 'relaxation' });
    expect(matches[0]?.confidence).toBeCloseTo(0.9);
  });

  it('caps boosted confidence at 1.0', async () => {
    mlBoostMock.mockResolvedValue(0.2);
    const rule = makeRule({ weight: 0.95, ml_boost_eligible: true });
    const matches = await executeRules([rule], { 'goal.primary': 'relaxation' });
    expect(matches[0]?.confidence).toBe(1.0);
  });

  it('does not boost rules without ml_boost_eligible', async () => {
    mlBoostMock.mockResolvedValue(0.2);
    const rule = makeRule({ weight: 0.7, ml_boost_eligible: false });
    const matches = await executeRules([rule], { 'goal.primary': 'relaxation' });
    expect(matches[0]?.confidence).toBeCloseTo(0.7);
    expect(mlBoostMock).not.toHaveBeenCalled();
  });
});

describe('v1 rules — linalool fires on relaxation/sleep goal', () => {
  const linalool: RecommendationRule = {
    id: 'rec.terpene.linalool.relaxation',
    category: 'terpene',
    subject: 'linalool',
    when: { all: [{ answer: 'goal.primary', in: ['relaxation', 'sleep'] }] },
    weight: 0.7,
    education_ref: 'edu.terpene.linalool',
    copy_ref: 'copy.rec.linalool.relaxation',
    deprecated: false,
  };

  it('fires on relaxation', async () => {
    const m = await executeRules([linalool], { 'goal.primary': 'relaxation' });
    expect(m).toHaveLength(1);
  });

  it('fires on sleep', async () => {
    const m = await executeRules([linalool], { 'goal.primary': 'sleep' });
    expect(m).toHaveLength(1);
  });

  it('does not fire on focus', async () => {
    const m = await executeRules([linalool], { 'goal.primary': 'focus' });
    expect(m).toHaveLength(0);
  });
});

describe('v1 rules — cbd fires on sleep with severity >= 3', () => {
  const cbd: RecommendationRule = {
    id: 'rec.cannabinoid.cbd.sleep',
    category: 'cannabinoid',
    subject: 'cbd',
    when: { all: [{ answer: 'goal.primary', in: ['sleep'] }, { answer: 'severity.sleep', gte: 3 }] },
    weight: 0.75,
    education_ref: 'edu.cannabinoid.cbd',
    copy_ref: 'copy.rec.cbd.sleep',
    deprecated: false,
  };

  it('fires on sleep + severity 3', async () => {
    expect(await executeRules([cbd], { 'goal.primary': 'sleep', 'severity.sleep': 3 })).toHaveLength(1);
  });

  it('does not fire on sleep + severity 2', async () => {
    expect(await executeRules([cbd], { 'goal.primary': 'sleep', 'severity.sleep': 2 })).toHaveLength(0);
  });

  it('does not fire on relaxation + severity 5', async () => {
    expect(await executeRules([cbd], { 'goal.primary': 'relaxation', 'severity.sleep': 5 })).toHaveLength(0);
  });
});
