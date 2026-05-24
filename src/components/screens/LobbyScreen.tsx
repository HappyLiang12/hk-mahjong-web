import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/shared/Button';

const MODE_IDS = ['standard', 'casual', 'competitive', 'practice'] as const;

const AI_PERSONALITIES = [
  { id: 'balanced', icon: '⚖️', key: 'lobby.aiBalanced' },
  { id: 'aggressive', icon: '🔥', key: 'lobby.aiAggressive' },
  { id: 'defensive', icon: '🛡️', key: 'lobby.aiDefensive' },
  { id: 'random', icon: '🎲', key: 'lobby.aiRandom' },
];

const MODE_LIST = [
  { id: 'standard', icon: '🀄' },
  { id: 'casual', icon: '🎯' },
  { id: 'competitive', icon: '🏆' },
  { id: 'practice', icon: '📚' },
];

export default function LobbyScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState('standard');
  const [aiPersonality, setAiPersonality] = useState('balanced');

  return (
    <div className="flex flex-col min-h-screen p-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 mt-2"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
        >
          {t('lobby.back')}
        </Button>
        <h1 className="text-2xl font-bold text-white">{t('lobby.title')}</h1>
        <div className="w-16" />
      </motion.div>

      {/* Game mode selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <h2 className="text-sm font-bold text-gray-400 mb-3">{t('lobby.gameMode')}</h2>
        <div className="grid grid-cols-1 gap-2">
          {MODE_LIST.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selectedMode === mode.id
                  ? 'bg-green-700/30 border-green-500 shadow-lg shadow-green-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{mode.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">
                    {t(`lobby.${mode.id}`)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {t(`lobby.${mode.id}Desc`)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t(`lobby.${mode.id}Details`)}
                  </div>
                </div>
                {selectedMode === mode.id && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* AI Personality */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-sm font-bold text-gray-400 mb-3">{t('lobby.aiStyle')}</h2>
        <div className="flex gap-2">
          {AI_PERSONALITIES.map((p) => (
            <button
              key={p.id}
              onClick={() => setAiPersonality(p.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs transition-all ${
                aiPersonality === p.id
                  ? 'bg-indigo-700/40 border border-indigo-500 text-white'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              <span>{t(p.key)}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Start button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-auto pb-8"
      >
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/game')}
          className="w-full bg-green-700 hover:bg-green-600 text-xl font-bold"
          leftIcon={<span>🀄</span>}
        >
          {t('lobby.startGame')}
        </Button>
      </motion.div>
    </div>
  );
}
