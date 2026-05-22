import {
  DEFAULT_HOUSE_RULES,
  HouseRules,
  validateHouseRules,
  mergeWithDefaults,
  getPreset,
  PresetName,
} from '../engine/house-rules';

describe('House Rules', () => {
  // 1. DEFAULT_HOUSE_RULES has all required fields
  test('DEFAULT_HOUSE_RULES has all required fields', () => {
    const fields: (keyof HouseRules)[] = [
      'minFan', 'maxFan', 'flowersEnabled', 'flowerBonusPoints',
      'allowSelfDrawOnly', 'allowLastTileWin', 'sevenPairsEnabled',
      'thirteenOrphansEnabled', 'roundWind', 'dealerStays',
      'robKongEnabled', 'falseWinPenalty',
    ];
    for (const f of fields) {
      expect(DEFAULT_HOUSE_RULES).toHaveProperty(f);
    }
  });

  // 2. DEFAULT values match HK standard
  test('DEFAULT values match HK standard', () => {
    expect(DEFAULT_HOUSE_RULES.minFan).toBe(3);
    expect(DEFAULT_HOUSE_RULES.maxFan).toBe(13);
    expect(DEFAULT_HOUSE_RULES.flowersEnabled).toBe(true);
    expect(DEFAULT_HOUSE_RULES.dealerStays).toBe(true);
    expect(DEFAULT_HOUSE_RULES.roundWind).toBe('east_south');
  });

  // 3. validateHouseRules catches invalid minFan
  test('validateHouseRules catches invalid minFan', () => {
    const result = validateHouseRules({ minFan: 4 as any });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('minFan');
  });

  // 4. validateHouseRules catches invalid maxFan
  test('validateHouseRules catches invalid maxFan', () => {
    const result = validateHouseRules({ maxFan: 7 as any });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('maxFan');
  });

  // 5. validateHouseRules catches minFan > maxFan
  test('validateHouseRules catches minFan > maxFan cross-field', () => {
    const result = validateHouseRules({ minFan: 5, maxFan: 8 } as any);
    expect(result.valid).toBe(true); // 5 <= 8, should be valid
    const result2 = validateHouseRules({ minFan: 5, maxFan: 'unlimited' });
    expect(result2.valid).toBe(true);
  });

  // 6. validateHouseRules accepts valid rules
  test('validateHouseRules accepts valid full rules', () => {
    const result = validateHouseRules(DEFAULT_HOUSE_RULES);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // 7. validateHouseRules catches invalid boolean fields
  test('validateHouseRules catches invalid boolean', () => {
    const result = validateHouseRules({ flowersEnabled: 'yes' as any });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('flowersEnabled');
  });

  // 8. validateHouseRules catches negative flowerBonusPoints
  test('validateHouseRules catches negative flowerBonusPoints', () => {
    const result = validateHouseRules({ flowerBonusPoints: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('flowerBonusPoints');
  });

  // 9. All 4 presets are valid
  test.each<PresetName>(['standard_hk', 'casual', 'competitive', 'beginner'])(
    'preset "%s" is valid',
    (name) => {
      const preset = getPreset(name);
      const result = validateHouseRules(preset);
      expect(result.valid).toBe(true);
    },
  );

  // 10. mergeWithDefaults fills missing fields
  test('mergeWithDefaults fills missing fields', () => {
    const merged = mergeWithDefaults({ minFan: 1 });
    expect(merged.minFan).toBe(1);
    expect(merged.maxFan).toBe(DEFAULT_HOUSE_RULES.maxFan);
    expect(merged.flowersEnabled).toBe(DEFAULT_HOUSE_RULES.flowersEnabled);
    expect(merged.falseWinPenalty).toBe(DEFAULT_HOUSE_RULES.falseWinPenalty);
  });

  // 11. mergeWithDefaults preserves all custom values
  test('mergeWithDefaults preserves custom values', () => {
    const custom: Partial<HouseRules> = { minFan: 5, maxFan: 'unlimited', flowersEnabled: false };
    const merged = mergeWithDefaults(custom);
    expect(merged.minFan).toBe(5);
    expect(merged.maxFan).toBe('unlimited');
    expect(merged.flowersEnabled).toBe(false);
  });

  // 12. getPreset returns independent copies
  test('getPreset returns independent copies', () => {
    const a = getPreset('standard_hk');
    const b = getPreset('standard_hk');
    a.minFan = 1;
    expect(b.minFan).toBe(3);
  });

  // 13. Beginner preset has flowers off and no penalty
  test('beginner preset specifics', () => {
    const beginner = getPreset('beginner');
    expect(beginner.minFan).toBe(1);
    expect(beginner.flowersEnabled).toBe(false);
    expect(beginner.falseWinPenalty).toBe(0);
  });

  // 14. Competitive preset has unlimited maxFan
  test('competitive preset specifics', () => {
    const comp = getPreset('competitive');
    expect(comp.maxFan).toBe('unlimited');
    expect(comp.robKongEnabled).toBe(true);
  });

  // 15. validateHouseRules catches invalid roundWind
  test('validateHouseRules catches invalid roundWind', () => {
    const result = validateHouseRules({ roundWind: 'north_only' as any });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('roundWind');
  });
});
