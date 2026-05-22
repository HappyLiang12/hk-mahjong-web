import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhTW from './locales/zh-TW.json';
import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';
import ja from './locales/ja.json';

const resources = {
  'zh-TW': { translation: zhTW },
  'zh-CN': { translation: zhCN },
  en: { translation: en },
  ja: { translation: ja },
} as const;

// Detect browser language for initial locale
function detectLanguage(): string {
  if (typeof window === 'undefined') return 'zh-TW';

  // Check localStorage first (set by settings store)
  try {
    const stored = localStorage.getItem('hk-mahjong-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.language && resources[parsed.state.language as keyof typeof resources]) {
        return parsed.state.language;
      }
    }
  } catch {
    // ignore
  }

  // Fall back to browser language
  const navLang = navigator.language;
  if (navLang.startsWith('zh')) {
    return navLang.includes('CN') || navLang.includes('SG') ? 'zh-CN' : 'zh-TW';
  }
  if (navLang.startsWith('ja')) return 'ja';
  return 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'zh-TW',
  interpolation: {
    escapeValue: false, // React already escapes
  },
  returnObjects: false,
  returnNull: false,
});

export default i18n;
