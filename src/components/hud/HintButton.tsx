interface HintButtonProps {
  onHint: () => void;
  hintsRemaining: number;
  disabled: boolean;
}

export default function HintButton({
  onHint,
  hintsRemaining,
  disabled,
}: HintButtonProps) {
  return (
    <button
      onClick={onHint}
      disabled={disabled || hintsRemaining <= 0}
      title={hintsRemaining > 0 ? `${hintsRemaining} hints remaining` : 'No hints left'}
      className={`
        absolute bottom-4 left-4 z-20
        flex items-center gap-1.5 px-3 py-2
        rounded-lg shadow-lg text-xs font-bold transition-all
        ${
          disabled || hintsRemaining <= 0
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
