import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameRecord {
  id: string;
  date: string;
  result: 'win' | 'loss' | 'draw';
  score: number;
  fan: number;
  winningPattern?: string;
  selfDrawn: boolean;
  duration: number; // seconds
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
  progress: number; // 0-100
  maxProgress: number;
}

export interface PatternHistoryEntry {
  pattern: string;
  count: number;
  lastDate: string;
}

export interface StatsStoreState {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  totalScore: number;
  highestFaan: number;
  patternHistory: PatternHistoryEntry[];
  achievements: Achievement[];
  matchHistory: GameRecord[];

  // Actions
  recordGame: (result: GameRecord) => void;
  checkAchievements: () => void;
  claimAchievement: (id: string) => void;
  resetStats: () => void;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-game', name: 'First Game', description: 'Play your first game', progress: 0, maxProgress: 1 },
  { id: 'first-win', name: 'First Win', description: 'Win your first game', progress: 0, maxProgress: 1 },
  { id: 'five-wins', name: 'Five Wins', description: 'Win 5 games', progress: 0, maxProgress: 5 },
  { id: 'ten-games', name: 'Ten Games', description: 'Play 10 games', progress: 0, maxProgress: 10 },
  { id: 'high-faan', name: 'High Faan', description: 'Score 10+ faan in a game', progress: 0, maxProgress: 1 },
  { id: 'marathon', name: 'Marathon', description: 'Play 50 games', progress: 0, maxProgress: 50 },
  { id: 'streak-3', name: 'Hat Trick', description: 'Win 3 games in a row', progress: 0, maxProgress: 1 },
  { id: 'streak-5', name: 'On Fire', description: 'Win 5 games in a row', progress: 0, maxProgress: 1 },
];

export const useStatsStore = create<StatsStoreState>()(
  persist(
    (set, get) => ({
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0,
      highestFaan: 0,
      patternHistory: [],
      achievements: DEFAULT_ACHIEVEMENTS,
      matchHistory: [],

      recordGame: (record: GameRecord) => {
        const state = get();
        const newWins = record.result === 'win' ? state.wins + 1 : state.wins;
        const newLosses = record.result === 'loss' ? state.losses + 1 : state.losses;
        const newDraws = record.result === 'draw' ? state.draws + 1 : state.draws;
        const newGamesPlayed = state.gamesPlayed + 1;
        const newWinRate = newGamesPlayed > 0 ? newWins / newGamesPlayed : 0;

        // Streak
        let newStreak = state.currentStreak;
        if (record.result === 'win') {
          newStreak += 1;
        } else {
          newStreak = 0;
        }
        const newBestStreak = Math.max(state.bestStreak, newStreak);

        // Pattern history
        const newPatternHistory = [...state.patternHistory];
        if (record.winningPattern) {
          const idx = newPatternHistory.findIndex(p => p.pattern === record.winningPattern);
          if (idx >= 0) {
            newPatternHistory[idx] = {
              ...newPatternHistory[idx],
              count: newPatternHistory[idx].count + 1,
              lastDate: record.date,
            };
          } else {
            newPatternHistory.push({
              pattern: record.winningPattern,
              count: 1,
              lastDate: record.date,
            });
          }
        }

        set({
          gamesPlayed: newGamesPlayed,
          wins: newWins,
          losses: newLosses,
          draws: newDraws,
          winRate: newWinRate,
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          totalScore: state.totalScore + record.score,
          highestFaan: Math.max(state.highestFaan, record.fan),
          patternHistory: newPatternHistory,
          matchHistory: [record, ...state.matchHistory].slice(0, 100),
        });

        // Check achievements
        get().checkAchievements();
      },

      checkAchievements: () => {
        const state = get();
        const updated = state.achievements.map(a => {
          let progress = a.progress;
          switch (a.id) {
            case 'first-game':
            case 'ten-games':
            case 'marathon':
              progress = Math.min(state.gamesPlayed, a.maxProgress);
              break;
            case 'first-win':
            case 'five-wins':
              progress = Math.min(state.wins, a.maxProgress);
              break;
            case 'high-faan':
              progress = state.highestFaan >= 10 ? 1 : 0;
              break;
            case 'streak-3':
              progress = state.bestStreak >= 3 ? 1 : 0;
              break;
            case 'streak-5':
              progress = state.bestStreak >= 5 ? 1 : 0;
              break;
          }
          // Auto-unlock if progress reaches max
          if (progress >= a.maxProgress && !a.unlockedAt) {
            return { ...a, progress, unlockedAt: new Date().toISOString() };
          }
          return { ...a, progress };
        });
        set({ achievements: updated });
      },

      claimAchievement: (id: string) => {
        set(state => ({
          achievements: state.achievements.map(a =>
            a.id === id && !a.unlockedAt
              ? { ...a, unlockedAt: new Date().toISOString() }
              : a
          ),
        }));
      },

      resetStats: () => set({
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalScore: 0,
        highestFaan: 0,
        patternHistory: [],
        achievements: DEFAULT_ACHIEVEMENTS,
        matchHistory: [],
      }),
    }),
    {
      name: 'hk-mahjong-stats',
    }
  )
);
