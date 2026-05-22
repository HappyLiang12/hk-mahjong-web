import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  faan: number;
  gamesPlayed: number;
  winRate: string;
}

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: '麻雀王', score: 12800, faan: 152, gamesPlayed: 120, winRate: '68%' },
  { rank: 2, name: '你', score: 3450, faan: 76, gamesPlayed: 42, winRate: '43%' },
  { rank: 3, name: 'AI 小梅', score: 2900, faan: 68, gamesPlayed: 40, winRate: '40%' },
  { rank: 4, name: 'AI 大明', score: 2200, faan: 55, gamesPlayed: 40, winRate: '30%' },
  { rank: 5, name: 'AI 阿發', score: 1800, faan: 48, gamesPlayed: 40, winRate: '25%' },
];

type SortKey = 'score' | 'faan' | 'gamesPlayed' | 'winRate';

export default function LeaderboardScreen() {
  const navigate = useNavigate();

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
        <h1 className="text-2xl font-bold text-white">排行榜</h1>
        <div className="w-16" />
      </motion.div>

      {/* Leaderboard table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
      >
        {/* Header row */}
        <div className="grid grid-cols-[40px_1fr_80px] gap-2 px-4 py-2 bg-white/5 text-xs font-bold text-gray-400 uppercase tracking-wide">
          <span>#</span>
          <span>玩家</span>
          <span className="text-right">分數</span>
        </div>

        {/* Rows */}
        {LEADERBOARD.map((entry, i) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className={`grid grid-cols-[40px_1fr_80px] gap-2 px-4 py-3 border-b border-white/5 last:border-0 ${
              entry.name === '你' ? 'bg-yellow-400/5' : ''
            }`}
          >
            {/* Rank */}
            <span className="flex items-center justify-center">
              {entry.rank <= 3 ? (
                <span className="text-lg">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                </span>
              ) : (
                <span className="text-sm text-gray-400">{entry.rank}</span>
              )}
            </span>

            {/* Name + stats */}
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{entry.name}</div>
              <div className="text-xs text-gray-500">
                {entry.gamesPlayed} 場 · {entry.faan}番 · 勝率{entry.winRate}
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-yellow-400">
                {entry.score.toLocaleString()}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Legend */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-gray-600 text-center mt-4"
      >
        排行榜數據儲存在本機
      </motion.p>
    </div>
  );
}
