import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';
import { useState } from 'react';

interface ReplayEntry {
  id: string;
  date: string;
  result: 'win' | 'loss';
  faan: number;
  duration: string;
  winner: string;
}

const MOCK_REPLAYS: ReplayEntry[] = [
  { id: 'r1', date: '2026-05-21 14:30', result: 'win', faan: 8, duration: '5m 23s', winner: '你' },
  { id: 'r2', date: '2026-05-20 18:00', result: 'win', faan: 4, duration: '4m 58s', winner: '你' },
  { id: 'r3', date: '2026-05-19 21:45', result: 'win', faan: 6, duration: '6m 02s', winner: '你' },
  { id: 'r4', date: '2026-05-18 11:00', result: 'win', faan: 10, duration: '3m 12s', winner: '你' },
  { id: 'r5', date: '2026-05-15 20:30', result: 'loss', faan: 0, duration: '8m 45s', winner: 'AI 小梅' },
];

export default function ReplayScreen() {
  const navigate = useNavigate();
  const [selectedReplay, setSelectedReplay] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);

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
        <h1 className="text-2xl font-bold text-white">重播錄像</h1>
        <div className="w-16" />
      </motion.div>

      {/* Replay list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        {MOCK_REPLAYS.map((replay, i) => (
          <motion.button
            key={replay.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.04 }}
            onClick={() => setSelectedReplay(replay.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all ${
              selectedReplay === replay.id
                ? 'bg-purple-700/20 border-purple-500'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Result badge */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                  replay.result === 'win'
                    ? 'text-green-400 bg-green-400/10'
                    : 'text-red-400 bg-red-400/10'
                }`}
              >
                {replay.result === 'win' ? '勝' : '負'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">{replay.date}</div>
                <div className="text-xs text-gray-500">
                  {replay.faan}番 · {replay.duration} · {replay.winner}勝
                </div>
              </div>

              {/* Play icon */}
              <span className="text-gray-400">
                {selectedReplay === replay.id ? '⏹' : '▶️'}
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Player controls (when replay is selected) */}
      {selectedReplay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <h2 className="text-sm font-bold text-white mb-3">播放控制</h2>

          <div className="flex items-center justify-center gap-4 mb-3">
            {/* Previous step */}
            <button className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
              ⏮
            </button>

            {/* Play / Pause */}
            <button
              onClick={() => setPlaying(!playing)}
              className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xl flex items-center justify-center shadow-lg transition-all"
            >
              {playing ? '⏸' : '▶️'}
            </button>

            {/* Next step */}
            <button className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
              ⏭
            </button>
          </div>

          {/* Speed control */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400">速度:</span>
            {[0.5, 1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaySpeed(speed)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  playSpeed === speed
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Progress bar (placeholder) */}
          <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '25%' }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>1:20</span>
            <span>5:23</span>
          </div>
        </motion.div>
      )}

      {/* Info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-gray-600 text-center mt-4"
      >
        重播功能可查看過往對局的重播錄像
      </motion.p>
    </div>
  );
}
