import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

export type AiDifficulty = 'easy' | 'normal' | 'hard';
export type GameSpeed = 'slow' | 'normal' | 'fast';
export type ThemeName = 'classic' | 'dark' | 'teahouse' | 'garden' | 'night';

export interface SettingsStoreState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  showHints: boolean;
  themeName: ThemeName;
  aiDifficulty: AiDifficulty;
  gameSpeed: GameSpeed;
  minFan: number;
  flowerTiles: boolean;
  autoSort: boolean;
  language: string;

  // Actions
  updateSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
  resetDefaults: () => void;
}

interface SettingsData {
  soundEnabled: boolean;
  musicEnabled: boolean;
  showHints: boolean;
  themeName: ThemeName;
  aiDifficulty: AiDifficulty;
  gameSpeed: GameSpeed;
  minFan: number;
  flowerTiles: boolean;
  autoSort: boolean;
  language: string;
}

const DEFAULTS: SettingsData = {
  soundEnabled: true,
  musicEnabled: true,
  showHints: true,
  themeName: 'classic',
  aiDifficulty: 'normal',
  gameSpeed: 'normal',
  minFan: 3,
  flowerTiles: false,
  autoSort: true,
  language: 'zh-TW',
};

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      updateSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
        set({ [key]: value });
        if (key === 'language') {
          i18n.changeLanguage(value as string);
        }
      },

      resetDefaults: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'hk-mahjong-settings',
    }
  )
);
