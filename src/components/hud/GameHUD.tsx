import type { Tile, ClaimIntent } from '@/types';
import RoundInfoBar from './RoundInfoBar';
import TurnIndicator from './TurnIndicator';
import ClaimPanel from './ClaimPanel';
import TurnTimer from './TurnTimer';
import HandControls from './HandControls';
import QuickActions from './QuickActions';
import HintButton from './HintButton';

interface GameHUDProps {
  // Round info
  wind: string;
  round: number;
  dealer: number;
  wallCount: number;

  // Turn state
  isHumanTurn: boolean;
  currentPlayerIndex: number;
  currentPlayerName?: string;
  phase: string;

  // Claims
  claims: ClaimIntent[];
  onClaim: (type: ClaimIntent['type']) => void;
  onPass: () => void;
  claimTimeoutMs?: number;

  // Hand controls
  hasSelectedTile: boolean;
  onDiscard: () => void;
  onCancelSelection: () => void;
  canDraw: boolean;
  onDraw: () => void;
  inputDisabled: boolean;

  // Timer
  turnTimeSeconds: number;
  timerRunning: boolean;
  onTimeout?: () => void;

  // Quick actions
  onUndo?: () => void;
  onSettings?: () => void;
  onForfeit?: () => void;
  onPause?: () => void;
  canUndo: boolean;

  // Hint
  onHint: () => void;
  hintsRemaining: number;

  // Back navigation
  onBack?: () => void;
}

export default function GameHUD({
  wind,
  round,
  dealer,
  wallCount,
  isHumanTurn,
  currentPlayerIndex,
  currentPlayerName,
  phase,
  claims,
  onClaim,
  onPass,
  claimTimeoutMs,
  hasSelectedTile,
  onDiscard,
  onCancelSelection,
  canDraw,
  onDraw,
  inputDisabled,
  turnTimeSeconds,
  timerRunning,
  onTimeout,
  onUndo,
  onSettings,
  onForfeit,
  onPause,
  canUndo,
  onHint,
  hintsRemaining,
  onBack,
}: GameHUDProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Click-through prevention: only interactive elements get pointer events */}
      <div className="pointer-events-auto">
        {/* Top bar */}
        <RoundInfoBar
          wind={wind}
          round={round}
          dealer={dealer}
          wallCount={wallCount}
        />

        {/* Turn indicator */}
        <TurnIndicator
          isHumanTurn={isHumanTurn}
          currentPlayerName={currentPlayerName}
          currentPlayerIndex={currentPlayerIndex}
          phase={phase}
        />

        {/* Turn timer */}
        <TurnTimer
          seconds={turnTimeSeconds}
          running={timerRunning}
          onTimeout={onTimeout}
        />

        {/* Quick actions */}
        <QuickActions
          onUndo={onUndo}
          onSettings={onSettings}
          onForfeit={onForfeit}
          onPause={onPause}
          canUndo={canUndo}
        />

        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 z-20 px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            ← 返回
          </button>
        )}

        {/* Claim panel — shown during claim phase for human */}
        {phase === 'claim' && (
          <ClaimPanel
            claims={claims.filter((c) => c.playerId === 0)}
            onClaim={onClaim}
            onPass={onPass}
            timeoutMs={claimTimeoutMs}
          />
        )}

        {/* Hand controls — bottom center when human can act */}
        {isHumanTurn && (
          <HandControls
            hasSelectedTile={hasSelectedTile}
            onDiscard={onDiscard}
            onCancelSelection={onCancelSelection}
            canDraw={canDraw}
            onDraw={onDraw}
            disabled={inputDisabled}
          />
        )}

        {/* Hint button */}
        {isHumanTurn && (
          <HintButton
            onHint={onHint}
            hintsRemaining={hintsRemaining}
            disabled={inputDisabled}
            phase={phase}
          />
        )}
      </div>
    </div>
  );
}
