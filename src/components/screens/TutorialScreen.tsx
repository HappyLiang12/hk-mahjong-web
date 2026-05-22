import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';
import { useState } from 'react';

const TUTORIAL_SECTIONS = [
  {
    id: 'tiles',
    title: '認識麻雀牌',
    description: '香港麻雀共有 136 張牌，分為萬子、筒子、索子、風牌、箭牌和花牌。',
    icon: '🀄',
    tips: [
      '萬子 (1-9萬)：一至九萬，共 36 張',
      '筒子 (1-9筒)：一至九筒，共 36 張',
      '索子 (1-9索)：一至九索，共 36 張',
      '風牌：東、南、西、北，各 4 張',
      '箭牌：中、發、白，各 4 張',
      '花牌：春、夏、秋、冬、梅、蘭、竹、菊，各 1 張',
    ],
  },
  {
    id: 'melds',
    title: '牌型組合',
    description: '贏牌需要組成 4 組面子 + 1 對眼。',
    icon: '🃏',
    tips: [
      '順子 (上)：三張同花連續數字，如 4-5-6 萬',
      '刻子 (碰)：三張相同的牌',
      '槓子 (槓)：四張相同的牌',
      '對子 (眼)：兩張相同的牌，需要 1 對',
    ],
  },
  {
    id: 'gameplay',
    title: '遊戲流程',
    description: '基本流程：摸牌 → 理牌 → 棄牌 → 對手回合。',
    icon: '🎮',
    tips: [
      '每回合從牌牆摸一張牌',
      '手上的牌 (含摸到的牌) 共 14 張',
      '選擇一張不需要的牌打出',
      '其他玩家可以碰、上、槓或食糊',
      '如果沒有人食糊，下一位玩家繼續摸牌',
      '有人食糊後該局結束，進入計分',
    ],
  },
  {
    id: 'scoring',
    title: '計分方式',
    description: '香港麻雀以「番」為計分單位，番數愈高，得分愈多。',
    icon: '💰',
    tips: [
      '最低起糊番數視乎設定 (通常 3 番)',
      '基本番型：平糊 (+1)、自摸 (+1)、無花 (+1)',
      '中級番型：混一色 (+3)、對對糊 (+3)',
      '高級番型：清一色 (+7)、大三元 (+8)',
      '極高番型：十三么 (+13)、小四喜 (+13)、大四喜 (+16)',
    ],
  },
  {
    id: 'tips',
    title: '新手貼士',
    description: '幾個實用小技巧幫你快速上手。',
    icon: '💡',
    tips: [
      '優先棄掉單獨的風牌和箭牌',
      '盡早組成順子和刻子',
      '留意對手棄牌，避免打出危險牌',
      '如有機會食糊，優先考慮',
      '練習模式可以慢慢思考，不設時間限制',
      '使用提示功能可以獲得 AI 建議',
    ],
  },
];

export default function TutorialScreen() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('tiles');

  const current = TUTORIAL_SECTIONS.find((s) => s.id === activeSection)!;

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
        <h1 className="text-2xl font-bold text-white">教學</h1>
        <div className="w-16" />
      </motion.div>

      {/* Section tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 overflow-x-auto pb-2 mb-4"
      >
        {TUTORIAL_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === s.id
                ? 'bg-green-700 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.title}</span>
          </button>
        ))}
      </motion.div>

      {/* Section content */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-xl p-5 border border-white/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{current.icon}</span>
          <h2 className="text-xl font-bold text-white">{current.title}</h2>
        </div>
        <p className="text-sm text-gray-300 mb-4">{current.description}</p>
        <ul className="space-y-2">
          {current.tips.map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-gray-300"
            >
              <span className="text-green-400 mt-0.5">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
