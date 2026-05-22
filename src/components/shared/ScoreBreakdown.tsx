import { type ScoreResult } from '@/types';

export interface ScoreBreakdownProps {
  /** The score breakdown to display */
  result: ScoreResult;
  /** Show the payment amount */
  showPayment?: boolean;
  /** Custom class name */
  className?: string;
}

export default function ScoreBreakdown({
  result,
  showPayment = true,
  className,
}: ScoreBreakdownProps) {
  return (
    <div
      className={`rounded-xl border border-amber-700/40 bg-neutral-900/90 p-4 backdrop-blur ${className ?? ''}`}
    >
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">
        番數明細
      </h3>

      {result.breakdown.length === 0 ? (
        <p className="text-sm text-neutral-500 italic">無番數</p>
      ) : (
        <ul className="space-y-2">
          {result.breakdown.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-neutral-800/60 px-3 py-2"
            >
              <span className="text-sm text-neutral-200">{item.name}</span>
              <span className="ml-3 shrink-0 rounded-full bg-amber-600/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                {item.faan} 番
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Total faan */}
      <div className="mt-3 flex items-center justify-between border-t border-neutral-700 pt-3">
        <span className="text-sm font-semibold text-neutral-300">總番數</span>
        <span className="text-lg font-bold text-amber-400">{result.faan} 番</span>
      </div>

      {/* Payment */}
      {showPayment && result.payment > 0 && (
        <div className="mt-2 flex items-center justify-between border-t border-neutral-700 pt-2">
          <span className="text-sm text-neutral-400">收入</span>
          <span className="text-base font-semibold text-green-400">
            +{result.payment}
          </span>
        </div>
      )}
    </div>
  );
}
