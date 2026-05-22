import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: { current: number; target: number };
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-game', name: '初次上場', description: '完成第一局遊戲', icon: '🎮', unlocked: true },
  { id: 'first-win', name: '首勝', description: '贏得第一局遊戲', icon: '🏆', unlocked: true },
  { id: '10-games', name: '常客', description: '完成 10 局遊戲', icon: '🎯', unlocked: true },
  { id: '50-games', name: '老手', description: '完成 50 局遊戲', icon: '⭐', unlocked: false, progress: { current: 42, target: 50 } },
  { id: '5-faan', name: '小有成就', description: '打出 5 番或以上的牌', icon: '💫', unlocked: true },
  { id: '10-faan', name: '大贏家', description: '打出 10 番或以上的牌', icon: '🌟', unlocked: false, progress: { current: 0, target: 1 } },
  { id: '13-orphans', name: '十三么', description: '以十三么食糊', icon: '🗡️', unlocked: false },
  { id: 'all-pong', name: '對對糊達人', description: '以對對糊食糊 10 次', icon: '🔨', unlocked: false, progress: { current: 3, target: 10 } },
  { id: 'self-draw', name: '自摸之王', description: '自摸 20 次', icon: '🤲', unlocked: false, progress: { current: 8, target: 20 } },
  { id: 'streak-3', name: '連勝', description: '連續贏 3 局', icon: '🔥', unlocked: false, progress: { current: 2, target: 3 } },
  { id: 'fast-win', name: '快槍手', description: '在 3 分鐘內食糊', icon: '⚡', unlocked: false },
  { id: '100-faan', name: '番數大師', description: '累計獲得 100 番', icon: '👑', unlocked: false, progress: { current: 76, target: 100 } },
];

export default function AchievementsScreen() {
  const navigate = useNavigate();
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length;

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
        <h1 className="text-2xl font-bold text-white">成就</h1>
        <div className="w-16" />
      </motion.div>

      {/* Progress header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">進度</span>
          <span className="text-sm font-bold text-yellow-400">
            {unlockedCount} / {ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-full bg-yellow-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* Achievement list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {ACHIEVEMENTS.map((achievement, i) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.03 }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              achievement.unlocked
                ? 'bg-yellow-400/5 border-yellow-500/30'
                : 'bg-white/5 border-white/10 opacity-70'
            }`}
          >
            <span className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
              {achievement.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white">{achievement.name}</div>
              <div className="text-xs text-gray-400">{achievement.description}</div>
              {achievement.progress && !achievement.unlocked && (
                <div className="mt-1.5">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                    <span>{achievement.progress.current} / {achievement.progress.target}</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${(achievement.progress.current / achievement.progress.target) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {achievement.unlocked && (
              <span className="text-yellow-400 text-sm">✓</span>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
