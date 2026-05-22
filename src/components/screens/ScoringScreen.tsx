import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';

// Mock score data for visual development
const MOCK_SCORES = [
  { name: '你', faan: 8, points: 320, isWinner: true, seatWind: '東' as const },
  { name: 'AI 小梅', faan: 0, points: -80, isWinner: false, seatWind: '南' as const },
  { name: 'AI 大明', faan: 0, points: -120, isWinner: false, seatWind: '西' as const },
  { name: 'AI 阿發', faan: 0, points: -120, isWinner: false, seatWind: '北' as const },
];

const MOCK_FAAN_BREAKDOWN = [
  { name: '混一色', faan: 3 },
  { name: '對對糊', faan: 3 },
  { name: '自摸', faan: 1 },
  { name: '無花', faan: 1 },
];

export default function ScoringScreen() {
  const navigate = useNavigate();

  const winner = MOCK_SCORES.find((s) => s.isWinner);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-4xl font-bold text-yellow-400"
      >
        🎉 食糊！
      </motion.h1>

      {winner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-3xl font-bold text-white">
            {winner.name}
            <span className="text-sm text-yellow-400 ml-2">{winner.seatWind}位</span>
          </p>
          <p className="text-2xl text-green-400 mt-1">{winner.faan} 番</p>
        </motion.div>
      )}

      {/* Faan breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm bg-white/5 rounded-xl p-4 border border-white/10"
      >
        <h2 className="text-sm font-bold text-gray-400 mb-3">番數明細</h2>
        <div className="space-y-2">
          {MOCK_FAAN_BREAKDOWN.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex justify-between text-sm"
            >
              <span className="text-gray-300">{item.name}</span>
              <span className="text-yellow-400 font-mono">+{item.faan}番</span>
            </motion.div>
          ))}
          <div className="border-t border-white/10 pt-2 mt-2 flex justify-between text-sm">
            <span className="text-white font-bold">總計</span>
            <span className="text-yellow-400 font-bold font-mono">{winner?.faan}番</span>
          </div>
        </div>
      </motion.div>

      {/* Payment table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-sm bg-white/5 rounded-xl p-4 border border-white/10"
      >
        <h2 className="text-sm font-bold text-gray-400 mb-3">結算</h2>
        <div className="space-y-1">
          {MOCK_SCORES.map((player) => (
            <div
              key={player.name}
              className={`flex justify-between text-sm py-1 ${
                player.isWinner ? 'text-green-400' : 'text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{player.seatWind}</span>
                {player.name}
                {player.isWinner && <span className="text-xs">🏆</span>}
              </span>
              <span className={`font-mono ${player.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {player.points >= 0 ? '+' : ''}{player.points}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="flex gap-4 mt-4"
      >
        <Button
          variant="primary"
          onClick={() => navigate('/lobby')}
          className="bg-green-700 hover:bg-green-600"
        >
          再玩一局
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
        >
          返回主選單
        </Button>
      </motion.div>
    </div>
  );
}
