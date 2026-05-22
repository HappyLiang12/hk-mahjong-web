import { useEffect, useState } from 'react';

interface TurnIndicatorProps {
  isHumanTurn: boolean;
  currentPlayerName?: string;
  currentPlayerIndex: number;
  phase: string; // 'draw', 'discard', 'claim', 'end'
}

export default function TurnIndicator({
  isHumanTurn,
  currentPlayerName = 'AI',
  currentPlayerIndex,
  phase,
}: TurnIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isHumanTurn) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
    setDots('');
  }, [isHumanTurn]);

  const message = isHumanTurn
    ? '你的回合'
    : `${currentPlayerName} 思考中${dots}`;

  const bgColor = isHumanTurn
    ? 'bg-green-600/80'
    : 'bg-amber-600/60';

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
      <div
        className={`px-5 py-1.5 rounded-full text-sm font-bold text-white shadow-lg backdrop-blur-sm ${bgColor} transition-colors duration-300`}
      >
        {message}
      </div>
    </div>
  );
}
