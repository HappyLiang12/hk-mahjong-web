/**
 * Lucky Tiles & Special Game Events
 * Random beneficial events that add excitement to gameplay.
 */

import { GameState } from '../types';

export interface LuckyTileEvent {
  id: string;
  name: { en: string; 'zh-TW': string; 'zh-CN': string; ja: string };
  description: { en: string; 'zh-TW': string; 'zh-CN': string; ja: string };
  trigger: 'random' | 'streak' | 'comeback' | 'first_game_of_day';
  effect: {
    type: 'score_bonus' | 'extra_draw' | 'reveal_tile' | 'wild_tile' | 'double_fan';
    value: number;
    duration: 'one_turn' | 'one_round' | 'one_game';
  };
  probability: number; // 0-1
  visual: { emoji: string; color: string; particleEffect: string };
}

export const LUCKY_EVENTS: LuckyTileEvent[] = [
  {
    id: 'golden_tile',
    name: { en: 'Golden Tile', 'zh-TW': '金牌', 'zh-CN': '金牌', ja: 'ゴールデンタイル' },
    description: {
      en: 'A golden tile appears! Score bonus x2 this round.',
      'zh-TW': '金牌出現！本局得分加倍。',
      'zh-CN': '金牌出现！本局得分加倍。',
      ja: 'ゴールデンタイル出現！このラウンドのスコア2倍。',
    },
    trigger: 'random',
    effect: { type: 'score_bonus', value: 2, duration: 'one_round' },
    probability: 0.05,
    visual: { emoji: '✨', color: '#FFD700', particleEffect: 'sparkle' },
  },
  {
    id: 'dragon_blessing',
    name: { en: 'Dragon Blessing', 'zh-TW': '龍之祝福', 'zh-CN': '龙之祝福', ja: '龍の祝福' },
    description: {
      en: 'The dragon blesses you with an extra draw!',
      'zh-TW': '龍賜予你額外摸牌的機會！',
      'zh-CN': '龙赐予你额外摸牌的机会！',
      ja: '龍があなたに追加ドローを授ける！',
    },
    trigger: 'random',
    effect: { type: 'extra_draw', value: 1, duration: 'one_turn' },
    probability: 0.04,
    visual: { emoji: '🐉', color: '#FF4500', particleEffect: 'fire' },
  },
  {
    id: 'phoenix_eye',
    name: { en: 'Phoenix Eye', 'zh-TW': '鳳眼', 'zh-CN': '凤眼', ja: '鳳凰の目' },
    description: {
      en: 'The phoenix reveals a tile in the wall!',
      'zh-TW': '鳳凰揭示牌墻中的一張牌！',
      'zh-CN': '凤凰揭示牌墙中的一张牌！',
      ja: '鳳凰が山の牌を1枚公開！',
    },
    trigger: 'random',
    effect: { type: 'reveal_tile', value: 1, duration: 'one_turn' },
    probability: 0.03,
    visual: { emoji: '🔮', color: '#9B59B6', particleEffect: 'glow' },
  },
  {
    id: 'jade_wild',
    name: { en: 'Jade Wild', 'zh-TW': '翡翠百搭', 'zh-CN': '翡翠百搭', ja: '翡翠ワイルド' },
    description: {
      en: 'A jade tile becomes wild for one turn!',
      'zh-TW': '翡翠牌變成百搭牌一回合！',
      'zh-CN': '翡翠牌变成百搭牌一回合！',
      ja: '翡翠タイルが1ターンワイルドに！',
    },
    trigger: 'random',
    effect: { type: 'wild_tile', value: 1, duration: 'one_turn' },
    probability: 0.02,
    visual: { emoji: '💎', color: '#2ECC71', particleEffect: 'shimmer' },
  },
  {
    id: 'streak_fire',
    name: { en: 'Winning Streak Fire', 'zh-TW': '連勝之火', 'zh-CN': '连胜之火', ja: '連勝の炎' },
    description: {
      en: 'Your streak is on fire! Double fan this game!',
      'zh-TW': '連勝火焰！本場番數加倍！',
      'zh-CN': '连胜火焰！本场番数加倍！',
      ja: '連勝の炎！この試合、翻が2倍！',
    },
    trigger: 'streak',
    effect: { type: 'double_fan', value: 2, duration: 'one_game' },
    probability: 0.06,
    visual: { emoji: '🔥', color: '#E74C3C', particleEffect: 'fire' },
  },
  {
    id: 'comeback_star',
    name: { en: 'Comeback Star', 'zh-TW': '逆轉之星', 'zh-CN': '逆转之星', ja: '逆転の星' },
    description: {
      en: 'The stars align for a comeback! Score bonus x3!',
      'zh-TW': '逆轉之星降臨！得分三倍！',
      'zh-CN': '逆转之星降临！得分三倍！',
      ja: '逆転の星が輝く！スコア3倍！',
    },
    trigger: 'comeback',
    effect: { type: 'score_bonus', value: 3, duration: 'one_round' },
    probability: 0.04,
    visual: { emoji: '⭐', color: '#F39C12', particleEffect: 'starburst' },
  },
  {
    id: 'morning_dew',
    name: { en: 'Morning Dew', 'zh-TW': '晨露', 'zh-CN': '晨露', ja: '朝露' },
    description: {
      en: 'First game of the day! Extra draw to start fresh.',
      'zh-TW': '今天的第一局！額外摸牌開好運。',
      'zh-CN': '今天的第一局！额外摸牌开好运。',
      ja: '今日の初戦！追加ドローで幸先よく。',
    },
    trigger: 'first_game_of_day',
    effect: { type: 'extra_draw', value: 2, duration: 'one_turn' },
    probability: 0.10,
    visual: { emoji: '🌅', color: '#85C1E9', particleEffect: 'sparkle' },
  },
  {
    id: 'lucky_red',
    name: { en: 'Lucky Red Envelope', 'zh-TW': '幸運紅包', 'zh-CN': '幸运红包', ja: 'ラッキー紅包' },
    description: {
      en: 'A red envelope appears! Score bonus for the round!',
      'zh-TW': '紅包到！本局得分加成！',
      'zh-CN': '红包到！本局得分加成！',
      ja: '紅包登場！ラウンドスコアボーナス！',
    },
    trigger: 'random',
    effect: { type: 'score_bonus', value: 1.5, duration: 'one_round' },
    probability: 0.07,
    visual: { emoji: '🧧', color: '#C0392B', particleEffect: 'confetti' },
  },
  {
    id: 'moonlight_reveal',
    name: { en: 'Moonlight Reveal', 'zh-TW': '月光揭示', 'zh-CN': '月光揭示', ja: '月光の啓示' },
    description: {
      en: 'Moonlight reveals two tiles from the wall!',
      'zh-TW': '月光照亮牌墻中的兩張牌！',
      'zh-CN': '月光照亮牌墙中的两张牌！',
      ja: '月光が山の牌を2枚照らす！',
    },
    trigger: 'random',
    effect: { type: 'reveal_tile', value: 2, duration: 'one_turn' },
    probability: 0.02,
    visual: { emoji: '🌙', color: '#7F8C8D', particleEffect: 'glow' },
  },
];

/**
 * Check if a lucky event should trigger based on current game state.
 * Returns the triggered event or null.
 */
export function checkForLuckyEvent(gameState: GameState): LuckyTileEvent | null {
  // Only check on the human player's draw phase
  if (gameState.currentTurn !== 0 || gameState.phase !== 'draw') {
    return null;
  }

  // Filter eligible events
  const eligible = LUCKY_EVENTS.filter((evt) => {
    if (evt.trigger === 'random') return true;
    // For non-random triggers, we'd need extended state; for now allow all
    return true;
  });

  // Roll for each event (first match wins, ordered by array)
  for (const evt of eligible) {
    if (Math.random() < evt.probability) {
      return evt;
    }
  }

  return null;
}

/**
 * Check for lucky tile (simple single-tile check, barrel compat).
 * Returns null — no single-tile events in base game.
 */
export function checkLuckyTile(): LuckyTileEvent | null {
  return null;
}

/**
 * Apply the effect of a lucky event to the game state.
 * Returns a new state with the effect applied.
 */
export function applyLuckyEffect(state: GameState, event: LuckyTileEvent): GameState {
  const newState = { ...state, wall: [...state.wall], players: state.players.map((p) => ({ ...p })) };

  switch (event.effect.type) {
    case 'extra_draw': {
      // Give the current player extra tiles from the wall
      const count = Math.min(event.effect.value, newState.wall.length);
      const drawn = newState.wall.splice(0, count);
      newState.players[newState.currentTurn] = {
        ...newState.players[newState.currentTurn],
        hand: [...newState.players[newState.currentTurn].hand, ...drawn],
      };
      break;
    }
    case 'reveal_tile': {
      // Mark tiles as revealed (attach metadata via a convention — store revealed tile ids)
      const count = Math.min(event.effect.value, newState.wall.length);
      const revealed = newState.wall.slice(0, count);
      (newState as Record<string, unknown>)._revealedTiles = revealed;
      break;
    }
    case 'score_bonus':
    case 'double_fan':
    case 'wild_tile': {
      // Store active effect for scoring/turn resolution to pick up
      const existing = ((newState as Record<string, unknown>)._activeEffects as { eventId: string; type: string; value: number; duration: string }[]) || [];
      (newState as Record<string, unknown>)._activeEffects = [...existing, { eventId: event.id, ...event.effect }];
      break;
    }
  }

  return newState;
}
