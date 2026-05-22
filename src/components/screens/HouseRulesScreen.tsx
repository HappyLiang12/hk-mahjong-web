import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';
import { useState } from 'react';

interface RuleToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function RuleToggle({ label, description, checked, onChange }: RuleToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <div className="flex-1">
        <span className="text-sm text-white">{label}</span>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-green-500' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

interface RuleSelectProps {
  label: string;
  value: string | number;
  options: { label: string; value: string | number }[];
  onChange: (v: string | number) => void;
}

function RuleSelect({ label, value, options, onChange }: RuleSelectProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <span className="text-sm text-white">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10"
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const PRESETS = [
  { id: 'standard', name: '標準', description: '東南西北四圈 · 3番起糊 · 有花' },
  { id: 'casual', name: '休閒', description: '無限圈 · 1番起糊 · 放寬計分' },
  { id: 'competitive', name: '競技', description: '東南西北四圈 · 3番起糊 · 嚴格規則' },
  { id: 'beginner', name: '新手', description: '一圈 · 0番起糊 · 簡化計分' },
];

export default function HouseRulesScreen() {
  const navigate = useNavigate();

  const [selectedPreset, setSelectedPreset] = useState('standard');
  const [minFaan, setMinFaan] = useState(3);
  const [flowerTiles, setFlowerTiles] = useState(true);
  const [allowChow, setAllowChow] = useState(true);
  const [allowConcealedKong, setAllowConcealedKong] = useState(true);
  const [selfDrawOnly, setSelfDrawOnly] = useState(false);
  const [winOnKong, setWinOnKong] = useState(true);
  const [jokerWind, setJokerWind] = useState(false);

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
        <h1 className="text-2xl font-bold text-white">牌例設定</h1>
        <div className="w-16" />
      </motion.div>

      {/* Presets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <h2 className="text-sm font-bold text-gray-400 mb-3">預設牌例</h2>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(preset.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selectedPreset === preset.id
                  ? 'bg-green-700/30 border-green-500'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-sm font-bold text-white">{preset.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{preset.description}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Custom rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 rounded-xl p-4 border border-white/10"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">自訂規則</h2>
        <RuleSelect
          label="最低起糊番數"
          value={minFaan}
          options={[
            { label: '0 番 (無限制)', value: 0 },
            { label: '1 番', value: 1 },
            { label: '3 番 (標準)', value: 3 },
            { label: '5 番', value: 5 },
          ]}
          onChange={(v) => setMinFaan(Number(v))}
        />
        <RuleToggle
          label="花牌"
          description="啟用花牌 (補花機制)"
          checked={flowerTiles}
          onChange={setFlowerTiles}
        />
        <RuleToggle
          label="可以上牌"
          description="允許上 (Chow) 牌"
          checked={allowChow}
          onChange={setAllowChow}
        />
        <RuleToggle
          label="可以暗槓"
          description="允許暗槓"
          checked={allowConcealedKong}
          onChange={setAllowConcealedKong}
        />
        <RuleToggle
          label="只限自摸"
          description="只能自摸食糊，不能食出銃"
          checked={selfDrawOnly}
          onChange={setSelfDrawOnly}
        />
        <RuleToggle
          label="搶槓食糊"
          description="可以搶槓 (槓上開花)"
          checked={winOnKong}
          onChange={setWinOnKong}
        />
        <RuleToggle
          label="百搭風"
          description="圈風/門風可作百搭牌"
          checked={jokerWind}
          onChange={setJokerWind}
        />
      </motion.div>

      {/* Save hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-gray-500 text-center mt-4"
      >
        設定會自動儲存到本機
      </motion.p>
    </div>
  );
}
