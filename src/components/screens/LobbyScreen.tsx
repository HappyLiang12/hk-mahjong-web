import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Button from '@/components/shared/Button';
import { useGameStore } from '@/store/gameStore';

const GAME_MODES = [
  {
    id: 'standard',
    name: '標準模式',
    description: '四人標準遊戲，3 番起糊',
    icon: '🀄',
    players: '1人 vs 3AI',
    details: '東南西北四圈 · 3番起糊 · 有花',
  },
  {
    id: 'casual',
    name: '休閒模式',
    description: '輕鬆玩法，1 番起糊',
    icon: '🎯',
    players: '1人 vs 3AI',
    details: '無限圈 · 1番起糊 · 無最低番數',
  },
  {
    id: 'competitive',
    name: '競技模式',
    description: '高難度，AI 策略最強',
    icon: '🏆',
    players: '1人 vs 3AI',
    details: '東南西北四圈 · 3番起糊 · AI 高級',
  },
  {
    id: 'practice',
    name: '練習模式',
    description: '任意練習特定牌型',
    icon: '📚',
    players: '1人 vs 1AI',
    details: '無限圈 · 0番起糊 · 教學提示',
  },
];

const AI_PERSONALITIES = [
  { id: 'balanced', name: '均衡', icon: '⚖️' },
  { id: 'aggressive', name: '進取', icon: '🔥' },
  { id: 'defensive', name: '防守', icon: '🛡️' },
  { id: 'random', name: '隨機', icon: '🎲' },
];

export default function LobbyScreen() {
  const navigate = useNavigate();
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
          ← 主選單
        </Button>
        <h1 className="text-2xl font-bold text-white">遊戲大廳</h1>
        <div className="w-16" />
      </motion.div>

      {/* Game mode selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <h2 className="text-sm font-bold text-gray-400 mb-3">遊戲模式</h2>
        <div className="grid grid-cols-1 gap-2">
          {GAME_MODES.map((mode) => (
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
                  <div className="text-sm font-bold text-white">{mode.name}</div>
                  <div className="text-xs text-gray-400">{mode.description}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{mode.details}</div>
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
        <h2 className="text-sm font-bold text-gray-400 mb-3">AI 風格</h2>
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
              <span>{p.name}</span>
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
          onClick={() => { useGameStore.getState().setGameMode('standard'); navigate('/game'); }}
          className="w-full bg-green-700 hover:bg-green-600 text-xl font-bold"
          leftIcon={<span>🀄</span>}
        >
          開始遊戲
        </Button>
      </motion.div>
    </div>
  );
}
