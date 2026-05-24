interface RoundInfoBarProps {
  wind: string;       // e.g. '東' or '南'
  round: number;      // hand number 1-4
  dealer: number;     // dealer index
  wallCount: number;  // tiles remaining in wall
}

const WIND_CHARS = ['東', '南', '西', '北'];
const WIND_NAMES = ['East', 'South', 'West', 'North'];

export default function RoundInfoBar({
  wind,
  round,
  dealer,
  wallCount,
}: RoundInfoBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm border-b border-white/10">
      {/* Wind + round */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-yellow-400">{wind}</span>
          <span className="text-xs text-gray-400">{WIND_NAMES[WIND_CHARS.indexOf(wind)] ?? wind}</span>
        </div>
        <div className="w-px h-5 bg-white/20" />
        <span className="text-sm text-gray-300">
          {wind}{round}局
        </span>
        <div className="w-px h-5 bg-white/20" />
        <span className="text-sm text-gray-400">
          Dealer: {WIND_CHARS[dealer]}
        </span>
      </div>

      {/* Wall count */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Remaining</span>
        <span className="text-sm font-mono font-bold text-white">{wallCount}</span>
        <span className="text-xs text-gray-500">tiles</span>
      </div>
    </div>
  );
}
