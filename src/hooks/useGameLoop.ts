import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * useGameLoop — orchestrates the human/AI turn flow.
 *
 * Auto-runs AI turns when it's not the human player's turn.
 * Uses the gameSpeed setting for AI delay.
 */
export function useGameLoop() {
  const game = useGameStore(s => s.game);
  const phase = useGameStore(s => s.phase);
  const currentTurn = useGameStore(s => s.currentTurn);
  const aiDelay = useGameStore(s => s.aiDelay);
  const runAITurn = useGameStore(s => s.runAITurn);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunningRef = useRef(false);

  const scheduleAiTurn = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    timerRef.current = setTimeout(() => {
      isRunningRef.current = false;
      runAITurn();
    }, aiDelay);
  }, [aiDelay, runAITurn]);

  useEffect(() => {
    if (!game || phase === 'end') return;

    if (currentTurn !== 0 && phase !== 'claim') {
      // AI turn — schedule after delay
      scheduleAiTurn();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      isRunningRef.current = false;
    };
  }, [game, phase, currentTurn, scheduleAiTurn]);

  return {
    isHumanTurn: currentTurn === 0 && phase !== 'claim' && phase !== 'end',
    isClaimPhase: phase === 'claim',
    isGameOver: phase === 'end',
  };
}
