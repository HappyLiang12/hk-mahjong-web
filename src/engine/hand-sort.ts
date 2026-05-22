import { Tile, Meld } from '../types';

// Standard HK mahjong sort order:
// 1. Wan (萬) 1-9
// 2. Tong (筒) 1-9
// 3. Tiao (條) 1-9
// 4. Winds: East(0), South(1), West(2), North(3)
// 5. Dragons: Red/中(0), Green/發(1), White/白(2)
// 6. Flowers (if present): 梅蘭菊竹春夏秋冬

const SUIT_ORDER: Record<string, number> = {
  wan: 0,
  tong: 1,
  tiao: 2,
  wind: 3,
  dragon: 4,
  flower: 5,
};

function tileSort(a: Tile, b: Tile): number {
  const sa = SUIT_ORDER[a.suit] ?? 99;
  const sb = SUIT_ORDER[b.suit] ?? 99;
  if (sa !== sb) return sa - sb;
  return a.rank - b.rank;
}

/**
 * Sort tiles by standard HK mahjong order: wan → tong → tiao → wind → dragon → flower,
 * then by rank within each suit.
 */
export function sortHand(tiles: Tile[]): Tile[] {
  return [...tiles].sort(tileSort);
}

/**
 * Group tiles by suit for visual separation.
 * Returns groups in display order; honors (wind+dragon) are merged into one group.
 */
export function groupBySuit(tiles: Tile[]): Map<string, Tile[]> {
  const sorted = sortHand(tiles);
  const groups = new Map<string, Tile[]>();
  for (const t of sorted) {
    const key = t.suit;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return groups;
}

/**
 * Suggest tiles to discard — returns isolated tiles not part of any
 * pair, sequence, or triplet. Used for subtle visual hints only.
 */
export function suggestDiscard(hand: Tile[], melds: Meld[]): Tile[] {
  // Tiles already in melds are excluded from consideration
  const meldTileIds = new Set(melds.flatMap(m => m.tiles.map(t => t.id)));
  const free = hand.filter(t => !meldTileIds.has(t.id));

  const isolated: Tile[] = [];

  for (const tile of free) {
    if (isIsolated(tile, free)) {
      isolated.push(tile);
    }
  }
  return isolated;
}

function isIsolated(tile: Tile, hand: Tile[]): boolean {
  const others = hand.filter(t => t.id !== tile.id);

  // Check for pair / triplet (same suit+rank)
  if (others.some(t => t.suit === tile.suit && t.rank === tile.rank)) return false;

  // For numbered suits, check sequence adjacency
  if (tile.suit === 'wan' || tile.suit === 'tong' || tile.suit === 'tiao') {
    if (others.some(t => t.suit === tile.suit && Math.abs(t.rank - tile.rank) === 1)) return false;
  }

  return true;
}

/**
 * Detect potential melds in hand for visual grouping hints.
 * Finds pairs, partial sequences (2 consecutive same suit), and partial triplets (2 same).
 */
export function detectPotentialMelds(hand: Tile[]): { tiles: Tile[]; type: string }[] {
  const results: { tiles: Tile[]; type: string }[] = [];
  const used = new Set<number>(); // tile ids already claimed

  // 1. Triplets / pairs (same suit+rank)
  const byKey = new Map<string, Tile[]>();
  for (const t of hand) {
    const k = `${t.suit}-${t.rank}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(t);
  }

  for (const [, group] of byKey) {
    if (group.length >= 3) {
      const triple = group.slice(0, 3);
      results.push({ tiles: triple, type: 'triplet' });
      triple.forEach(t => used.add(t.id));
    } else if (group.length === 2) {
      results.push({ tiles: [...group], type: 'pair' });
      group.forEach(t => used.add(t.id));
    }
  }

  // 2. Partial sequences (numbered suits only, 2 consecutive, unused tiles)
  const numbered = hand.filter(t => !used.has(t.id) && (t.suit === 'wan' || t.suit === 'tong' || t.suit === 'tiao'));
  numbered.sort(tileSort);

  const seqUsed = new Set<number>();
  for (let i = 0; i < numbered.length - 1; i++) {
    if (seqUsed.has(numbered[i].id)) continue;
    const a = numbered[i];
    for (let j = i + 1; j < numbered.length; j++) {
      if (seqUsed.has(numbered[j].id)) continue;
      const b = numbered[j];
      if (a.suit === b.suit && b.rank - a.rank === 1) {
        results.push({ tiles: [a, b], type: 'partial_sequence' });
        seqUsed.add(a.id);
        seqUsed.add(b.id);
        break;
      }
    }
  }

  return results;
}
