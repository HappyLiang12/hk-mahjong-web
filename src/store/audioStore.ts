import { create } from 'zustand';

export type SFXId =
  | 'tile_click'
  | 'tile_discard'
  | 'tile_draw'
  | 'pong'
  | 'chow'
  | 'kong'
  | 'win'
  | 'lose'
  | 'game_start'
  | 'game_over'
  | 'button_click'
  | 'menu_open'
  | 'menu_close';

export type BGMTrack = 'bgm_menu' | 'bgm_game' | 'bgm_celebration';

export interface AudioStoreState {
  sfxVolume: number;       // 0-1
  musicVolume: number;     // 0-1
  currentBGM: BGMTrack | null;
  isBGMPlaying: boolean;

  // Actions
  setVolume: (type: 'sfx' | 'music', value: number) => void;
  playSFX: (id: SFXId) => void;
  playBGM: (id: BGMTrack) => void;
  stopBGM: () => void;
  pauseBGM: () => void;
  resumeBGM: () => void;
}

export const useAudioStore = create<AudioStoreState>((set, get) => ({
  sfxVolume: 0.8,
  musicVolume: 0.5,
  currentBGM: null,
  isBGMPlaying: false,

  setVolume: (type, value) => {
    const clamped = Math.max(0, Math.min(1, value));
    if (type === 'sfx') set({ sfxVolume: clamped });
    else set({ musicVolume: clamped });
  },

  playSFX: (_id) => {
    // Audio playback is handled by the AudioManager (src/audio/)
    // This store just tracks state; actual Howler.js calls happen in useAudio hook
    const { sfxVolume } = get();
    if (sfxVolume > 0) {
      // Delegate to AudioManager singleton
      // AudioManager.playSFX(id, sfxVolume);
    }
  },

  playBGM: (id) => {
    const { musicVolume } = get();
    set({ currentBGM: id, isBGMPlaying: true });
    if (musicVolume > 0) {
      // AudioManager.playBGM(id, musicVolume);
    }
  },

  stopBGM: () => {
    set({ currentBGM: null, isBGMPlaying: false });
    // AudioManager.stopBGM();
  },

  pauseBGM: () => {
    set({ isBGMPlaying: false });
    // AudioManager.pauseBGM();
  },

  resumeBGM: () => {
    const { currentBGM, musicVolume } = get();
    if (currentBGM) {
      set({ isBGMPlaying: true });
      // AudioManager.resumeBGM();
    }
  },
}));
