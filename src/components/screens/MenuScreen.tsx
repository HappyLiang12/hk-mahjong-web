import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function MenuScreen() {
  const navigate = useNavigate();

  const menuItems = [
    { label: '新遊戲', path: '/lobby', icon: '🎮', color: 'bg-green-700 hover:bg-green-600' },
    { label: '繼續遊戲', path: '/game', icon: '▶️', color: 'bg-blue-700 hover:bg-blue-600' },
    { label: '練習模式', path: '/practice', icon: '🏋️', color: 'bg-teal-700 hover:bg-teal-600' },
    { label: '設定', path: '/settings', icon: '⚙️', color: 'bg-gray-700 hover:bg-gray-600' },
    { label: '統計', path: '/stats', icon: '📊', color: 'bg-gray-700 hover:bg-gray-600' },
    { label: '成就', path: '/achievements', icon: '🏆', color: 'bg-gray-700 hover:bg-gray-600' },
    { label: '排行榜', path: '/leaderboard', icon: '📋', color: 'bg-gray-700 hover:bg-gray-600' },
    { label: '教學', path: '/tutorial', icon: '📖', color: 'bg-gray-700 hover:bg-gray-600' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-2"
      >
        <h1 className="text-6xl font-bold text-yellow-400 drop-shadow-lg">🀄</h1>
        <h1 className="text-4xl font-bold text-yellow-400 mt-2">香港麻雀</h1>
        <p className="text-lg text-gray-400 mt-1">HK Mahjong 3D</p>
      </motion.div>

      {/* Menu items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-col gap-3 w-72 mt-2"
      >
        {menuItems.map((item, i) => (
          <motion.button
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 px-5 py-3 text-white text-lg font-bold rounded-xl transition-all shadow-lg ${item.color}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.3 }}
        className="text-xs text-gray-600 mt-6"
      >
        v1.0.0 — React Three Fiber
      </motion.p>
    </div>
  );
}
