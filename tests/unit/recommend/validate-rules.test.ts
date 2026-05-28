import { describe, it, expect } from 'vitest';
import { validateRulesFile, RulesFileSchema } from '@/lib/server/recommend/validate-rules';

const VALID_V1: unknown = {
  version: '1.0.0',
  engine_min: '0.1.0',
  rules: [
    {
      id: 'rec.terpene.linalool.relaxation',
      category: 'terpene',
      subject: 'linalool',
      when: { all: [{ answer: 'goal.primary', in: ['relaxation', 'sleep'] }] },
      weight: 0.7,
      education_ref: 'edu.terpene.linalool',
      copy_ref: 'copy.rec.linalool.relaxation',
      deprecated: false,
    },
  ],
};

describe('RulesFileSchema', () => {
  it('accepts valid v1 JSON', () => {
    expect(() => validateRulesFile(VALID_V1)).not.toThrow();
  });

  it('rejects missing version', () => {
    const bad = { ...VALID_V1 as object, version: undefined };
    expect(() => validateRulesFile(bad)).toThrow();
  });

  it('rejects non-semver version', () => {
    const bad = { ...VALID_V1 as object, version: 'v1' };
    expect(() => validateRulesFile(bad)).toThrow();
  });

  it('rejects rule with weight > 1', () => {
    const bad = {
      ...VALID_V1 as object,
      rules: [{ ...(VALID_V1 as { rules: Array<object> }).rules[0], weight: 1.5 }],
    };
    expect(() => validateRulesFile(bad)).toThrow();
  });

  it('rejects rule with invalid id format', () => {
    const bad = {
      ...VALID_V1 as object,
      rules: [{ ...(VALID_V1 as { rules: Array<object> }).rules[0], id: 'UPPER.CASE' }],
    };
    expect(() => validateRulesFile(bad)).toThrow();
  });

  it('accepts ml_boost_eligible field', () => {
    const withBoost = {
      ...VALID_V1 as object,
      rules: [{ ...(VALID_V1 as { rules: Array<object> }).rules[0], ml_boost_eligible: true }],
    };
    expect(() => validateRulesFile(withBoost)).not.toThrow();
  });

  it('rejects duplicate rule IDs', () => {
    const withDupe = {
      ...VALID_V1 as object,
      rules: [
        (VALID_V1 as { rules: Array<object> }).rules[0],
        (VALID_V1 as { rules: Array<object> }).rules[0],
      ],
    };
    expect(() => validateRulesFile(withDupe)).toThrow(/Duplicate rule IDs/);
  });
});

describe('engine_min compatibility', () => {
  it('parses engine_min as semver string', () => {
    const result = RulesFileSchema.safeParse(VALID_V1);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.engine_min).toBe('0.1.0');
  });

  it('rejects non-semver engine_min', () => {
    const bad = { ...VALID_V1 as object, engine_min: 'latest' };
    const result = RulesFileSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});
