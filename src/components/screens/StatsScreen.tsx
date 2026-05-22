import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// Mock stats data
const MOCK_STATS = {
  gamesPlayed: 42,
  wins: 18,
  losses: 22,
  draws: 2,
  winRate: '42.9%',
  highestFaan: 10,
  averageFaan: 4.2,
  totalPoints: 3450,
  fastestWin: '3m 12s',
  longestGame: '22m 48s',
};

export default function StatsScreen() {
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
        <h1 className="text-2xl font-bold text-white">統計數據</h1>
        <div className="w-16" />
      </motion.div>

      {/* Overview cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-sm font-bold text-gray-400 mb-3">總覽</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="遊玩局數" value={MOCK_STATS.gamesPlayed} />
          <StatCard label="勝率" value={MOCK_STATS.winRate} />
          <StatCard label="最高番數" value={MOCK_STATS.highestFaan + '番'} />
        </div>
      </motion.div>

      {/* Win/Loss breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4"
      >
        <h2 className="text-sm font-bold text-gray-400 mb-3">勝負記錄</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="勝" value={MOCK_STATS.wins} sub="贏局" />
          <StatCard label="負" value={MOCK_STATS.losses} sub="輸局" />
          <StatCard label="和" value={MOCK_STATS.draws} sub="流局" />
        </div>
      </motion.div>

      {/* Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4"
      >
        <h2 className="text-sm font-bold text-gray-400 mb-3">表現</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="平均番數" value={MOCK_STATS.averageFaan + '番'} />
          <StatCard label="總分" value={MOCK_STATS.totalPoints} />
          <StatCard label="最快食糊" value={MOCK_STATS.fastestWin} />
        </div>
      </motion.div>

      {/* Placeholder for future charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-white/5 rounded-xl p-5 border border-white/10 border-dashed text-center"
      >
        <p className="text-sm text-gray-500">
          📊 圖表功能開發中 (Recharts)
        </p>
        <p className="text-xs text-gray-600 mt-1">
          勝率趨勢、番數分佈、每日遊玩次數
        </p>
      </motion.div>
    </div>
  );
}
