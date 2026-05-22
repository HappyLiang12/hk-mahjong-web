import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Button from '@/components/shared/Button';

const STEPS = [
  {
    key: 'language',
    title: '選擇語言',
    description: '請選擇你的語言 / Choose your language',
  },
  {
    key: 'theme',
    title: '選擇主題',
    description: '挑選你喜歡的視覺風格',
  },
  {
    key: 'name',
    title: '你的名字',
    description: '輸入你的玩家名稱',
  },
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState('zh-TW');
  const [theme, setTheme] = useState('dark');
  const [playerName, setPlayerName] = useState('');

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      // Save to localStorage
      localStorage.setItem('onboarding-complete', 'true');
      localStorage.setItem('user-language', language);
      localStorage.setItem('user-theme', theme);
      localStorage.setItem('user-name', playerName);
      navigate('/');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding-complete', 'true');
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i <= step ? 'bg-green-500' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="text-center w-full max-w-sm"
      >
        <h1 className="text-3xl font-bold text-white mb-2">{STEPS[step].title}</h1>
        <p className="text-sm text-gray-400 mb-8">{STEPS[step].description}</p>

        {/* Language step */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'zh-TW', label: '繁體中文', sub: 'Traditional Chinese' },
              { id: 'zh-CN', label: '简体中文', sub: 'Simplified Chinese' },
              { id: 'ja', label: '日本語', sub: 'Japanese' },
              { id: 'en', label: 'English', sub: 'English' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`p-4 rounded-xl border transition-all ${
                  language === lang.id
                    ? 'bg-green-700/30 border-green-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="text-white font-bold text-sm">{lang.label}</div>
                <div className="text-xs text-gray-500">{lang.sub}</div>
              </button>
            ))}
          </div>
        )}

        {/* Theme step */}
        {step === 1 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: '深色', icon: '🌙' },
              { id: 'light', label: '淺色', icon: '☀️' },
              { id: 'teahouse', label: '茶館', icon: '🍵' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  theme === t.id
                    ? 'bg-green-700/30 border-green-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="text-3xl">{t.icon}</span>
                <span className="text-white text-sm">{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Name step */}
        {step === 2 && (
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="輸入你的名稱..."
            maxLength={12}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-lg placeholder-gray-500 focus:outline-none focus:border-green-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && playerName.trim()) handleNext();
            }}
          />
        )}
      </motion.div>

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
        >
          跳過
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={step === 2 && !playerName.trim()}
          className="bg-green-700 hover:bg-green-600"
        >
          {step === 2 ? '完成' : '下一步'}
        </Button>
      </div>
    </div>
  );
}
