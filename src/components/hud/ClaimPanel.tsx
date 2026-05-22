import { useEffect, useState } from 'react';
import type { ClaimIntent } from '@/types';

interface ClaimPanelProps {
  claims: ClaimIntent[];
  onClaim: (type: ClaimIntent['type']) => void;
  onPass: () => void;
  timeoutMs?: number; // auto-pass timeout
}

const CLAIM_LABELS: Record<string, { label: string; color: string }> = {
  chow: { label: '上 (Chow)', color: 'bg-blue-600 hover:bg-blue-500' },
  pong: { label: '碰 (Pong)', color: 'bg-amber-600 hover:bg-amber-500' },
  kong: { label: '槓 (Kong)', color: 'bg-purple-600 hover:bg-purple-500' },
  win: { label: '食糊！(Win)', color: 'bg-red-600 hover:bg-red-500' },
};

export default function ClaimPanel({
  claims,
  onClaim,
  onPass,
  timeoutMs = 5000,
}: ClaimPanelProps) {
  const [remaining, setRemaining] = useState(timeoutMs);

  useEffect(() => {
    if (claims.length === 0) return;

    setRemaining(timeoutMs);
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 100) {
          clearInterval(timer);
          onPass();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [claims, timeoutMs, onPass]);

  if (claims.length === 0) return null;

  const availableTypes = [...new Set(claims.map((c) => c.type))];
  const progressPct = (remaining / timeoutMs) * 100;

  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20">
      <div className="flex flex-col items-center gap-2">
        {/* Timer bar */}
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-100 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Claim buttons */}
        <div className="flex gap-2">
          {availableTypes.map((type) => {
            const info = CLAIM_LABELS[type];
            if (!info) return null;
            return (
              <button
                key={type}
                onClick={() => onClaim(type)}
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all ${info.color}`}
              >
                {info.label}
              </button>
            );
          })}

          {/* Pass button */}
          <button
            onClick={onPass}
            className="px-4 py-2 text-sm font-bold text-white bg-gray-600 hover:bg-gray-500 rounded-lg shadow-lg transition-all"
          >
            過 (Pass)
          </button>
        </div>
      </div>
    </div>
  );
}
