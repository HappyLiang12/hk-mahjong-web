interface QuickActionsProps {
  onUndo?: () => void;
  onSettings?: () => void;
  onForfeit?: () => void;
  onPause?: () => void;
  canUndo: boolean;
}

export default function QuickActions({
  onUndo,
  onSettings,
  onForfeit,
  onPause,
  canUndo,
}: QuickActionsProps) {
  return (
    <div className="absolute top-4 right-4 z-20 flex gap-1.5">
      {/* Undo */}
      {onUndo && (
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title={canUndo ? '撤銷 (Undo)' : '無可撤銷的操作'}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold transition-all"
        >
          ↩
        </button>
      )}

      {/* Pause */}
      {onPause && (
        <button
          onClick={onPause}
          title="Pause"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
        >
          ⏸
        </button>
      )}

      {/* Settings */}
      {onSettings && (
        <button
          onClick={onSettings}
          title="Settings"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
        >
          ⚙
        </button>
      )}

      {/* Forfeit */}
      {onForfeit && (
        <button
          onClick={onForfeit}
          title="Forfeit"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-900/30 hover:bg-red-800/50 text-red-400 text-xs font-bold transition-all"
        >
          ✕
        </button>
      )}
    </div>
  );
}
