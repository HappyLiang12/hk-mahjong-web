import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Button from '@/components/shared/Button';
import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { PracticeScenarioId } from '@/engine';

const SCENARIO_LIST = [
  { id: 'standard-hand', icon: '🀄', key: 'standardHand' },
  { id: 'one-away', icon: '🎯', key: 'oneAway' },
  { id: 'mixed-suit', icon: '🎨', key: 'mixedSuit' },
  { id: 'all-pong', icon: '🔨', key: 'allPongs' },
  { id: 'defense', icon: '🛡️', key: 'defense' },
  { id: 'fast-game', icon: '⚡', key: 'fastGame' },
] as const;

export default function PracticeScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedScenario, setSelectedScenario] = useState<PracticeScenarioId | null>(null);

  const handleStart = () => {
    if (!selectedScenario) return;
    useGameStore.getState().setGameMode('practice');
    useGameStore.getState().setPracticeScenario(selectedScenario);
    navigate('/game');
  };

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
          onClick={() => navigate(-1)}
        >
          {t('practice.back')}
        </Button>
        <h1 className="text-2xl font-bold text-white">{t('practice.title')}</h1>
        <div className="w-16" />
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-sm text-gray-400 mb-4"
      >
        {t('practice.selectScenario')}
      </motion.p>

      {/* Scenarios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {SCENARIO_LIST.map((scenario, i) => (
          <motion.button
            key={scenario.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.04 }}
            onClick={() => setSelectedScenario(scenario.id as PracticeScenarioId)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedScenario === scenario.id
                ? 'bg-teal-700/30 border-teal-500 shadow-lg shadow-teal-500/10'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{scenario.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">
                  {t(`practice.${scenario.key}`)}
                </div>
                <div className="text-xs text-gray-400">
                  {t(`practice.${scenario.key}Desc`)}
                </div>
                <div className="text-xs text-gray-500 mt-1 italic">
                  {t(`practice.${scenario.key}Details`)}
                </div>
              </div>
              {selectedScenario === scenario.id && (
                <span className="text-teal-400 text-lg">▶</span>
              )}
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Start button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-auto pb-8"
      >
        <button
          onClick={handleStart}
          disabled={!selectedScenario}
          className="w-full py-4 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-50 text-white text-lg font-bold rounded-xl shadow-lg transition-all"
        >
          {selectedScenario ? t('practice.startPractice') : t('practice.selectFirst')}
        </button>
      </motion.div>
    </div>
  );
}
