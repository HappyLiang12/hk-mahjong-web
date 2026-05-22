export type GameMode = 'standard' | 'quick' | 'tournament' | 'practice';

export interface GameModeConfig {
  mode: GameMode;
  name: { en: string; 'zh-TW': string; 'zh-CN': string; ja: string };
  description: { en: string; 'zh-TW': string; 'zh-CN': string; ja: string };
  icon: string;
  settings: {
    rounds: number;
    timePerTurn?: number;
    minFan: number;
    aiDifficulty: 'easy' | 'normal' | 'hard';
    allowUndo?: boolean;
    showHints?: boolean;
  };
}

export const GAME_MODES: GameModeConfig[] = [
  {
    mode: 'standard',
    icon: '🀄',
    name: {
      en: 'Standard Game',
      'zh-TW': '標準對局',
      'zh-CN': '标准对局',
      ja: '通常戦',
    },
    description: {
      en: 'Full East-South round with standard rules',
      'zh-TW': '完整東南圈，標準規則',
      'zh-CN': '完整东南圈，标准规则',
      ja: '東南戦の完全なラウンド',
    },
    settings: { rounds: 4, minFan: 3, aiDifficulty: 'normal' },
  },
  {
    mode: 'quick',
    icon: '⚡',
    name: {
      en: 'Quick Game',
      'zh-TW': '快速對局',
      'zh-CN': '快速对局',
      ja: 'クイックゲーム',
    },
    description: {
      en: 'Single round, perfect for a quick session',
      'zh-TW': '單局速戰，適合快速遊玩',
      'zh-CN': '单局速战，适合快速游玩',
      ja: '1局だけ、短時間で楽しめる',
    },
    settings: { rounds: 1, timePerTurn: 30, minFan: 1, aiDifficulty: 'normal' },
  },
  {
    mode: 'tournament',
    icon: '🏆',
    name: {
      en: 'Tournament',
      'zh-TW': '錦標賽',
      'zh-CN': '锦标赛',
      ja: 'トーナメント',
    },
    description: {
      en: 'Extended play with harder AI and higher stakes',
      'zh-TW': '延長賽制，更強AI，更高賭注',
      'zh-CN': '延长赛制，更强AI，更高赌注',
      ja: '長期戦、強いAIと高い賭け',
    },
    settings: { rounds: 8, minFan: 3, aiDifficulty: 'hard' },
  },
  {
    mode: 'practice',
    icon: '📚',
    name: {
      en: 'Practice Mode',
      'zh-TW': '練習模式',
      'zh-CN': '练习模式',
      ja: '練習モード',
    },
    description: {
      en: 'Learn at your own pace with hints and undo',
      'zh-TW': '按自己的節奏學習，可提示及悔棋',
      'zh-CN': '按自己的节奏学习，可提示及悔棋',
      ja: 'ヒントとやり直しで自分のペースで学ぶ',
    },
    settings: { rounds: 1, minFan: 1, aiDifficulty: 'easy', allowUndo: true, showHints: true },
  },
];

export function getGameMode(mode: GameMode): GameModeConfig {
  const found = GAME_MODES.find((m) => m.mode === mode);
  if (!found) throw new Error(`Unknown game mode: ${mode}`);
  return found;
}
