import { Tile, Meld } from '../types';
import { calculateShanten } from '../ai/shanten';
import { tileToCode, tileCounts } from './winning';

/**
 * Smart Discard Suggestion Engine.
 *
 * Ranks every tile in hand from best-to-discard to worst,
 * considering shanten, safety, pattern value, isolation, and tile counting.
 */

export interface DiscardSuggestion {
  tile: Tile;
  tileKey: string;
  score: number;         // 0-100 overall recommendation score
  shantenDelta: number;  // how this affects shanten count (-1, 0, +1)
  dangerLevel: number;   // 0-1, how dangerous this discard is
  reasoning: {
    key: string;         // i18n key for explanation
    params?: Record<string, unknown>;
  };
  isIsolated: boolean;
  hasPatternValue: boolean;
}

// ---- internal helpers ----

const SUIT_OFFSET: Record<string, number> = { wan: 0, tong: 9, tiao: 18, wind: 27, dragon: 31 };

function tileKey(tile: Tile): string {
  return `${tile.suit}-${tile.rank}`;
}

function isNumbered(suit: string): boolean {
  return suit === 'wan' || suit === 'tong' || suit === 'tiao';
}

/**
 * Convert a tile code (0-33) back to a Tile with a temporary id.
 */
function makeTile(code: number): Tile {
  if (code < 9) return { suit: 'wan', rank: code + 1, id: 999 };
  if (code < 18) return { suit: 'tong', rank: code - 9 + 1, id: 999 };
  if (code < 27) return { suit: 'tiao', rank: code - 18 + 1, id: 999 };
  if (code < 31) return { suit: 'wind', rank: code - 27, id: 999 };
  return { suit: 'dragon', rank: code - 31, id: 999 };
}

/**
 * Check if a tile is isolated (no pair, no adjacent in numbered suits).
 */
function checkIsolated(tile: Tile, hand: Tile[]): boolean {
  for (const t of hand) {
    if (t.id === tile.id) continue;
    if (t.suit === tile.suit && t.rank === tile.rank) return false;
    if (isNumbered(tile.suit) && t.suit === tile.suit && Math.abs(t.rank - tile.rank) <= 1) return false;
  }
  return true;
}

/**
 * Check if tile contributes to a potential scoring pattern
 * (pair, partial sequence, triplet, or special form progress).
 */
function checkPatternValue(tile: Tile, hand: Tile[]): boolean {
  let sameCount = 0;
  let adjacent = 0;
  for (const t of hand) {
    if (t.id === tile.id) continue;
    if (t.suit === tile.suit && t.rank === tile.rank) sameCount++;
    if (isNumbered(tile.suit) && t.suit === tile.suit && Math.abs(t.rank - tile.rank) <= 2 && t.rank !== tile.rank) adjacent++;
  }
  return sameCount >= 1 || adjacent >= 1;
}

/**
 * Count remaining copies of a tile code, given visible tiles.
 */
function remainingCopies(code: number, handCounts: number[], visibleCounts: number[]): number {
  return Math.max(0, 4 - handCounts[code] - visibleCounts[code]);
}

/**
 * Build visible tile count array from discardPool + claimedMelds.
 */
function buildVisibleCounts(discardPool: Tile[], claimedMelds: Record<string, unknown>[]): number[] {
  const counts = new Array(34).fill(0);
  for (const t of discardPool) {
    const code = tileToCode(t);
    if (code >= 0) counts[code]++;
  }
  for (const meld of claimedMelds) {
    if (Array.isArray(meld.tiles)) {
      for (const t of meld.tiles as Tile[]) {
        const code = tileToCode(t);
        if (code >= 0) counts[code]++;
      }
    }
  }
  return counts;
}

/**
 * Count accepting tiles (tiles that would reduce shanten) after discarding.
 */
function countAccepting(remaining: Tile[], melds: Meld[], handCounts: number[], visibleCounts: number[]): number {
  const currentShanten = calculateShanten(remaining, melds);
  let total = 0;
  for (let code = 0; code < 34; code++) {
    const avail = Math.max(0, 4 - handCounts[code] - visibleCounts[code]);
    if (avail <= 0) continue;
    const testHand = [...remaining, makeTile(code)];
    if (calculateShanten(testHand, melds) < currentShanten) {
      total += avail;
    }
  }
  return total;
}

// ---- main export ----

export function analyzeDiscards(
  hand: Tile[],
  discardPool: Tile[],
  claimedMelds: Record<string, unknown>[],
  dangerTiles: Tile[],
  options?: { showAll?: boolean; maxSuggestions?: number },
): DiscardSuggestion[] {
  if (hand.length === 0) return [];

  const maxSuggestions = options?.maxSuggestions ?? (options?.showAll ? hand.length : 3);

  const melds: Meld[] = []; // player's own melds not passed here; claimedMelds is table-wide
  const visibleCounts = buildVisibleCounts(discardPool, claimedMelds);
  const handCounts = tileCounts(hand);
  const dangerSet = new Set(dangerTiles.map(dk));

  const baseShanten = calculateShanten(hand, melds);

  // Deduplicate by tile key
  const seen = new Set<string>();
  const candidates: {
    key: string;
    idx: number;
    shantenAfter: number;
    shantenDelta: number;
    waitCount: number;
    danger: number;
    isolated: boolean;
    patternValue: boolean;
    tile: Tile;
  }[] = [];

  for (let i = 0; i < hand.length; i++) {
    const key = tileKey(hand[i]);
    if (seen.has(key)) continue;
    seen.add(key);

    const remaining = [...hand.slice(0, i), ...hand.slice(i + 1)];
    const shantenAfter = calculateShanten(remaining, melds);
    const shantenDelta = shantenAfter - baseShanten;
    const waitCount = countAccepting(remaining, melds, handCounts, visibleCounts);
    const danger = dangerSet.has(key) ? 0.8 : estimateDanger(hand[i], visibleCounts);
    const isolated = checkIsolated(hand[i], hand);
    const patternValue = checkPatternValue(hand[i], hand);

    candidates.push({ key, idx: i, shantenAfter, shantenDelta, waitCount, danger, isolated, patternValue, tile: hand[i] });
  }

  // Scoring (higher = better to discard)
  const minShanten = Math.min(...candidates.map(c => c.shantenAfter));
  const maxWait = Math.max(...candidates.map(c => c.waitCount), 1);

  const suggestions: DiscardSuggestion[] = candidates.map(c => {
    let score = 50; // base

    // 1. Shanten improvement (primary) — reward tiles whose removal keeps/improves shanten
    score += (minShanten - c.shantenAfter === 0 ? 25 : 0);
    score -= c.shantenDelta * 20; // penalise increasing shanten

    // 2. Safety — prefer safe discards
    score -= c.danger * 20;

    // 3. Pattern preservation — penalise discarding pattern-contributing tiles
    if (c.patternValue) score -= 10;

    // 4. Isolation — reward discarding isolated tiles
    if (c.isolated) score += 15;

    // 5. Tile counting — wider waits after discard = better
    score += (c.waitCount / maxWait) * 10;

    score = Math.max(0, Math.min(100, Math.round(score)));

    // Reasoning
    let reasonKey: string;
    let reasonParams: Record<string, unknown> | undefined;
    if (c.shantenDelta < 0) {
      reasonKey = 'discardHint.improvesShanten';
      reasonParams = { delta: c.shantenDelta };
    } else if (c.isolated) {
      reasonKey = 'discardHint.isolatedTile';
    } else if (c.danger >= 0.6) {
      reasonKey = 'discardHint.dangerous';
      reasonParams = { danger: Math.round(c.danger * 100) };
    } else if (!c.patternValue) {
      reasonKey = 'discardHint.noPatternValue';
    } else {
      reasonKey = 'discardHint.general';
      reasonParams = { score };
    }

    return {
      tile: c.tile,
      tileKey: c.key,
      score,
      shantenDelta: c.shantenDelta,
      dangerLevel: c.danger,
      reasoning: { key: reasonKey, params: reasonParams },
      isIsolated: c.isolated,
      hasPatternValue: c.patternValue,
    };
  });

  // Sort best (highest score) first
  suggestions.sort((a, b) => b.score - a.score);

  return suggestions.slice(0, maxSuggestions);
}

function dk(t: Tile): string {
  return `${t.suit}-${t.rank}`;
}

/**
 * Estimate danger of a tile based on visibility (simple heuristic).
 */
function estimateDanger(tile: Tile, visibleCounts: number[]): number {
  const code = tileToCode(tile);
  if (code < 0) return 0.5;
  const visible = visibleCounts[code];
  if (visible >= 3) return 0.05;
  if (visible >= 2) return 0.15;
  if (visible >= 1) return 0.3;

  // Middle numbered tiles are more dangerous
  if (isNumbered(tile.suit)) {
    if (tile.rank >= 4 && tile.rank <= 6) return 0.6;
    if (tile.rank >= 2 && tile.rank <= 8) return 0.5;
  }
  return 0.4;
}
