interface HintButtonProps {
  onHint: () => void;
  hintsRemaining: number;
  disabled: boolean;
  phase?: string;  // P7: phase-based disable
}

export default function HintButton({
  onHint,
  hintsRemaining,
  disabled,
  phase,
}: HintButtonProps) {
  const phaseDisabled = phase !== undefined && phase !== 'discard';
  const isDisabled = disabled || hintsRemaining <= 0 || phaseDisabled;

  return (
    <button
      onClick={onHint}
      disabled={isDisabled}
      title={
        phaseDisabled
          ? '提示僅在棄牌階段可用'
          : hintsRemaining > 0
            ? `${hintsRemaining} 次提示可用`
            : '已無可用提示'
      }
      className={`
        absolute bottom-4 left-4 z-20
        flex items-center gap-1.5 px-3 py-2
        rounded-lg shadow-lg text-xs font-bold transition-all
        ${
          isDisabled
            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600/80 hover:bg-indigo-500 text-white'
        }
      `}
    >
      <span>💡</span>
      <span>提示</span>
      {hintsRemaining > 0 && (
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/30 text-[10px]">
          {hintsRemaining}
        </span>
      )}
    </button>
  );
}
