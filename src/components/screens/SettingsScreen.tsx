import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
          {t('settings.back')}
        </Button>
        <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
        <div className="w-16" />
      </motion.div>

      {/* Sound section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-0"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
          {t('settings.soundSection')}
        </h2>
        <SettingToggle
          label={t('settings.sound')}
          description={t('settings.soundDesc')}
          value={soundEnabled}
          onChange={(v) => updateSetting('soundEnabled', v)}
        />
        <SettingToggle
          label={t('settings.music')}
          description={t('settings.musicDesc')}
          value={musicEnabled}
          onChange={(v) => updateSetting('musicEnabled', v)}
        />
      </motion.div>

      {/* Gameplay section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 rounded-xl p-4 border border-white/10 mt-4"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
          {t('settings.gameSection')}
        </h2>
        <SettingSelect
          label={t('settings.difficulty')}
          value={aiDifficulty}
          options={[
            { label: t('settings.easy'), value: 'easy' },
            { label: t('settings.normal'), value: 'normal' },
            { label: t('settings.hard'), value: 'hard' },
          ]}
          onChange={(v) => updateSetting('aiDifficulty', v as unknown as AiDifficulty)}
        />
        <SettingSelect
          label={t('settings.gameSpeed')}
          value={gameSpeed}
          options={[
            { label: t('settings.slow'), value: 'slow' },
            { label: t('settings.speedNormal'), value: 'normal' },
            { label: t('settings.fast'), value: 'fast' },
          ]}
          onChange={(v) => updateSetting('gameSpeed', v as unknown as GameSpeed)}
        />
        <SettingToggle
          label={t('settings.autoSort')}
          description={t('settings.autoSortDesc')}
          value={autoSort}
          onChange={(v) => updateSetting('autoSort', v)}
        />
        <SettingToggle
          label={t('settings.hintSystem')}
          description={t('settings.hintSystemDesc')}
          value={showHints}
          onChange={(v) => updateSetting('showHints', v)}
        />
      </motion.div>

      {/* General section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/5 rounded-xl p-4 border border-white/10 mt-4"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
          {t('settings.generalSection')}
        </h2>
        <SettingSelect
          label={t('settings.language')}
          value={language}
          options={[
            { label: t('settings.langZhTW'), value: 'zh-TW' },
            { label: t('settings.langZhCN'), value: 'zh-CN' },
            { label: t('settings.langJa'), value: 'ja' },
            { label: t('settings.langEn'), value: 'en' },
          ]}
          onChange={(v) => updateSetting('language', v)}
        />
        <SettingSelect
          label={t('settings.theme')}
          value={themeName}
          options={[
            { label: t('settings.themeClassic'), value: 'classic' },
            { label: t('settings.themeDark'), value: 'dark' },
            { label: t('settings.themeTeahouse'), value: 'teahouse' },
            { label: t('settings.themeGarden'), value: 'garden' },
            { label: t('settings.themeNight'), value: 'night' },
          ]}
          onChange={(v) => updateSetting('themeName', v as unknown as ThemeName)}
        />
      </motion.div>

      {/* Save indicator */}
      <p className="text-xs text-gray-500 text-center mt-4">
        {t('settings.autoSaveNote')}
      </p>
    </div>
  );
}
