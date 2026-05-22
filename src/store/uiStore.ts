import { create } from 'zustand';

export type ScreenName =
  | 'menu'
  | 'lobby'
  | 'game'
  | 'scoring'
  | 'endGame'
  | 'settings'
  | 'tutorial'
  | 'stats'
  | 'achievements'
  | 'leaderboard'
  | 'matchHistory'
  | 'onboarding'
  | 'houseRules'
  | 'profile'
  | 'replay'
  | 'scoringGuide'
  | 'animationSettings'
  | 'tutorialMenu'
  | 'feedback'
  | 'analysis'
  | 'guidedTutorial';

export type CameraPreset = 'overhead' | 'player' | 'diagonal' | 'side';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface UIStoreState {
  currentScreen: ScreenName;
  modal: string | null;
  modalData: unknown;
  toast: Toast | null;
  cameraPreset: CameraPreset;
  showClaimPanel: boolean;

  // Actions
  navigate: (screen: ScreenName) => void;
  showModal: (id: string, data?: unknown) => void;
  dismissModal: () => void;
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  dismissToast: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setShowClaimPanel: (show: boolean) => void;
}

let toastCounter = 0;

export const useUIStore = create<UIStoreState>((set) => ({
  currentScreen: 'menu',
  modal: null,
  modalData: null,
  toast: null,
  cameraPreset: 'player',
  showClaimPanel: false,

  navigate: (screen) => set({ currentScreen: screen }),

  showModal: (id, data = null) => set({ modal: id, modalData: data }),

  dismissModal: () => set({ modal: null, modalData: null }),

  showToast: (message, type = 'info', duration = 3000) => {
    const id = `toast-${++toastCounter}`;
    set({ toast: { id, message, type, duration } });

    if (duration > 0) {
      setTimeout(() => {
        set((state) => (state.toast?.id === id ? { toast: null } : {}));
      }, duration);
    }
  },

  dismissToast: () => set({ toast: null }),

  setCameraPreset: (preset) => set({ cameraPreset: preset }),

  setShowClaimPanel: (show) => set({ showClaimPanel: show }),
}));
