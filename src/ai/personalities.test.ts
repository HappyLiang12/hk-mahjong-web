import {
  PERSONALITIES,
  getRandomPersonalities,
  applyPersonality,
  AIPersonality,
} from './personalities';

describe('AI Personalities', () => {
  test('at least 6 personalities defined', () => {
    expect(PERSONALITIES.length).toBeGreaterThanOrEqual(6);
  });

  test('each personality has all required fields', () => {
    const langs = ['en', 'zh-TW', 'zh-CN', 'ja'] as const;
    const styleKeys = ['aggressiveness', 'defensiveness', 'riskTolerance', 'patience', 'bluffFrequency'] as const;

    for (const p of PERSONALITIES) {
      expect(typeof p.id).toBe('string');
      expect(p.id.length).toBeGreaterThan(0);
      expect(typeof p.emoji).toBe('string');

      for (const lang of langs) {
        expect(typeof p.name[lang]).toBe('string');
        expect(p.name[lang].length).toBeGreaterThan(0);
        expect(typeof p.description[lang]).toBe('string');
        expect(p.description[lang].length).toBeGreaterThan(0);
      }

      for (const key of styleKeys) {
        expect(typeof p.style[key]).toBe('number');
        expect(p.style[key]).toBeGreaterThanOrEqual(0);
        expect(p.style[key]).toBeLessThanOrEqual(1);
      }
    }
  });

  test('all personality IDs are unique', () => {
    const ids = PERSONALITIES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('getRandomPersonalities returns correct count with no duplicates', () => {
    const result = getRandomPersonalities(3);
    expect(result).toHaveLength(3);
    const ids = result.map(p => p.id);
    expect(new Set(ids).size).toBe(3);
  });

  test('getRandomPersonalities throws if count exceeds available', () => {
    expect(() => getRandomPersonalities(100)).toThrow();
  });

  test('applyPersonality blends base value with trait', () => {
    const aggressive: AIPersonality = PERSONALITIES.find(p => p.id === 'young_wong')!;
    const conservative: AIPersonality = PERSONALITIES.find(p => p.id === 'uncle_chan')!;

    const aggResult = applyPersonality(0.5, 'aggressiveness', aggressive);
    const conResult = applyPersonality(0.5, 'aggressiveness', conservative);
    expect(aggResult).toBeGreaterThan(conResult);

    expect(applyPersonality(1.5, 'aggressiveness', aggressive)).toBeLessThanOrEqual(1);
    expect(applyPersonality(-0.5, 'defensiveness', conservative)).toBeGreaterThanOrEqual(0);
  });

  test('personality style values are diverse across the roster', () => {
    const styleKeys = ['aggressiveness', 'defensiveness', 'riskTolerance', 'patience', 'bluffFrequency'] as const;

    for (const key of styleKeys) {
      const values = PERSONALITIES.map(p => p.style[key]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      expect(max - min).toBeGreaterThanOrEqual(0.4);
    }
  });
});
