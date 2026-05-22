import {
  createHintState,
  canUseHint,
  remainingHints,
  isHintButtonVisible,
  createHintUsageRecord,
  requestHint,
  getCoachSuggestion,
  formatReasonText,
  HintState,
  GameContext,
  HINT_COOLDOWN_LIMIT,
} from './hint-system';
import { DiscardSuggestion } from './discard-advisor';
import { Tile } from '../types';

describe('Hint System', () => {
  describe('createHintState', () => {
    test('creates initial state for standard mode', () => {
      const state = createHintState('standard', false);
      expect(state.hintsUsedThisGame).toBe(0);
      expect(state.maxHintsPerGame).toBe(HINT_COOLDOWN_LIMIT);
      expect(state.isUnlimited).toBe(false);
      expect(state.coachModeEnabled).toBe(false);
      expect(state.lastHintResult).toBeNull();
    });

    test('practice mode has unlimited hints', () => {
      const state = createHintState('practice', false);
      expect(state.isUnlimited).toBe(true);
    });

    test('coach mode is enabled when passed', () => {
      const state = createHintState('standard', true);
      expect(state.coachModeEnabled).toBe(true);
    });
  });

  describe('canUseHint', () => {
    test('returns true when hints available', () => {
      const state: HintState = {
        hintsUsedThisGame: 0,
        maxHintsPerGame: 3,
        isUnlimited: false,
        coachModeEnabled: false,
        lastHintResult: null,
      };
      expect(canUseHint(state)).toBe(true);
    });

    test('returns false when all hints used', () => {
      const state: HintState = {
        hintsUsedThisGame: 3,
        maxHintsPerGame: 3,
        isUnlimited: false,
        coachModeEnabled: false,
        lastHintResult: null,
      };
      expect(canUseHint(state)).toBe(false);
    });

    test('returns true when unlimited', () => {
      const state: HintState = {
        hintsUsedThisGame: 99,
        maxHintsPerGame: 3,
        isUnlimited: true,
        coachModeEnabled: false,
        lastHintResult: null,
      };
      expect(canUseHint(state)).toBe(true);
    });
  });

  describe('remainingHints', () => {
    test('returns remaining count', () => {
      const state: HintState = {
        hintsUsedThisGame: 1,
        maxHintsPerGame: 3,
        isUnlimited: false,
        coachModeEnabled: false,
        lastHintResult: null,
      };
      expect(remainingHints(state)).toBe(2);
    });

    test('returns Infinity for unlimited', () => {
      const state = createHintState('practice', false);
      expect(remainingHints(state)).toBe(Infinity);
    });
  });

  describe('isHintButtonVisible', () => {
    test('visible during player discard phase', () => {
      const ctx: GameContext = {
        gameMode: 'standard',
        isPlayerDiscardPhase: true,
        currentPlayerIndex: 0,
      };
      expect(isHintButtonVisible(ctx)).toBe(true);
    });

    test('hidden when not player turn', () => {
      const ctx: GameContext = {
        gameMode: 'standard',
        isPlayerDiscardPhase: true,
        currentPlayerIndex: 1,
      };
      expect(isHintButtonVisible(ctx)).toBe(false);
    });

    test('hidden when not discard phase', () => {
      const ctx: GameContext = {
        gameMode: 'standard',
        isPlayerDiscardPhase: false,
        currentPlayerIndex: 0,
      };
      expect(isHintButtonVisible(ctx)).toBe(false);
    });

    test('hidden in high ranked tier', () => {
      const ctx: GameContext = {
        gameMode: 'standard',
        rankedTier: 'platinum',
        isPlayerDiscardPhase: true,
        currentPlayerIndex: 0,
      };
      expect(isHintButtonVisible(ctx)).toBe(false);
    });

    test('visible in bronze tier', () => {
      const ctx: GameContext = {
        gameMode: 'standard',
        rankedTier: 'bronze',
        isPlayerDiscardPhase: true,
        currentPlayerIndex: 0,
      };
      expect(isHintButtonVisible(ctx)).toBe(true);
    });
  });

  describe('requestHint', () => {
    test('returns null when no hints available', () => {
      const state: HintState = {
        hintsUsedThisGame: 3,
        maxHintsPerGame: 3,
        isUnlimited: false,
        coachModeEnabled: false,
        lastHintResult: null,
      };
      const result = requestHint(state, ['wan-1', 'wan-2'] as unknown as Tile[], [], [], []);
      expect(result).toBeNull();
    });

    test('returns null when hand is empty', () => {
      const state: HintState = {
        hintsUsedThisGame: 0,
        maxHintsPerGame: 3,
        isUnlimited: false,
        coachModeEnabled: false,
        lastHintResult: null,
      };
      const result = requestHint(state, [], [], [], []);
      expect(result).toBeNull();
    });

    test('returns hint when available', () => {
      const state: HintState = {
        hintsUsedThisGame: 0,
        maxHintsPerGame: 3,
        isUnlimited: false,
        coachModeEnabled: false,
        lastHintResult: null,
      };
      const hand = ['wan-1', 'wan-2', 'wan-3', 'tong-4', 'tong-5', 'tong-6',
        'tiao-7', 'tiao-8', 'tiao-9', 'wind-0', 'wind-0',
        'dragon-1', 'dragon-1', 'wan-5'];
      const result = requestHint(state, hand as unknown as Tile[], [], [], []);
      expect(result).not.toBeNull();
      expect(result!.result.suggestion).toBeDefined();
      expect(result!.result.reasonText).toBeTruthy();
      expect(result!.newState.hintsUsedThisGame).toBe(1);
    });
  });

  describe('getCoachSuggestion', () => {
    test('returns null for empty hand', () => {
      const result = getCoachSuggestion([], [], [], []);
      expect(result).toBeNull();
    });

    test('returns suggestion without consuming hint', () => {
      const hand = ['wan-1', 'wan-2', 'wan-3', 'tong-4', 'tong-5', 'tong-6',
        'tiao-7', 'tiao-8', 'tiao-9', 'wind-0', 'wind-0',
        'dragon-1', 'dragon-1', 'wan-5'];
      const result = getCoachSuggestion(hand as unknown as Tile[], [], [], []);
      expect(result).not.toBeNull();
      expect(result!.suggestion).toBeDefined();
    });
  });

  describe('createHintUsageRecord', () => {
    test('creates record with correct values', () => {
      const state: HintState = {
        hintsUsedThisGame: 5,
        maxHintsPerGame: 10,
        isUnlimited: false,
        coachModeEnabled: false,
        lastHintResult: null,
      };
      const record = createHintUsageRecord('game-123', state);
      expect(record.gameId).toBe('game-123');
      expect(record.hintsUsed).toBe(5);
    });
  });

  describe('formatReasonText', () => {
    test('formats improveShanten reason', () => {
      const text = formatReasonText({ key: 'discardHint.improvesShanten', params: { delta: -1 } });
      expect(text).toContain('-1');
    });

    test('formats isolatedTile reason', () => {
      const text = formatReasonText({ key: 'discardHint.isolatedTile' });
      expect(text).toBeTruthy();
    });

    test('falls back to key for unknown reason', () => {
      const text = formatReasonText({ key: 'unknown.reason' });
      expect(text).toBe('unknown.reason');
    });
  });
});
