import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';

interface MatchRecord {
  id: string;
  date: string;
  result: 'win' | 'loss' | 'draw';
  score: number;
  faan: number;
  duration: string;
  opponentFaan: number;
}

const MOCK_HISTORY: MatchRecord[] = [
  { id: '1', date: '2026-05-21 14:30', result: 'win', score: 280, faan: 8, duration: '5m 23s', opponentFaan: 0 },
  { id: '2', date: '2026-05-20 20:15', result: 'loss', score: -80, faan: 0, duration: '7m 11s', opponentFaan: 5 },
  { id: '3', date: '2026-05-20 18:00', result: 'win', score: 150, faan: 4, duration: '4m 58s', opponentFaan: 0 },
  { id: '4', date: '2026-05-19 21:45', result: 'win', score: 220, faan: 6, duration: '6m 02s', opponentFaan: 0 },
  { id: '5', date: '2026-05-19 15:30', result: 'loss', score: -120, faan: 0, duration: '8m 30s', opponentFaan: 6 },
  { id: '6', date: '2026-05-18 19:20', result: 'draw', score: 0, faan: 0, duration: '10m 45s', opponentFaan: 0 },
  { id: '7', date: '2026-05-18 11:00', result: 'win', score: 310, faan: 10, duration: '3m 12s', opponentFaan: 0 },
  { id: '8', date: '2026-05-17 22:15', result: 'loss', score: -60, faan: 0, duration: '5m 40s', opponentFaan: 4 },
];

const RESULT_CONFIG = {
  win: { label: '勝', color: 'text-green-400', bg: 'bg-green-400/10' },
  loss: { label: '負', color: 'text-red-400', bg: 'bg-red-400/10' },
  draw: { label: '和', color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

export default function MatchHistoryScreen() {
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
        <h1 className="text-2xl font-bold text-white">對戰記錄</h1>
        <div className="w-16" />
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-4"
      >
        {[
          { label: '總場數', value: MOCK_HISTORY.length },
          { label: '勝', value: MOCK_HISTORY.filter((m) => m.result === 'win').length, color: 'text-green-400' },
          { label: '負', value: MOCK_HISTORY.filter((m) => m.result === 'loss').length, color: 'text-red-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/5 rounded-xl p-3 border border-white/10 text-center"
          >
            <div className={`text-xl font-bold ${stat.color ?? 'text-white'}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Match list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {MOCK_HISTORY.map((match, i) => {
          const config = RESULT_CONFIG[match.result];
          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.03 }}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
            >
              {/* Result badge */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${config.color} ${config.bg}`}
              >
                {config.label}
              </div>

              {/* Match info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">{match.date}</div>
                <div className="text-xs text-gray-500">
                  {match.result === 'win' && `${match.faan}番 · `}
                  {match.duration}
                  {match.result === 'loss' && ` · 對手${match.opponentFaan}番`}
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div
                  className={`text-sm font-mono font-bold ${
                    match.score > 0 ? 'text-green-400' : match.score < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}
                >
                  {match.score > 0 ? '+' : ''}{match.score}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
