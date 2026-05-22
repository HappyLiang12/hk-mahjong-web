import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';
import { useState } from 'react';

const PRACTICE_SCENARIOS = [
  {
    id: 'standard-hand',
    name: '標準手牌',
    description: '練習基本牌型組合',
    icon: '🀄',
    handDescription: '隨機 13 張牌，練習棄牌策略',
  },
  {
    id: 'one-away',
    name: '聽牌練習',
    description: '差一張就食糊的牌型',
    icon: '🎯',
    handDescription: '已經聽牌 (1-shanten)，練習判斷',
  },
  {
    id: 'mixed-suit',
    name: '混一色練習',
    description: '練習混一色牌型',
    icon: '🎨',
    handDescription: '已有混合花色，目標混一色',
  },
  {
    id: 'all-pong',
    name: '對對糊練習',
    description: '練習對對糊牌型',
    icon: '🔨',
    handDescription: '多對子手牌，目標對對糊',
  },
  {
    id: 'defense',
    name: '防守練習',
    description: '練習防守策略',
    icon: '🛡️',
    handDescription: '落後時的打法，避免出銃',
  },
  {
    id: 'fast-game',
    name: '快速決策',
    description: '限時遊戲，練習快速判斷',
    icon: '⚡',
    handDescription: '每回合限時 10 秒',
  },
];

export default function PracticeScreen() {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

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
          ← 返回
        </Button>
        <h1 className="text-2xl font-bold text-white">練習模式</h1>
        <div className="w-16" />
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-sm text-gray-400 mb-4"
      >
        選擇一個場景進行針對性練習。AI 難度較低，無時間壓力。
      </motion.p>

      {/* Scenarios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {PRACTICE_SCENARIOS.map((scenario, i) => (
          <motion.button
            key={scenario.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.04 }}
            onClick={() => setSelectedScenario(scenario.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedScenario === scenario.id
                ? 'bg-teal-700/30 border-teal-500 shadow-lg shadow-teal-500/10'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{scenario.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{scenario.name}</div>
                <div className="text-xs text-gray-400">{scenario.description}</div>
                <div className="text-xs text-gray-500 mt-1 italic">{scenario.handDescription}</div>
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
          onClick={() => selectedScenario && navigate('/game')}
          disabled={!selectedScenario}
          className="w-full py-4 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-50 text-white text-lg font-bold rounded-xl shadow-lg transition-all"
        >
          {selectedScenario ? '🏋️ 開始練習' : '請選擇練習場景'}
        </button>
      </motion.div>
    </div>
  );
}
