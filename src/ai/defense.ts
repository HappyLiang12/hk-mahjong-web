import { Tile, GameState, Player } from '../types';
import { tileToCode } from '../engine/winning';
import { AIPersonality } from './personalities';

/**
 * Defensive play module for AI opponents.
 *
 * Tracks safe tiles and detects dangerous opponents.
 * When an opponent appears dangerous, AI switches to safe discard mode.
 */

/**
 * Check if a tile is "safe" — already seen 4 copies in discards + exposed melds,
 * or matches tiles already discarded by a dangerous opponent (they won't win with it).
 */
export function isSafeTile(tile: Tile, gameState: GameState): boolean {
  const code = tileToCode(tile);

  // Count all visible copies across discards and exposed melds
  let visible = 0;
  for (const p of gameState.players) {
    for (const d of p.discards) {
      if (tileToCode(d) === code) visible++;
    }
    for (const m of p.melds) {
      if (!m.concealed) {
        for (const t of m.tiles) {
          if (tileToCode(t) === code) visible++;
        }
      }
    }
  }

  // All 4 copies accounted for — completely safe
  if (visible >= 4) return true;

  return false;
}

/**
 * Check if a tile was previously discarded by a specific opponent.
 * If they discarded it before, it's generally safe against them.
 */
export function isDiscardedByOpponent(tile: Tile, opponent: Player): boolean {
  const code = tileToCode(tile);
  return opponent.discards.some(d => tileToCode(d) === code);
}

/**
 * Determine if an opponent looks "dangerous" (close to winning).
 *
 * Heuristics:
 * - Has 3+ exposed melds (only need 1 more meld + pair or already tenpai)
 * - Has few concealed tiles left (≤4 after melds)
 */
export function isDangerousOpponent(opponent: Player, personality?: AIPersonality): boolean {
  const exposedMelds = opponent.melds.filter(m => !m.concealed).length;
  const concealedTiles = opponent.hand.length;

  // Personality: high defensiveness = lower threshold (detects danger earlier)
  const meldThreshold = personality && personality.style.defensiveness > 0.7 ? 2 : 3;

  if (exposedMelds >= meldThreshold) return true;
  if (exposedMelds >= 2 && concealedTiles <= 5) return true;

  return false;
}

/**
 * Check if any opponent is dangerous.
 */
export function anyDangerousOpponent(gameState: GameState, playerId: number): boolean {
  for (let i = 0; i < gameState.players.length; i++) {
    if (i === playerId) continue;
    if (isDangerousOpponent(gameState.players[i])) return true;
  }
  return false;
}

/**
 * Get all dangerous opponent indices.
 */
export function getDangerousOpponents(gameState: GameState, playerId: number): number[] {
  const dangerous: number[] = [];
  for (let i = 0; i < gameState.players.length; i++) {
    if (i === playerId) continue;
    if (isDangerousOpponent(gameState.players[i])) dangerous.push(i);
  }
  return dangerous;
}

/**
 * Score a tile's safety for defensive discard.
 * Higher = safer to discard.
 *
 * Factors:
 * - All 4 copies visible = perfectly safe (100)
 * - Previously discarded by dangerous opponent = safer (50 per opponent)
 * - More visible copies = safer (10 per copy)
 * - Terminal/honor tiles generally more targeted, so slightly less safe by default
 */
export function safetyScore(tile: Tile, gameState: GameState, playerId: number): number {
  const code = tileToCode(tile);
  let score = 0;

  // Count visible copies
  let visible = 0;
  for (const p of gameState.players) {
    for (const d of p.discards) {
      if (tileToCode(d) === code) visible++;
    }
    for (const m of p.melds) {
      if (!m.concealed) {
        for (const t of m.tiles) {
          if (tileToCode(t) === code) visible++;
        }
      }
    }
  }

  if (visible >= 4) return 100; // completely safe

  score += visible * 10;

  // Bonus if dangerous opponents have discarded this tile
  const dangerous = getDangerousOpponents(gameState, playerId);
  for (const oppId of dangerous) {
    if (isDiscardedByOpponent(tile, gameState.players[oppId])) {
      score += 50;
    }
  }

  return score;
}

/**
 * Choose the safest discard from candidates (tiles with equal shanten).
 * Used when defensive mode is active.
 *
 * @param candidates - tiles to choose from (typically all tiles in hand)
 * @param gameState - current game state
 * @param playerId - the AI player's index
 * @returns the safest tile to discard
 */
export function safestDiscard(
  candidates: Tile[],
  gameState: GameState,
  playerId: number,
): Tile {
  if (candidates.length === 0) {
    throw new Error('No candidates for safe discard');
  }

  let best = candidates[0];
  let bestScore = safetyScore(best, gameState, playerId);

  for (let i = 1; i < candidates.length; i++) {
    const s = safetyScore(candidates[i], gameState, playerId);
    if (s > bestScore) {
      bestScore = s;
      best = candidates[i];
    }
  }

  return best;
}
