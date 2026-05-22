interface HandControlsProps {
  hasSelectedTile: boolean;
  onDiscard: () => void;
  onCancelSelection: () => void;
  canDraw: boolean;
  onDraw: () => void;
  disabled: boolean;
}

export default function HandControls({
  hasSelectedTile,
  onDiscard,
  onCancelSelection,
  canDraw,
  onDraw,
  disabled,
}: HandControlsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-3">
      {/* Draw button */}
      {canDraw && (
        <button
          onClick={onDraw}
          disabled={disabled}
          className="px-5 py-2 bg-green-700 hover:bg-green-600 disabled:bg-green-800 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow-lg transition-all"
        >
          摸牌 (Draw)
        </button>
      )}

      {/* Discard confirmation */}
      {hasSelectedTile && (
        <>
          <button
            onClick={onDiscard}
            disabled={disabled}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow-lg transition-all"
          >
            打出 (Discard)
          </button>
          <button
            onClick={onCancelSelection}
            disabled={disabled}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 text-white text-sm rounded-lg shadow-lg transition-all"
          >
            取消
          </button>
        </>
      )}
    </div>
  );
}
