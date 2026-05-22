import { Tile, GameState, Player } from '../types';
import { calculateShanten } from './shanten';
import { tileToCode, tileCounts } from '../engine/winning';

import type { AiDifficulty } from '../types';
import { AIPersonality } from './personalities';

/**
 * AI discard strategy for HK Mahjong.
 *
 * Supports three difficulty levels:
 * - Easy: random discard from non-meld tiles (no shanten optimization)
 * - Normal: current shanten-minimizing behavior
 * - Hard: shanten-minimizing + better defensive play
 */

/**
 * Count how many copies of a tile are visible (in all discard pools + exposed melds).
 */
function visibleCopies(tile: Tile, gameState: GameState): number {
  const code = tileToCode(tile);
  let count = 0;
  for (const p of gameState.players) {
    for (const d of p.discards) {
      if (tileToCode(d) === code) count++;
    }
    for (const m of p.melds) {
      if (!m.concealed) {
        for (const t of m.tiles) {
          if (tileToCode(t) === code) count++;
        }
      }
    }
  }
  return count;
}

/**
 * Check if a tile is "isolated" in hand — no identical, adjacent, or gap-adjacent tiles.
 */
function isIsolated(tile: Tile, hand: Tile[]): boolean {
  const code = tileToCode(tile);
  const counts = tileCounts(hand);

  // Has duplicates
  if (counts[code] > 1) return false;

  // For numbered suits, check adjacents
  if (tile.suit === 'wan' || tile.suit === 'tong' || tile.suit === 'tiao') {
    const suitOffset = tile.suit === 'wan' ? 0 : tile.suit === 'tong' ? 9 : 18;
    const posInSuit = code - suitOffset;
    if (posInSuit > 0 && counts[code - 1] > 0) return false;
    if (posInSuit < 8 && counts[code + 1] > 0) return false;
    if (posInSuit > 1 && counts[code - 2] > 0) return false;
    if (posInSuit < 7 && counts[code + 2] > 0) return false;
  }

  return true;
}

/**
 * Is tile a terminal (1 or 9) or honor (wind/dragon)?
 */
function isTerminalOrHonor(tile: Tile): boolean {
  if (tile.suit === 'wind' || tile.suit === 'dragon') return true;
  return tile.rank === 1 || tile.rank === 9;
}

/**
 * Score a candidate discard. Lower score = better to discard.
 *
 * Primary: shanten after discard (lower = worse candidate for discard, higher = better to discard)
 * Wait — we want to minimize shanten, so we want to discard the tile that gives the LOWEST
 * resulting shanten. Among ties, we apply tiebreakers.
 *
 * Returns { shanten, tiebreak } where tiebreak is lower = prefer discarding this tile.
 */
interface DiscardCandidate {
  tile: Tile;
  index: number;
  shanten: number;
  tiebreak: number;
}

/**
 * Choose the best tile to discard from the player's hand.
 *
 * @param gameState - current game state
 * @param playerId - player index
 * @param difficulty - AI difficulty level (default: 'normal')
 * @returns the Tile to discard
 */
export function chooseDiscard(gameState: GameState, playerId: number, difficulty: AiDifficulty = 'normal', personality?: AIPersonality): Tile {
  const player = gameState.players[playerId];
  const hand = player.hand;
  const melds = player.melds;

  if (hand.length === 0) {
    throw new Error('Cannot discard from empty hand');
  }

  // Easy: random discard (no optimization)
  if (difficulty === 'easy') {
    const idx = Math.floor(Math.random() * hand.length);
    return hand[idx];
  }

  // Deduplicate candidates by tile code to avoid redundant shanten calcs
  const seen = new Map<number, DiscardCandidate>();

  for (let i = 0; i < hand.length; i++) {
    const tile = hand[i];
    const code = tileToCode(tile);

    if (seen.has(code)) continue;

    // Remove tile from hand, compute shanten
    const remaining = [...hand.slice(0, i), ...hand.slice(i + 1)];
    const shanten = calculateShanten(remaining, melds);

    // Tiebreak: lower = prefer to discard
    let tiebreak = 0;
    if (isIsolated(tile, hand)) tiebreak -= 3;
    if (isTerminalOrHonor(tile)) tiebreak -= 2;
    // Fewer remaining copies in the game = less useful = prefer to discard
    const visible = visibleCopies(tile, gameState);
    tiebreak -= visible; // more visible = fewer left = prefer discard

    // Personality: risk tolerance affects preference for keeping options open
    // High risk tolerance = less penalty for discarding useful tiles (aim for big hands)
    if (personality) {
      // High patience = prefer discarding isolated tiles more (keep more options open)
      if (isIsolated(tile, hand) && personality.style.patience > 0.5) {
        tiebreak -= Math.round((personality.style.patience - 0.5) * 4);
      }
      // High risk tolerance = less eager to discard terminals/honors (they form big hands)
      if (isTerminalOrHonor(tile) && personality.style.riskTolerance > 0.5) {
        tiebreak += Math.round((personality.style.riskTolerance - 0.5) * 3);
      }
    }

    seen.set(code, { tile, index: i, shanten, tiebreak });
  }

  const candidates = Array.from(seen.values());

  // Sort: lowest shanten first, then lowest tiebreak
  candidates.sort((a, b) => {
    if (a.shanten !== b.shanten) return a.shanten - b.shanten;
    return a.tiebreak - b.tiebreak;
  });

  return candidates[0].tile;
}
