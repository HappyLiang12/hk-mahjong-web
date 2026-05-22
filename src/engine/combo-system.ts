/**
 * Combo System & Score Multipliers
 * Tracks player streaks and play-style patterns to award score multipliers.
 */

export interface ComboTracker {
  consecutiveWins: number;
  consecutiveSelfDraws: number;
  turnsWithoutClaim: number;
  claimsThisRound: number;
  kongsThisRound: number;
  flowerCount: number;
  winByRobbingKong: boolean;
  dealerRetained: number; // consecutive rounds as dealer

  activeMultipliers: {
    name: string;
    multiplier: number;
    reason: { en: string; 'zh-TW': string; 'zh-CN': string; ja: string };
    icon: string;
  }[];
}

export interface ComboRule {
  id: string;
  trigger: (t: ComboTracker) => boolean;
  multiplier: number;
  icon: string;
  reason: { en: string; 'zh-TW': string; 'zh-CN': string; ja: string };
}

export const COMBO_RULES: ComboRule[] = [
  {
    id: 'win_streak_2',
    trigger: (t) => t.consecutiveWins >= 2 && t.consecutiveWins < 3,
    multiplier: 1.5,
    icon: '🔥',
    reason: { en: '2-Win Streak', 'zh-TW': '二連勝', 'zh-CN': '二连胜', ja: '2連勝' },
  },
  {
    id: 'win_streak_3',
    trigger: (t) => t.consecutiveWins >= 3 && t.consecutiveWins < 5,
    multiplier: 2.0,
    icon: '🔥🔥',
    reason: { en: '3-Win Streak', 'zh-TW': '三連勝', 'zh-CN': '三连胜', ja: '3連勝' },
  },
  {
    id: 'win_streak_5',
    trigger: (t) => t.consecutiveWins >= 5,
    multiplier: 3.0,
    icon: '🔥🔥🔥',
    reason: { en: '5-Win Streak', 'zh-TW': '五連勝', 'zh-CN': '五连胜', ja: '5連勝' },
  },
  {
    id: 'self_draw_master',
    trigger: (t) => t.consecutiveSelfDraws >= 2,
    multiplier: 1.5,
    icon: '🎯',
    reason: { en: 'Self-Draw Master', 'zh-TW': '自摸達人', 'zh-CN': '自摸达人', ja: '自摸マスター' },
  },
  {
    id: 'patient_player',
    trigger: (t) => t.turnsWithoutClaim >= 10,
    multiplier: 1.2,
    icon: '🧘',
    reason: { en: 'Patient Player', 'zh-TW': '耐心玩家', 'zh-CN': '耐心玩家', ja: '忍耐プレイヤー' },
  },
  {
    id: 'aggressive',
    trigger: (t) => t.claimsThisRound >= 3,
    multiplier: 1.3,
    icon: '⚔️',
    reason: { en: 'Aggressive Play', 'zh-TW': '積極進攻', 'zh-CN': '积极进攻', ja: '攻撃的プレイ' },
  },
  {
    id: 'kong_collector',
    trigger: (t) => t.kongsThisRound >= 2,
    multiplier: 1.4,
    icon: '🀄',
    reason: { en: 'Kong Collector', 'zh-TW': '槓上開花', 'zh-CN': '杠上开花', ja: 'カン収集家' },
  },
  {
    id: 'flower_power',
    trigger: (t) => t.flowerCount >= 4,
    multiplier: 1.3,
    icon: '🌸',
    reason: { en: 'Flower Power', 'zh-TW': '花牌達人', 'zh-CN': '花牌达人', ja: 'フラワーパワー' },
  },
  {
    id: 'robbing_kong',
    trigger: (t) => t.winByRobbingKong,
    multiplier: 1.5,
    icon: '🗡️',
    reason: { en: 'Rob the Kong!', 'zh-TW': '搶槓', 'zh-CN': '抢杠', ja: '槍槓' },
  },
  {
    id: 'dealer_streak',
    trigger: (t) => t.dealerRetained >= 3,
    multiplier: 1.4,
    icon: '👑',
    reason: { en: 'Dealer Dominance', 'zh-TW': '莊家連莊', 'zh-CN': '庄家连庄', ja: '親の連荘' },
  },
];

export function createComboTracker(): ComboTracker {
  return {
    consecutiveWins: 0,
    consecutiveSelfDraws: 0,
    turnsWithoutClaim: 0,
    claimsThisRound: 0,
    kongsThisRound: 0,
    flowerCount: 0,
    winByRobbingKong: false,
    dealerRetained: 0,
    activeMultipliers: [],
  };
}

type ComboEvent =
  | 'win'
  | 'lose'
  | 'self_draw'
  | 'claim'
  | 'turn_no_claim'
  | 'kong'
  | 'flower'
  | 'rob_kong'
  | 'dealer_retain'
  | 'dealer_lost'
  | 'round_start';

export function updateCombo(tracker: ComboTracker, event: string): ComboTracker {
  const t: ComboTracker = {
    consecutiveWins: tracker.consecutiveWins,
    consecutiveSelfDraws: tracker.consecutiveSelfDraws,
    turnsWithoutClaim: tracker.turnsWithoutClaim,
    claimsThisRound: tracker.claimsThisRound,
    kongsThisRound: tracker.kongsThisRound,
    flowerCount: tracker.flowerCount,
    winByRobbingKong: tracker.winByRobbingKong,
    dealerRetained: tracker.dealerRetained,
    activeMultipliers: [...tracker.activeMultipliers],
  };

  switch (event as ComboEvent) {
    case 'win':
      t.consecutiveWins += 1;
      break;
    case 'lose':
      t.consecutiveWins = 0;
      t.consecutiveSelfDraws = 0;
      break;
    case 'self_draw':
      t.consecutiveSelfDraws += 1;
      t.consecutiveWins += 1;
      break;
    case 'claim':
      t.claimsThisRound += 1;
      break;
    case 'turn_no_claim':
      t.turnsWithoutClaim += 1;
      break;
    case 'kong':
      t.kongsThisRound += 1;
      break;
    case 'flower':
      t.flowerCount += 1;
      break;
    case 'rob_kong':
      t.winByRobbingKong = true;
      break;
    case 'dealer_retain':
      t.dealerRetained += 1;
      break;
    case 'dealer_lost':
      t.dealerRetained = 0;
      break;
    case 'round_start':
      t.turnsWithoutClaim = 0;
      t.claimsThisRound = 0;
      t.kongsThisRound = 0;
      t.flowerCount = 0;
      t.winByRobbingKong = false;
      break;
  }

  t.activeMultipliers = getActiveMultipliers(t).map((r) => ({
    name: r.id,
    multiplier: r.multiplier,
    reason: r.reason,
    icon: r.icon,
  }));

  return t;
}

export function getActiveMultipliers(tracker: ComboTracker): ComboRule[] {
  return COMBO_RULES.filter((rule) => rule.trigger(tracker));
}

export function calculateTotalMultiplier(tracker: ComboTracker): number {
  const active = getActiveMultipliers(tracker);
  if (active.length === 0) return 1.0;
  return active.reduce((total, rule) => total * rule.multiplier, 1.0);
}

/**
 * Simple increment/reset for basic combo (barrel compatibility).
 */
export function incrementCombo(tracker: ComboTracker): void {
  tracker.consecutiveWins++;
  tracker.activeMultipliers = getActiveMultipliers(tracker).map((r) => ({
    name: r.id,
    multiplier: r.multiplier,
    reason: r.reason,
    icon: r.icon,
  }));
}

export function resetCombo(tracker: ComboTracker): void {
  tracker.consecutiveWins = 0;
  tracker.consecutiveSelfDraws = 0;
  tracker.activeMultipliers = [];
}
