import { useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * useAI — manages AI turn execution with configurable delay.
 *
 * Provides a way to manually trigger AI turns and track
 * whether AI is currently "thinking".
 */
export function useAI() {
  const aiDelay = useGameStore(s => s.aiDelay);
  const gameSpeed = useGameStore(s => s.gameSpeed);
  const runAITurn = useGameStore(s => s.runAITurn);

  const thinkingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runAITurnWithDelay = useCallback(() => {
    if (thinkingRef.current) return;

    thinkingRef.current = true;
    timerRef.current = setTimeout(() => {
      thinkingRef.current = false;
      runAITurn();
    }, aiDelay);
  }, [aiDelay, runAITurn]);

  const cancelAI = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    thinkingRef.current = false;
  }, []);

  return {
    runAITurn: runAITurnWithDelay,
    cancelAI,
    isAIThinking: thinkingRef.current,
    gameSpeed,
  };
}
