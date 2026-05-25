import { useEffect, useRef, useState } from 'react';

interface TurnTimerProps {
  seconds: number; // total seconds allowed per turn
  running: boolean; // is the timer active?
  onTimeout?: () => void;
}

export default function TurnTimer({
  seconds = 30,
  running,
  onTimeout,
}: TurnTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const onTimeoutRef = useRef(onTimeout);

  // Keep ref in sync with latest onTimeout prop — avoids React 18 stale closure
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeoutRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  if (!running) return null;

  const isUrgent = remaining <= 5;
  const pct = (remaining / seconds) * 100;
  const barColor = isUrgent ? 'bg-red-500' : remaining <= 10 ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="absolute top-28 right-4 z-10 flex items-center gap-2">
      <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-1000 ease-linear`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-white'}`}>
        {remaining}s
      </span>
    </div>
  );
}
