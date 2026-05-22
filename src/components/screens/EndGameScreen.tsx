import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';

interface EndGameScreenProps {
  winnerIndex?: number;
  winnerName?: string;
  finalScores?: number[];
}

export default function EndGameScreen({
  winnerIndex = 0,
  winnerName = '你',
  finalScores = [280, -60, -100, -120],
}: EndGameScreenProps) {
  const navigate = useNavigate();
  const playerNames = ['你', 'AI 小梅', 'AI 大明', 'AI 阿發'];
  const seatWinds = ['東', '南', '西', '北'];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
      {/* Winner announcement */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-5xl">🏆</h1>
        <h1 className="text-4xl font-bold text-yellow-400 mt-2">遊戲結束</h1>
        <p className="text-xl text-white mt-2">
          {playerNames[winnerIndex]}
          <span className="text-sm text-yellow-400 ml-2">{seatWinds[winnerIndex]}位</span>
        </p>
        <p className="text-2xl text-green-400 mt-1 font-mono font-bold">+{finalScores[winnerIndex]} 分</p>
      </motion.div>

      {/* Final scoreboard */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm bg-white/5 rounded-xl p-4 border border-white/10"
      >
        <h2 className="text-sm font-bold text-gray-400 mb-3">最終分數</h2>
        <div className="space-y-2">
          {playerNames.map((name, i) => (
            <div
              key={name}
              className={`flex justify-between text-sm py-1 px-2 rounded ${
                i === winnerIndex ? 'bg-yellow-400/10' : ''
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{seatWinds[i]}</span>
                {name}
                {i === winnerIndex && <span className="text-xs">👑</span>}
              </span>
              <span
                className={`font-mono ${
                  finalScores[i] >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {finalScores[i] >= 0 ? '+' : ''}{finalScores[i]}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-4 mt-4"
      >
        <Button
          variant="secondary"
          onClick={() => navigate('/game/scoring')}
          className="bg-amber-600 hover:bg-amber-500"
        >
          查看番數明細
        </Button>
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
          主選單
        </Button>
      </motion.div>
    </div>
  );
}
