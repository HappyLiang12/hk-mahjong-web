/**
 * In-Game AI Coach & Hand Hint System
 *
 * Surfaces discard-advisor recommendations via a hint button and coach mode.
 * Manages hint cooldowns, usage tracking, and mode restrictions.
 */

import { Tile } from '../types';
import { analyzeDiscards, DiscardSuggestion } from './discard-advisor';

// --- Types ---

export interface HintResult {
  suggestion: DiscardSuggestion;
  reasonText: string;
}

export interface HintUsageRecord {
  gameId: string;
  hintsUsed: number;
}

export interface HintState {
  hintsUsedThisGame: number;
  maxHintsPerGame: number;
  isUnlimited: boolean;
  coachModeEnabled: boolean;
  lastHintResult: HintResult | null;
}

export interface GameContext {
  gameMode: 'standard' | 'quick' | 'tournament' | 'practice';
  rankedTier?: string; // e.g. 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  isPlayerDiscardPhase: boolean;
  currentPlayerIndex: number; // 0 = human
}

// --- Constants ---

export const HINT_COOLDOWN_LIMIT = 3;
export const RANKED_HINT_BLOCKED_TIERS = ['silver', 'gold', 'platinum', 'diamond'];

// --- Reason text mapping (Chinese) ---

const REASON_TEXT_MAP: Record<string, (params?: Record<string, unknown>) => string> = {
  'discardHint.improvesShanten': (p) => `向聽 ${(p?.delta as number) ?? -1}`,
  'discardHint.isolatedTile': () => '孤張一枚',
  'discardHint.dangerous': (p) => `危險度 ${(p?.danger as string) ?? '?'}%`,
  'discardHint.noPatternValue': () => '無組合價值',
  'discardHint.general': (p) => `推薦分 ${(p?.score as string) ?? '?'}`,
};

export function formatReasonText(reasoning: DiscardSuggestion['reasoning']): string {
  const fn = REASON_TEXT_MAP[reasoning.key];
  if (fn) return fn(reasoning.params as Record<string, unknown>);
  return reasoning.key;
}

// --- Core logic ---

/**
 * Determine if the hint button should be visible.
 */
export function isHintButtonVisible(ctx: GameContext): boolean {
  // Only visible during human player's discard phase
  if (!ctx.isPlayerDiscardPhase) return false;
  if (ctx.currentPlayerIndex !== 0) return false;

  // Hidden in ranked mode above Silver tier
  if ((ctx.gameMode === 'standard' || ctx.gameMode === 'tournament') && ctx.rankedTier) {
    if (RANKED_HINT_BLOCKED_TIERS.includes(ctx.rankedTier)) return false;
  }

  return true;
}

/**
 * Check if the player can use a hint (cooldown check).
 */
export function canUseHint(state: HintState): boolean {
  if (state.isUnlimited) return true;
  return state.hintsUsedThisGame < state.maxHintsPerGame;
}

/**
 * Get remaining hint count.
 */
export function remainingHints(state: HintState): number {
  if (state.isUnlimited) return Infinity;
  return Math.max(0, state.maxHintsPerGame - state.hintsUsedThisGame);
}

/**
 * Create initial hint state for a game.
 */
export function createHintState(gameMode: GameContext['gameMode'], coachModeEnabled: boolean): HintState {
  const isUnlimited = gameMode === 'practice';
  return {
    hintsUsedThisGame: 0,
    maxHintsPerGame: HINT_COOLDOWN_LIMIT,
    isUnlimited,
    coachModeEnabled,
    lastHintResult: null,
  };
}

/**
 * Request a hint: runs discard-advisor and returns the top suggestion with reason text.
 * Returns null if hint cannot be used (cooldown exceeded).
 */
export function requestHint(
  state: HintState,
  hand: Tile[],
  discardPool: Tile[],
  claimedMelds: any[],
  dangerTiles: Tile[],
): { result: HintResult; newState: HintState } | null {
  if (!canUseHint(state)) return null;

  const suggestions = analyzeDiscards(hand, discardPool, claimedMelds, dangerTiles, {
    maxSuggestions: 1,
  });

  if (suggestions.length === 0) return null;

  const top = suggestions[0];
  const reasonText = formatReasonText(top.reasoning);
  const result: HintResult = { suggestion: top, reasonText };

  return {
    result,
    newState: {
      ...state,
      hintsUsedThisGame: state.hintsUsedThisGame + 1,
      lastHintResult: result,
    },
  };
}

/**
 * Get coach mode auto-suggestion (no cooldown consumed, used for subtle glow).
 * Returns top suggestion without incrementing usage counter.
 */
export function getCoachSuggestion(
  hand: Tile[],
  discardPool: Tile[],
  claimedMelds: any[],
  dangerTiles: Tile[],
): HintResult | null {
  const suggestions = analyzeDiscards(hand, discardPool, claimedMelds, dangerTiles, {
    maxSuggestions: 1,
  });

  if (suggestions.length === 0) return null;

  const top = suggestions[0];
  return { suggestion: top, reasonText: formatReasonText(top.reasoning) };
}

/**
 * Create a hint usage record for match history persistence.
 */
export function createHintUsageRecord(gameId: string, state: HintState): HintUsageRecord {
  return {
    gameId,
    hintsUsed: state.hintsUsedThisGame,
  };
}
