/**
 * AI Personality system for HK Mahjong.
 *
 * Each AI opponent gets a distinct personality that affects their playstyle
 * (claim aggressiveness, defensive behavior, risk tolerance) and display
 * (name, emoji, description in 4 languages).
 */

export interface AIPersonality {
  id: string;
  name: { en: string; 'zh-TW': string; 'zh-CN': string; ja: string };
  emoji: string;
  description: { en: string; 'zh-TW': string; 'zh-CN': string; ja: string };
  style: {
    aggressiveness: number;    // 0-1: how eagerly claims/melds
    defensiveness: number;     // 0-1: how much avoids dangerous discards
    riskTolerance: number;     // 0-1: willingness to go for big hands
    patience: number;          // 0-1: how long waits before committing to pattern
    bluffFrequency: number;    // 0-1: how often makes misleading discards
  };
}

export const PERSONALITIES: AIPersonality[] = [
  {
    id: 'uncle_chan',
    name: { en: 'Uncle Chan', 'zh-TW': '陳伯', 'zh-CN': '陈伯', ja: 'チャンおじさん' },
    emoji: '👴',
    description: {
      en: 'Conservative veteran. Plays safe, rarely takes risks.',
      'zh-TW': '保守老手。穩打穩紮，甚少冒險。',
      'zh-CN': '保守老手。稳打稳扎，很少冒险。',
      ja: '保守的なベテラン。安全に打ち、めったにリスクを取らない。',
    },
    style: { aggressiveness: 0.3, defensiveness: 0.9, riskTolerance: 0.2, patience: 0.8, bluffFrequency: 0.1 },
  },
  {
    id: 'sister_mei',
    name: { en: 'Sister Mei', 'zh-TW': '美姐', 'zh-CN': '美姐', ja: 'メイ姉さん' },
    emoji: '👩',
    description: {
      en: 'Balanced player. Adapts to the situation.',
      'zh-TW': '均衡型玩家。隨機應變，靈活多變。',
      'zh-CN': '均衡型玩家。随机应变，灵活多变。',
      ja: 'バランス型プレイヤー。状況に応じて柔軟に対応。',
    },
    style: { aggressiveness: 0.5, defensiveness: 0.5, riskTolerance: 0.5, patience: 0.5, bluffFrequency: 0.3 },
  },
  {
    id: 'young_wong',
    name: { en: 'Young Wong', 'zh-TW': '阿黃', 'zh-CN': '阿黄', ja: 'ウォン君' },
    emoji: '😎',
    description: {
      en: 'Aggressive risk-taker. Goes for big hands.',
      'zh-TW': '激進冒險家。專攻大牌。',
      'zh-CN': '激进冒险家。专攻大牌。',
      ja: '攻撃的なリスクテイカー。大きな手を狙う。',
    },
    style: { aggressiveness: 0.8, defensiveness: 0.2, riskTolerance: 0.9, patience: 0.3, bluffFrequency: 0.5 },
  },
  {
    id: 'grandma_li',
    name: { en: 'Grandma Li', 'zh-TW': '李婆婆', 'zh-CN': '李婆婆', ja: 'リーおばあちゃん' },
    emoji: '👵',
    description: {
      en: 'Lucky granny. Plays by instinct and often gets what she needs.',
      'zh-TW': '幸運婆婆。靠直覺打牌，經常摸到好牌。',
      'zh-CN': '幸运婆婆。靠直觉打牌，经常摸到好牌。',
      ja: '幸運なおばあちゃん。直感で打ち、よく必要な牌を引く。',
    },
    style: { aggressiveness: 0.4, defensiveness: 0.6, riskTolerance: 0.7, patience: 0.7, bluffFrequency: 0.2 },
  },
  {
    id: 'brother_keung',
    name: { en: 'Brother Keung', 'zh-TW': '強哥', 'zh-CN': '强哥', ja: 'キョン兄貴' },
    emoji: '🧔',
    description: {
      en: 'Defensive expert. Reads opponents and blocks their wins.',
      'zh-TW': '防守專家。善讀對手，專門截糊。',
      'zh-CN': '防守专家。善读对手，专门截胡。',
      ja: '防御の達人。相手を読み、上がりを阻止する。',
    },
    style: { aggressiveness: 0.3, defensiveness: 0.95, riskTolerance: 0.3, patience: 0.6, bluffFrequency: 0.4 },
  },
  {
    id: 'ah_fat',
    name: { en: 'Ah Fat', 'zh-TW': '阿發', 'zh-CN': '阿发', ja: 'アーファット' },
    emoji: '🏃',
    description: {
      en: 'Speed player. Goes for quick cheap wins.',
      'zh-TW': '快攻型。追求快糊，唔理番數。',
      'zh-CN': '快攻型。追求快胡，不管番数。',
      ja: 'スピードプレイヤー。安くても速い上がりを狙う。',
    },
    style: { aggressiveness: 0.7, defensiveness: 0.3, riskTolerance: 0.1, patience: 0.1, bluffFrequency: 0.15 },
  },
  {
    id: 'madam_fong',
    name: { en: 'Madam Fong', 'zh-TW': '方太', 'zh-CN': '方太', ja: 'フォン夫人' },
    emoji: '💅',
    description: {
      en: 'Cunning bluffer. Misleads opponents with tricky discards.',
      'zh-TW': '狡猾高手。出牌迷惑對手，虛虛實實。',
      'zh-CN': '狡猾高手。出牌迷惑对手，虚虚实实。',
      ja: 'ずる賢いブラファー。トリッキーな捨て牌で相手を惑わす。',
    },
    style: { aggressiveness: 0.5, defensiveness: 0.6, riskTolerance: 0.6, patience: 0.5, bluffFrequency: 0.8 },
  },
];

/**
 * Get `count` random personalities with no duplicates.
 */
export function getRandomPersonalities(count: number): AIPersonality[] {
  if (count > PERSONALITIES.length) {
    throw new Error(`Requested ${count} personalities but only ${PERSONALITIES.length} available`);
  }
  const shuffled = [...PERSONALITIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Apply personality modifiers to a base decision value.
 *
 * Used to nudge AI decisions based on personality traits.
 * Returns a modified numeric value clamped to [0, 1].
 */
export function applyPersonality(
  baseValue: number,
  trait: keyof AIPersonality['style'],
  personality: AIPersonality,
): number {
  const traitValue = personality.style[trait];
  // Blend base value toward the trait: 60% base, 40% personality
  const blended = baseValue * 0.6 + traitValue * 0.4;
  return Math.max(0, Math.min(1, blended));
}
