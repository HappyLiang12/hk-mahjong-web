/**
 * House Rules — customizable rule variants for Hong Kong mahjong.
 * STORY-110
 */

export interface HouseRules {
  // Scoring
  minFan: 1 | 2 | 3 | 5;
  maxFan: 8 | 10 | 13 | 'unlimited';

  // Flowers
  flowersEnabled: boolean;
  flowerBonusPoints: number;

  // Special rules
  allowSelfDrawOnly: boolean;
  allowLastTileWin: boolean;
  sevenPairsEnabled: boolean;
  thirteenOrphansEnabled: boolean;

  // Game flow
  roundWind: 'east_only' | 'east_south' | 'full';
  dealerStays: boolean;

  // Claiming
  robKongEnabled: boolean;

  // Penalties
  falseWinPenalty: number;
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  minFan: 3,
  maxFan: 13,
  flowersEnabled: true,
  flowerBonusPoints: 1,
  allowSelfDrawOnly: false,
  allowLastTileWin: true,
  sevenPairsEnabled: true,
  thirteenOrphansEnabled: true,
  roundWind: 'east_south',
  dealerStays: true,
  robKongEnabled: true,
  falseWinPenalty: 0,
};

const VALID_MIN_FAN = [1, 2, 3, 5] as const;
const VALID_MAX_FAN = [8, 10, 13, 'unlimited'] as const;
const VALID_ROUND_WIND = ['east_only', 'east_south', 'full'] as const;

export type PresetName = 'standard_hk' | 'casual' | 'competitive' | 'beginner';

const PRESETS: Record<PresetName, HouseRules> = {
  standard_hk: { ...DEFAULT_HOUSE_RULES },
  casual: {
    ...DEFAULT_HOUSE_RULES,
    minFan: 1,
    flowersEnabled: true,
    sevenPairsEnabled: true,
  },
  competitive: {
    ...DEFAULT_HOUSE_RULES,
    minFan: 3,
    maxFan: 'unlimited',
    robKongEnabled: true,
  },
  beginner: {
    ...DEFAULT_HOUSE_RULES,
    minFan: 1,
    falseWinPenalty: 0,
    flowersEnabled: false,
  },
};

export function validateHouseRules(rules: Partial<HouseRules>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (rules.minFan !== undefined && !(VALID_MIN_FAN as readonly unknown[]).includes(rules.minFan)) {
    errors.push(`Invalid minFan: ${rules.minFan}. Must be one of ${VALID_MIN_FAN.join(', ')}`);
  }

  if (rules.maxFan !== undefined && !(VALID_MAX_FAN as readonly unknown[]).includes(rules.maxFan)) {
    errors.push(`Invalid maxFan: ${rules.maxFan}. Must be one of ${VALID_MAX_FAN.join(', ')}`);
  }

  if (rules.flowerBonusPoints !== undefined && (typeof rules.flowerBonusPoints !== 'number' || rules.flowerBonusPoints < 0)) {
    errors.push(`Invalid flowerBonusPoints: must be a non-negative number`);
  }

  if (rules.roundWind !== undefined && !(VALID_ROUND_WIND as readonly string[]).includes(rules.roundWind)) {
    errors.push(`Invalid roundWind: ${rules.roundWind}. Must be one of ${VALID_ROUND_WIND.join(', ')}`);
  }

  if (rules.falseWinPenalty !== undefined && (typeof rules.falseWinPenalty !== 'number' || rules.falseWinPenalty < 0)) {
    errors.push(`Invalid falseWinPenalty: must be a non-negative number`);
  }

  // Boolean field type checks
  const boolFields: (keyof HouseRules)[] = [
    'flowersEnabled', 'allowSelfDrawOnly', 'allowLastTileWin',
    'sevenPairsEnabled', 'thirteenOrphansEnabled', 'dealerStays', 'robKongEnabled',
  ];
  for (const field of boolFields) {
    if (rules[field] !== undefined && typeof rules[field] !== 'boolean') {
      errors.push(`Invalid ${field}: must be a boolean`);
    }
  }

  // Cross-field: minFan <= maxFan (when both numeric)
  if (rules.minFan !== undefined && rules.maxFan !== undefined && rules.maxFan !== 'unlimited') {
    if (rules.minFan > rules.maxFan) {
      errors.push(`minFan (${rules.minFan}) cannot exceed maxFan (${rules.maxFan})`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function mergeWithDefaults(custom: Partial<HouseRules>): HouseRules {
  return { ...DEFAULT_HOUSE_RULES, ...custom };
}

export function getPreset(name: PresetName): HouseRules {
  return { ...PRESETS[name] };
}
