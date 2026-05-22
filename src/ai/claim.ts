import { Tile, GameState, Player, Meld } from '../types';
import { calculateShanten } from './shanten';
import { canPong, canChow, canExposedKong } from '../engine/melds';
import { canWinWithTile } from '../engine/winning';
import { tileToCode } from '../engine/winning';
import type { AiDifficulty } from '../types';
import { AIPersonality } from './personalities';

/**
 * AI claim/meld decision strategy for HK Mahjong.
 *
 * Difficulty levels:
 * - Easy: 30% chance to skip valid pong/chow claims. Always claims win.
 * - Normal: current behavior.
 * - Hard: always claims when beneficial, more aggressive.
 */

/**
 * Simulate pong claim: remove 2 matching tiles from hand, add meld, compute shanten.
 */
function shantenAfterPong(player: Player, tile: Tile): number {
  const hand = player.hand.filter((t, i) => {
    // Remove first 2 matching tiles
    return true; // placeholder
  });

  // Properly: remove 2 tiles matching `tile` from hand
  const newHand = [...player.hand];
  let removed = 0;
  const filtered: Tile[] = [];
  for (const t of newHand) {
    if (removed < 2 && t.suit === tile.suit && t.rank === tile.rank) {
      removed++;
    } else {
      filtered.push(t);
    }
  }

  const newMelds: Meld[] = [
    ...player.melds,
    { type: 'pong', tiles: [tile, tile, tile], concealed: false },
  ];

  return calculateShanten(filtered, newMelds);
}

/**
 * Simulate chow claim: remove the 2 hand tiles that form the sequence with `tile`.
 */
function shantenAfterChow(player: Player, tile: Tile, chowTiles: [Tile, Tile]): number {
  const newHand = [...player.hand];
  for (const ct of chowTiles) {
    const idx = newHand.findIndex(t => t.suit === ct.suit && t.rank === ct.rank);
    if (idx >= 0) newHand.splice(idx, 1);
  }

  const newMelds: Meld[] = [
    ...player.melds,
    { type: 'chow', tiles: [chowTiles[0], tile, chowTiles[1]].sort((a, b) => a.rank - b.rank), concealed: false },
  ];

  return calculateShanten(newHand, newMelds);
}

/**
 * Decide whether AI should claim win on a discard.
 * Always returns true if legal.
 */
export function shouldClaimWin(player: Player, tile: Tile): boolean {
  return canWinWithTile(player, tile) !== null;
}

/**
 * Decide whether AI should claim pong on a discard.
 * Easy: 30% chance to skip. Hard: always claim if shanten doesn't worsen.
 */
export function shouldClaimPong(player: Player, tile: Tile, difficulty: AiDifficulty = 'normal', personality?: AIPersonality): boolean {
  if (!canPong(player, tile)) return false;

  // Easy: 30% chance to skip
  if (difficulty === 'easy' && Math.random() < 0.3) return false;

  // Personality aggressiveness: low aggressiveness = chance to skip
  if (personality) {
    const skipChance = (1 - personality.style.aggressiveness) * 0.4;
    if (Math.random() < skipChance) return false;
  }

  const currentShanten = calculateShanten(player.hand, player.melds);
  const afterShanten = shantenAfterPong(player, tile);

  // Hard: claim even if shanten stays same
  if (difficulty === 'hard') return afterShanten <= currentShanten;

  return afterShanten <= currentShanten;
}

/**
 * Decide whether AI should claim chow on a discard.
 * Claim only if shanten strictly reduces.
 *
 * Returns the best chow tiles pair if should claim, null otherwise.
 */
export function shouldClaimChow(
  player: Player,
  tile: Tile,
  playerId: number,
  discarderId: number,
  difficulty: AiDifficulty = 'normal',
  personality?: AIPersonality,
): { claim: boolean; tiles?: [Tile, Tile] } {
  // Chow only from left player (discarderId is the player to the left)
  if ((discarderId + 1) % 4 !== playerId) {
    return { claim: false };
  }

  if (tile.suit === 'wind' || tile.suit === 'dragon') {
    return { claim: false };
  }

  const currentShanten = calculateShanten(player.hand, player.melds);
  const rank = tile.rank;
  const hand = player.hand;

  // Find all possible chow combinations
  const combos: [number, number][] = [];
  if (rank >= 3) combos.push([rank - 2, rank - 1]);
  if (rank >= 2 && rank <= 8) combos.push([rank - 1, rank + 1]);
  if (rank <= 7) combos.push([rank + 1, rank + 2]);

  let bestShanten = Infinity;
  let bestTiles: [Tile, Tile] | undefined;

  for (const [r1, r2] of combos) {
    const t1 = hand.find(t => t.suit === tile.suit && t.rank === r1);
    const t2 = hand.find(t => t.suit === tile.suit && t.rank === r2 && t !== t1);
    if (t1 && t2) {
      const sh = shantenAfterChow(player, tile, [t1, t2]);
      if (sh < bestShanten) {
        bestShanten = sh;
        bestTiles = [t1, t2];
      }
    }
  }

  if (bestTiles && bestShanten < currentShanten) {
    // Easy: 30% chance to skip
    if (difficulty === 'easy' && Math.random() < 0.3) return { claim: false };
    // Personality aggressiveness: low aggressiveness = chance to skip
    if (personality) {
      const skipChance = (1 - personality.style.aggressiveness) * 0.4;
      if (Math.random() < skipChance) return { claim: false };
    }
    return { claim: true, tiles: bestTiles };
  }

  // Hard: also claim if shanten stays same
  if (difficulty === 'hard' && bestTiles && bestShanten <= currentShanten) {
    return { claim: true, tiles: bestTiles };
  }

  return { claim: false };
}

/**
 * Decide whether AI should claim exposed kong.
 * Claim if shanten doesn't worsen (has 3 matching in hand).
 */
export function shouldClaimKong(player: Player, tile: Tile): boolean {
  // Need 3 in hand
  const matching = player.hand.filter(t => t.suit === tile.suit && t.rank === tile.rank);
  if (matching.length < 3) return false;

  // After kong: remove 3 from hand, add kong meld, but we draw a replacement
  // So shanten check is roughly neutral — claim if not worsening
  const currentShanten = calculateShanten(player.hand, player.melds);

  const newHand = [...player.hand];
  let removed = 0;
  const filtered: Tile[] = [];
  for (const t of newHand) {
    if (removed < 3 && t.suit === tile.suit && t.rank === tile.rank) {
      removed++;
    } else {
      filtered.push(t);
    }
  }

  const newMelds: Meld[] = [
    ...player.melds,
    { type: 'kong', tiles: [tile, tile, tile, tile], concealed: false },
  ];

  const afterShanten = calculateShanten(filtered, newMelds);
  return afterShanten <= currentShanten;
}
