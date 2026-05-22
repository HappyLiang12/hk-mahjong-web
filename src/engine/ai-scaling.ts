/**
 * Dynamic AI Difficulty Scaling
 *
 * Adapts AI difficulty based on the player's skill level to keep
 * games in the "fun zone" (~30-40% player win rate).
 */

export interface PlayerSkillProfile {
  estimatedLevel: number;     // 1-10 scale
  recentWinRate: number;      // last 20 games
  averageAccuracy: number;    // from hand analyzer (0-1)
  averageFan: number;
  gamesPlayed: number;
  lastUpdated: string;
}

export interface ScalingConfig {
  enabled: boolean;
  targetWinRate: number;      // aim for ~30-40% player win rate (fun zone)
  adjustmentSpeed: number;    // how fast to adapt (0.1 = slow, 0.5 = fast)
  minLevel: number;
  maxLevel: number;
}

export interface EffectiveDifficulty {
  mistakeProbability: number;   // chance AI makes a suboptimal play (0-1)
  dangerAwareness: number;      // how well AI reads danger (0-1)
  patternPursuitDepth: number;  // how far ahead AI plans (1-5)
  claimAggressiveness: number;  // how eagerly AI claims (0-1)
}

export const DEFAULT_SCALING_CONFIG: ScalingConfig = {
  enabled: false,
  targetWinRate: 0.35,
  adjustmentSpeed: 0.3,
  minLevel: 1,
  maxLevel: 10,
};

export const DEFAULT_SKILL_PROFILE: PlayerSkillProfile = {
  estimatedLevel: 5,
  recentWinRate: 0,
  averageAccuracy: 0.5,
  averageFan: 3,
  gamesPlayed: 0,
  lastUpdated: new Date().toISOString(),
};

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate AI effective difficulty parameters based on player skill.
 *
 * Higher player level → stronger AI (fewer mistakes, better awareness).
 * The system aims to keep the player near the target win rate.
 */
export function getEffectiveDifficulty(
  profile: PlayerSkillProfile,
  config: ScalingConfig,
): EffectiveDifficulty {
  const level = clamp(profile.estimatedLevel, config.minLevel, config.maxLevel);
  // Normalize level to 0-1 range within config bounds
  const range = config.maxLevel - config.minLevel;
  const t = range > 0 ? (level - config.minLevel) / range : 0.5;

  // Win-rate adjustment: if player wins too much, make AI harder; too little, easier
  const winRateDelta = profile.recentWinRate - config.targetWinRate;
  const adjustment = winRateDelta * config.adjustmentSpeed;

  // Effective strength (0 = weakest, 1 = strongest)
  const strength = clamp(t + adjustment, 0, 1);

  return {
    // Weak AI makes more mistakes; strong AI almost never does
    mistakeProbability: clamp(1 - strength, 0, 1),
    // Danger awareness scales linearly with strength
    dangerAwareness: clamp(strength, 0, 1),
    // Pursuit depth: 1-5 mapped from strength
    patternPursuitDepth: Math.round(1 + strength * 4),
    // Claim aggressiveness: moderate floor so AI isn't completely passive
    claimAggressiveness: clamp(0.2 + strength * 0.7, 0, 1),
  };
}

/**
 * Calculate AI effective difficulty (alias for barrel export compatibility).
 */
export function calculateEffectiveDifficulty(
  profile: PlayerSkillProfile,
  config: ScalingConfig,
): EffectiveDifficulty {
  return getEffectiveDifficulty(profile, config);
}

/**
 * Update the player's skill profile after a game result.
 * Uses exponential moving average for smooth adaptation.
 */
export function updateSkillProfile(
  profile: PlayerSkillProfile,
  gameResult: { won: boolean; accuracy: number; fan: number },
): PlayerSkillProfile {
  const gamesPlayed = profile.gamesPlayed + 1;

  // EMA weight: heavier for early games, stabilizes later
  const alpha = Math.max(0.05, 1 / Math.min(gamesPlayed, 20));

  const recentWinRate = profile.recentWinRate * (1 - alpha) + (gameResult.won ? 1 : 0) * alpha;
  const averageAccuracy = profile.averageAccuracy * (1 - alpha) + gameResult.accuracy * alpha;
  const averageFan = profile.averageFan * (1 - alpha) + gameResult.fan * alpha;

  // Composite score for level estimation
  // Win rate counts most, accuracy and fan are secondary signals
  const composite = recentWinRate * 0.5 + averageAccuracy * 0.3 + Math.min(averageFan / 10, 1) * 0.2;
  const estimatedLevel = clamp(Math.round(1 + composite * 9), 1, 10);

  return {
    estimatedLevel,
    recentWinRate,
    averageAccuracy,
    averageFan,
    gamesPlayed,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Estimate an initial skill level from basic stats (e.g. imported history).
 */
export function estimateInitialLevel(stats: { winRate: number; gamesPlayed: number }): number {
  // If very few games, default to middle
  if (stats.gamesPlayed < 5) return 5;

  // Win rate in 4-player mahjong: 25% is average, 40%+ is strong
  const normalized = clamp((stats.winRate - 0.1) / 0.4, 0, 1);
  return clamp(Math.round(1 + normalized * 9), 1, 10);
}
