import { useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';

/**
 * useKeyboard — desktop keyboard shortcuts for the game.
 *
 * Shortcuts:
 *   D        — Draw (auto-handled by game loop)
 *   1-9      — Select tile slot (1-indexed)
 *   Enter    — Confirm discard
 *   P        — Pass on claim
 *   Escape   — Go back / dismiss modal
 *   Space    — Confirm / primary action
 */
export function useKeyboard() {
  const game = useGameStore(s => s.game);
  const selectTile = useGameStore(s => s.selectTile);
  const confirmDiscard = useGameStore(s => s.confirmDiscard);
  const passAction = useGameStore(s => s.passAction);
  const claimAction = useGameStore(s => s.claimAction);
  const claimOptions = useGameStore(s => s.claimOptions);

  const currentScreen = useUIStore(s => s.currentScreen);
  const modal = useUIStore(s => s.modal);
  const navigate = useUIStore(s => s.navigate);
  const dismissModal = useUIStore(s => s.dismissModal);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = e.key;
      const isGameScreen = currentScreen === 'game';

      // Escape — global back/dismiss
      if (key === 'Escape') {
        e.preventDefault();
        if (modal) {
          dismissModal();
        } else if (isGameScreen) {
          navigate('menu');
        }
        return;
      }

      if (!isGameScreen || !game || game.phase === 'end') return;

      // During claim phase
      if (game.phase === 'claim' && game.currentTurn === 0) {
        if (key === 'p' || key === 'P') {
          e.preventDefault();
          passAction();
          return;
        }
        // Claim hotkeys
        if (claimOptions.length > 0) {
          const winOption = claimOptions.find(o => o.type === 'win');
          const pongOption = claimOptions.find(o => o.type === 'pong');
          const kongOption = claimOptions.find(o => o.type === 'kong');
          const chowOption = claimOptions.find(o => o.type === 'chow');

          if (key === 'w' || key === 'W') {
            if (winOption) { e.preventDefault(); claimAction('win'); return; }
          }
          if (key === 'q' || key === 'Q') {
            if (pongOption) { e.preventDefault(); claimAction('pong'); return; }
          }
          if (key === 'k' || key === 'K') {
            if (kongOption) { e.preventDefault(); claimAction('kong'); return; }
          }
          if (key === 'c' || key === 'C') {
            if (chowOption) { e.preventDefault(); claimAction('chow'); return; }
          }
        }
        return;
      }

      // During discard phase (human turn)
      if (game.phase === 'discard' && game.currentTurn === 0) {
        // Number keys 1-9 select tile slots
        if (key >= '1' && key <= '9') {
          e.preventDefault();
          const slot = parseInt(key) - 1;
          const hand = game.players[0]?.hand;
          if (hand && slot < hand.length) {
            selectTile(hand[slot].id);
          }
          return;
        }

        // Enter confirms discard
        if (key === 'Enter') {
          e.preventDefault();
          confirmDiscard();
          return;
        }

        // D key (draw is auto-handled)
      }
    },
    [
      game, currentScreen, modal,
      selectTile, confirmDiscard, passAction, claimAction,
      claimOptions, navigate, dismissModal,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
