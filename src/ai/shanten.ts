import { Tile, Meld, Player } from '../types';
import { tileCounts, tileToCode } from '../engine/winning';

/**
 * Shanten calculator for HK Mahjong.
 *
 * Shanten = minimum number of tile swaps needed to reach tenpai.
 * -1 = winning hand, 0 = tenpai, 1 = iishanten, etc.
 *
 * Evaluates three forms:
 * - Standard: 4 melds + 1 pair
 * - Seven Pairs
 * - Thirteen Orphans
 *
 * Returns the minimum shanten across all forms.
 */

/**
 * Standard form shanten.
 * Uses recursive decomposition counting mentsu (complete melds),
 * partial melds (pairs/two-sided waits), and the pair.
 */
function standardShanten(counts: number[], melds: number): number {
  const meldsNeeded = 4 - melds;
  // Best case tracking
  let best = 8; // worst case: 8 shanten (13 tiles, no useful groups)

  function solve(
    c: number[],
    pos: number,
    mentsu: number,    // complete melds found
    partial: number,   // partial melds (pairs/sequences of 2)
    hasPair: boolean,
  ): void {
    // Current shanten estimate
    const sh = (meldsNeeded - mentsu) * 2 - partial - (hasPair ? 1 : 0);
    if (sh < best) best = sh;

    // Pruning: remaining potential can't beat current best
    if (mentsu + partial >= meldsNeeded + 1) return; // over-counting

    // Scan from pos onward
    for (let i = pos; i < 34; i++) {
      if (c[i] === 0) continue;

      // Try triplet (pong)
      if (c[i] >= 3) {
        c[i] -= 3;
        solve(c, i, mentsu + 1, partial, hasPair);
        c[i] += 3;
      }

      // Try sequence (chow) — numbered suits only
      if (i < 27 && i % 9 <= 6 && c[i + 1] > 0 && c[i + 2] > 0) {
        c[i]--; c[i + 1]--; c[i + 2]--;
        solve(c, i, mentsu + 1, partial, hasPair);
        c[i]++; c[i + 1]++; c[i + 2]++;
      }

      // Partials only if we have room
      if (mentsu + partial < meldsNeeded) {
        // Pair partial
        if (c[i] >= 2) {
          c[i] -= 2;
          // As pair for hand
          if (!hasPair) {
            solve(c, i, mentsu, partial, true);
          }
          // As partial meld (future pong)
          solve(c, i, mentsu, partial + 1, hasPair);
          c[i] += 2;
        }

        // Sequence partials — numbered only
        if (i < 27 && i % 9 <= 7) {
          // Adjacent
          if (c[i + 1] > 0) {
            c[i]--; c[i + 1]--;
            solve(c, i, mentsu, partial + 1, hasPair);
            c[i]++; c[i + 1]++;
          }
          // Gap
          if (i % 9 <= 6 && c[i + 2] > 0) {
            c[i]--; c[i + 2]--;
            solve(c, i, mentsu, partial + 1, hasPair);
            c[i]++; c[i + 2]++;
          }
        }
      }

      // Try pair as the hand's pair (not partial)
      if (!hasPair && c[i] >= 2) {
        c[i] -= 2;
        solve(c, i + 1, mentsu, partial, true);
        c[i] += 2;
      }

      break; // Only process the first non-zero tile, then recurse
    }
  }

  const c = [...counts];
  solve(c, 0, 0, 0, false);
  return best;
}

/**
 * Seven Pairs shanten.
 * Need 7 pairs from 14 tiles (no melds).
 */
function sevenPairsShanten(counts: number[]): number {
  let pairs = 0;
  let types = 0;
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 1) types++;
    if (counts[i] >= 2) pairs++;
  }
  // Need 7 pairs from 7 different types
  // shanten = 6 - pairs; but if types < 7, need more unique tiles
  const sh = 6 - pairs;
  // If we have fewer than 7 tile types, we need extra swaps
  return Math.max(sh, 13 - 2 * types);
}

/**
 * Thirteen Orphans shanten.
 * Need one each of 13 terminal/honor tiles + one duplicate.
 */
const ORPHAN_CODES = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

function thirteenOrphansShanten(counts: number[]): number {
  let found = 0;
  let hasPair = false;
  for (const code of ORPHAN_CODES) {
    if (counts[code] >= 1) found++;
    if (counts[code] >= 2) hasPair = true;
  }
  return 13 - found - (hasPair ? 1 : 0);
}

/**
 * Calculate shanten number for a player's hand.
 *
 * @param handTiles - concealed tiles in hand
 * @param melds - declared melds
 * @returns shanten number (-1 = complete, 0 = tenpai, >0 = tiles needed)
 */
export function calculateShanten(handTiles: Tile[], melds: Meld[]): number {
  const counts = tileCounts(handTiles);
  const existingMelds = melds.length;

  let best = standardShanten(counts, existingMelds);

  // Seven pairs and thirteen orphans only valid with no melds
  if (existingMelds === 0) {
    best = Math.min(best, sevenPairsShanten(counts));
    best = Math.min(best, thirteenOrphansShanten(counts));
  }

  return best;
}

/**
 * Get shanten for each form separately (for analysis).
 */
export function shantenByForm(handTiles: Tile[], melds: Meld[]): {
  standard: number;
  sevenPairs: number | null;
  thirteenOrphans: number | null;
} {
  const counts = tileCounts(handTiles);
  const existingMelds = melds.length;

  return {
    standard: standardShanten(counts, existingMelds),
    sevenPairs: existingMelds === 0 ? sevenPairsShanten(counts) : null,
    thirteenOrphans: existingMelds === 0 ? thirteenOrphansShanten(counts) : null,
  };
}
