import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';
import { useSettingsStore, type AiDifficulty, type GameSpeed, type ThemeName } from '@/store/settingsStore';

interface SettingToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function SettingToggle({ label, description, value, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <div>
        <span className="text-sm text-white">{label}</span>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        aria-label={label}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          value ? 'bg-green-500' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            value ? 'left-6' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

interface SettingSelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}

function SettingSelect({ label, value, options, onChange }: SettingSelectProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <span className="text-sm text-white">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 focus:outline-none focus:border-green-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsScreen() {
  const navigate = useNavigate();

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const autoSort = useSettingsStore((s) => s.autoSort);
  const showHints = useSettingsStore((s) => s.showHints);
  const aiDifficulty = useSettingsStore((s) => s.aiDifficulty);
  const gameSpeed = useSettingsStore((s) => s.gameSpeed);
  const language = useSettingsStore((s) => s.language);
  const themeName = useSettingsStore((s) => s.themeName);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  return (
    <div className="flex flex-col min-h-screen p-4 max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 mt-2"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          ← 返回
        </Button>
        <h1 className="text-2xl font-bold text-white">設定</h1>
        <div className="w-16" />
      </motion.div>

      {/* Settings sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-0"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">音效</h2>
        <SettingToggle
          label="音效"
          description="遊戲音效 (碰牌、食糊等)"
          value={soundEnabled}
          onChange={(v) => updateSetting('soundEnabled', v)}
        />
        <SettingToggle
          label="背景音樂"
          description="遊戲背景音樂"
          value={musicEnabled}
          onChange={(v) => updateSetting('musicEnabled', v)}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 rounded-xl p-4 border border-white/10 mt-4"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">遊戲</h2>
        <SettingSelect
          label="AI 難度"
          value={aiDifficulty}
          options={[
            { label: '初級', value: 'easy' },
            { label: '中級', value: 'normal' },
            { label: '高級', value: 'hard' },
          ]}
          onChange={(v) => updateSetting('aiDifficulty', v as unknown as AiDifficulty)}
        />
        <SettingSelect
          label="遊戲速度"
          value={gameSpeed}
          options={[
            { label: '慢', value: 'slow' },
            { label: '正常', value: 'normal' },
            { label: '快', value: 'fast' },
          ]}
          onChange={(v) => updateSetting('gameSpeed', v as unknown as GameSpeed)}
        />
        <SettingToggle
          label="自動理牌"
          description="摸牌後自動排序手牌"
          value={autoSort}
          onChange={(v) => updateSetting('autoSort', v)}
        />
        <SettingToggle
          label="提示系統"
          description="顯示棄牌建議"
          value={showHints}
          onChange={(v) => updateSetting('showHints', v)}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/5 rounded-xl p-4 border border-white/10 mt-4"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">一般</h2>
        <SettingSelect
          label="語言"
          value={language}
          options={[
            { label: '繁體中文', value: 'zh-TW' },
            { label: '簡體中文', value: 'zh-CN' },
            { label: '日本語', value: 'ja' },
            { label: 'English', value: 'en' },
          ]}
          onChange={(v) => updateSetting('language', v)}
        />
        <SettingSelect
          label="主題"
          value={themeName}
          options={[
            { label: '經典', value: 'classic' },
            { label: '深色', value: 'dark' },
            { label: '茶館', value: 'teahouse' },
            { label: '花園', value: 'garden' },
            { label: '夜景', value: 'night' },
          ]}
          onChange={(v) => updateSetting('themeName', v as unknown as ThemeName)}
        />
      </motion.div>

      {/* Save indicator */}
      <p className="text-xs text-gray-500 text-center mt-4">
        設定會自動儲存到本機
      </p>
    </div>
  );
}
