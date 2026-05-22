import { Tile, Meld, Player } from '../types';
import { tilesMatch } from './melds';

/**
 * Convert suit + rank to tile code (0-33).
 * Codes: wan1-9 = 0-8, tong1-9 = 9-17, tiao1-9 = 18-26, wind0-3 = 27-30, dragon0-2 = 31-33
 */
export function tileCode(suit: string, rank: number): number {
  switch (suit) {
    case 'wan': return rank - 1;
    case 'tong': return 9 + rank - 1;
    case 'tiao': return 18 + rank - 1;
    case 'wind': return 27 + rank;
    case 'dragon': return 31 + rank;
    default: return -1;
  }
}

export function tileToCode(t: Tile): number {
  return tileCode(t.suit, t.rank);
}

export function tileCounts(tiles: Tile[]): number[] {
  const counts = new Array(34).fill(0);
  for (const t of tiles) {
    counts[tileToCode(t)] += 1;
  }
  return counts;
}

/**
 * Recursive: decompose counts into `meldsNeeded` melds (no pair).
 */
function decomposeMelds(counts: number[], meldsNeeded: number): boolean {
  if (meldsNeeded === 0) {
    return counts.every(c => c === 0);
  }

  let idx = -1;
  for (let i = 0; i < 34; i++) {
    if (counts[i] > 0) { idx = i; break; }
  }
  if (idx === -1) return false;

  // Try pong (triplet)
  if (counts[idx] >= 3) {
    counts[idx] -= 3;
    if (decomposeMelds(counts, meldsNeeded - 1)) {
      counts[idx] += 3;
      return true;
    }
    counts[idx] += 3;
  }

  // Try chow (sequence) — only for numbered suits (idx 0-26)
  if (idx < 27) {
    const suitStart = Math.floor(idx / 9) * 9;
    const posInSuit = idx - suitStart;
    if (posInSuit <= 6 && counts[idx + 1] > 0 && counts[idx + 2] > 0) {
      counts[idx]--;
      counts[idx + 1]--;
      counts[idx + 2]--;
      if (decomposeMelds(counts, meldsNeeded - 1)) {
        counts[idx]++;
        counts[idx + 1]++;
        counts[idx + 2]++;
        return true;
      }
      counts[idx]++;
      counts[idx + 1]++;
      counts[idx + 2]++;
    }
  }

  return false;
}

/**
 * Check if hand tiles + existing melds form a standard winning hand (4 melds + 1 pair).
 */
export function isStandardWin(handTiles: Tile[], melds: Meld[]): boolean {
  const meldsNeeded = 4 - melds.length;
  const counts = tileCounts(handTiles);

  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) {
      counts[i] -= 2;
      if (decomposeMelds([...counts], meldsNeeded)) {
        counts[i] += 2;
        return true;
      }
      counts[i] += 2;
    }
  }
  return false;
}

/**
 * Check for Seven Pairs (七對子): exactly 7 pairs, no melds.
 */
export function isSevenPairs(handTiles: Tile[], melds: Meld[]): boolean {
  if (melds.length !== 0) return false;
  if (handTiles.length !== 14) return false;

  const counts = tileCounts(handTiles);
  let pairs = 0;
  for (let i = 0; i < 34; i++) {
    if (counts[i] % 2 !== 0) return false;
    pairs += counts[i] / 2;
  }
  return pairs === 7;
}

/**
 * Check for Thirteen Orphans (十三么): one of each terminal + honor + one duplicate.
 */
const ORPHAN_CODES = [
  0, 8, 9, 17, 18, 26,        // wan 1,9; tong 1,9; tiao 1,9
  27, 28, 29, 30,              // winds E S W N
  31, 32, 33,                  // dragons 中發白
];

export function isThirteenOrphans(handTiles: Tile[], melds: Meld[]): boolean {
  if (melds.length !== 0) return false;
  if (handTiles.length !== 14) return false;

  const counts = tileCounts(handTiles);

  for (const code of ORPHAN_CODES) {
    if (counts[code] < 1) return false;
  }

  for (let i = 0; i < 34; i++) {
    if (!ORPHAN_CODES.includes(i) && counts[i] > 0) return false;
  }

  return true;
}

export type WinType = 'standard' | 'seven_pairs' | 'thirteen_orphans';

/**
 * Check if a player has a winning hand.
 */
export function checkWin(player: Player): WinType | null {
  const hand = player.hand;
  const melds = player.melds;

  if (isThirteenOrphans(hand, melds)) return 'thirteen_orphans';
  if (isSevenPairs(hand, melds)) return 'seven_pairs';
  if (isStandardWin(hand, melds)) return 'standard';
  return null;
}

/**
 * Check if a player can win by claiming a discard tile.
 */
export function canWinWithTile(player: Player, tile: Tile): WinType | null {
  player.hand.push(tile);
  const result = checkWin(player);
  player.hand.pop();
  return result;
}
