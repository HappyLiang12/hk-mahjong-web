import { Tile, Meld, Player, GameState, ScoreResult } from '../types';
import { tileCode, tileCounts, checkWin, WinType } from './winning';

/**
 * Check if a tile code is a terminal (1 or 9 of numbered suit).
 */
function isTerminal(code: number): boolean {
  if (code > 26) return false;
  const posInSuit = code % 9;
  return posInSuit === 0 || posInSuit === 8;
}

/**
 * Check if a tile code is an honor (wind or dragon).
 */
function isHonor(code: number): boolean {
  return code >= 27;
}

/**
 * Get all tile codes present in a player's hand + melds.
 */
function allPlayerTileCodes(player: Player): number[] {
  const codes: number[] = [];
  for (const t of player.hand) codes.push(tileCode(t.suit, t.rank));
  for (const m of player.melds) {
    for (const t of m.tiles) codes.push(tileCode(t.suit, t.rank));
  }
  return codes;
}

/**
 * Get all tiles (hand + melds) for a player.
 */
function allPlayerTiles(player: Player): Tile[] {
  const tiles = [...player.hand];
  for (const m of player.melds) tiles.push(...m.tiles);
  return tiles;
}

/**
 * Count tile occurrences across hand + melds.
 */
function fullCounts(player: Player): number[] {
  return tileCounts(allPlayerTiles(player));
}

/**
 * Check if all melds are pongs/kongs (no chows).
 */
function isAllPongs(player: Player, melds: Meld[], handMelds: { type: string }[]): boolean {
  for (const m of melds) {
    if (m.type === 'chow') return false;
  }
  for (const m of handMelds) {
    if (m.type === 'chow') return false;
  }
  return true;
}

/**
 * Decompose hand tiles into melds+pair for scoring analysis.
 * Returns one valid decomposition or null.
 */
type HandDecomp = {
  melds: { type: 'chow' | 'pong'; codes: number[] }[];
  pair: number;
};

function decomposeHand(counts: number[], meldsNeeded: number, pair: number): HandDecomp | null {
  const melds: { type: 'chow' | 'pong'; codes: number[] }[] = [];

  function solve(c: number[], needed: number): boolean {
    if (needed === 0) return c.every(v => v === 0);

    let idx = -1;
    for (let i = 0; i < 34; i++) {
      if (c[i] > 0) { idx = i; break; }
    }
    if (idx === -1) return false;

    // Try pong
    if (c[idx] >= 3) {
      c[idx] -= 3;
      melds.push({ type: 'pong', codes: [idx, idx, idx] });
      if (solve(c, needed - 1)) return true;
      melds.pop();
      c[idx] += 3;
    }

    // Try chow
    if (idx < 27) {
      const posInSuit = idx % 9;
      if (posInSuit <= 6 && c[idx + 1] > 0 && c[idx + 2] > 0) {
        c[idx]--; c[idx + 1]--; c[idx + 2]--;
        melds.push({ type: 'chow', codes: [idx, idx + 1, idx + 2] });
        if (solve(c, needed - 1)) return true;
        melds.pop();
        c[idx]++; c[idx + 1]++; c[idx + 2]++;
      }
    }

    return false;
  }

  const cc = [...counts];
  if (solve(cc, meldsNeeded)) {
    return { melds, pair };
  }
  return null;
}

function getHandDecompositions(handTiles: Tile[], existingMelds: Meld[]): HandDecomp[] {
  const counts = tileCounts(handTiles);
  const meldsNeeded = 4 - existingMelds.length;
  const results: HandDecomp[] = [];

  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) {
      counts[i] -= 2;
      const d = decomposeHand([...counts], meldsNeeded, i);
      if (d) results.push(d);
      counts[i] += 2;
    }
  }
  return results;
}

/**
 * Calculate faan for a winning hand.
 */
export function calculateScore(
  player: Player,
  state: GameState,
  selfDrawn: boolean,
  winType: WinType
): ScoreResult {
  const breakdown: { name: string; faan: number }[] = [];

  // Special hands
  if (winType === 'thirteen_orphans') {
    breakdown.push({ name: '十三么 (Thirteen Orphans)', faan: 13 });
    return { faan: 13, breakdown, payment: faanToPayment(13, selfDrawn) };
  }

  if (winType === 'seven_pairs') {
    breakdown.push({ name: '七對子 (Seven Pairs)', faan: 4 });
    if (selfDrawn) breakdown.push({ name: '自摸 (Self-drawn)', faan: 1 });
    const faan = Math.min(13, breakdown.reduce((s, b) => s + b.faan, 0));
    return { faan, breakdown, payment: faanToPayment(faan, selfDrawn) };
  }

  // Standard hand — get best decomposition
  const decomps = getHandDecompositions(player.hand, player.melds);
  if (decomps.length === 0) {
    // Shouldn't happen if winType is standard, but fallback
    return { faan: 0, breakdown: [], payment: 0 };
  }

  // Evaluate each decomposition, pick highest scoring
  let bestFaan = 0;
  let bestBreakdown: { name: string; faan: number }[] = [];

  for (const decomp of decomps) {
    const bd: { name: string; faan: number }[] = [];

    // Combine declared melds info with hand decomposition
    const allMeldTypes = [
      ...player.melds.map(m => m.type),
      ...decomp.melds.map(m => m.type),
    ];
    const allMeldCodes = [
      ...player.melds.map(m => m.tiles.map(t => tileCode(t.suit, t.rank))),
      ...decomp.melds.map(m => m.codes),
    ];

    // Self-drawn
    if (selfDrawn) bd.push({ name: '自摸 (Self-drawn)', faan: 1 });

    // All Pongs (對對糊) — all 4 melds are pongs/kongs
    const hasChow = allMeldTypes.some(t => t === 'chow');
    if (!hasChow) bd.push({ name: '對對糊 (All Pongs)', faan: 6 });

    // Check suits for flush
    const allTiles = allPlayerTiles(player);
    const suits = new Set(allTiles.map(t => t.suit));
    const hasNumberedSuit = ['wan', 'tong', 'tiao'].filter(s => suits.has(s as any));
    const hasHonors = suits.has('wind') || suits.has('dragon');

    if (hasNumberedSuit.length === 1 && !hasHonors) {
      bd.push({ name: '清一色 (Full Flush)', faan: 10 });
    } else if (hasNumberedSuit.length === 1 && hasHonors) {
      bd.push({ name: '混一色 (Half Flush)', faan: 6 });
    }

    // All Honors (字一色)
    if (hasNumberedSuit.length === 0 && hasHonors) {
      bd.push({ name: '字一色 (All Honors)', faan: 10 });
    }

    // Seat wind pong
    const seatWind = player.seatWind;
    const seatWindCode = 27 + seatWind;
    for (let i = 0; i < allMeldCodes.length; i++) {
      if (allMeldTypes[i] !== 'chow' && allMeldCodes[i].includes(seatWindCode)) {
        bd.push({ name: '門風 (Seat Wind)', faan: 1 });
        break;
      }
    }

    // Prevailing wind pong
    const prevWindCode = 27 + state.prevailingWind;
    if (prevWindCode !== seatWindCode) {
      for (let i = 0; i < allMeldCodes.length; i++) {
        if (allMeldTypes[i] !== 'chow' && allMeldCodes[i].includes(prevWindCode)) {
          bd.push({ name: '圈風 (Prevailing Wind)', faan: 1 });
          break;
        }
      }
    } else {
      // If seat wind === prevailing wind, already counted seat wind, check if we should count prevailing too
      // In HK rules, if your seat wind IS the prevailing wind, you get both +1s from the same pong
      for (let i = 0; i < allMeldCodes.length; i++) {
        if (allMeldTypes[i] !== 'chow' && allMeldCodes[i].includes(prevWindCode)) {
          bd.push({ name: '圈風 (Prevailing Wind)', faan: 1 });
          break;
        }
      }
    }

    // Dragon pongs (箭刻)
    for (let d = 0; d < 3; d++) {
      const dragonCode = 31 + d;
      const dragonNames = ['中', '發', '白'];
      for (let i = 0; i < allMeldCodes.length; i++) {
        if (allMeldTypes[i] !== 'chow' && allMeldCodes[i].includes(dragonCode) && allMeldCodes[i].length >= 3) {
          bd.push({ name: `箭刻 (${dragonNames[d]} Dragon)`, faan: 1 });
          break;
        }
      }
    }

    const totalFaan = Math.min(13, bd.reduce((s, b) => s + b.faan, 0));
    if (totalFaan > bestFaan) {
      bestFaan = totalFaan;
      bestBreakdown = bd;
    }
  }

  // Enforce 3-faan minimum — if less, it's "chicken hand" (雞糊) worth 3
  if (bestFaan < 3) {
    bestFaan = 3;
    bestBreakdown = [{ name: '雞糊 (Minimum Hand)', faan: 3 }];
  }

  // Add flower bonus (on top of hand faan, after minimum check)
  const flowerBonus = calculateFlowerBonus(player);
  if (flowerBonus.length > 0) {
    bestBreakdown.push(...flowerBonus);
    bestFaan += flowerBonus.reduce((s, b) => s + b.faan, 0);
    bestFaan = Math.min(13, bestFaan);
  }

  return {
    faan: bestFaan,
    breakdown: bestBreakdown,
    payment: faanToPayment(bestFaan, selfDrawn),
  };
}

/**
 * Convert faan to payment amount (HK standard table).
 * Base: 2^(faan-1) capped at faan=10+ being max.
 * Simplified table:
 * 3 faan = 8, 4 = 16, 5 = 32, 6 = 64, 7 = 128, 8-9 = 256, 10-12 = 512, 13 = 1024
 */
function faanToPayment(faan: number, selfDrawn: boolean): number {
  let base: number;
  if (faan <= 0) return 0;
  if (faan <= 7) base = Math.pow(2, faan);
  else if (faan <= 9) base = 256;
  else if (faan <= 12) base = 512;
  else base = 1024;

  // Self-drawn: all 3 pay base. Discard: discarder pays base * 3 (simplified)
  return selfDrawn ? base * 3 : base * 3;
}

/**
 * Calculate flower tile bonus faan.
 * - Each flower = 1 faan
 * - Matching flower (seat East=0 → 梅 rank1 or 春 rank5, South=1 → 蘭/夏, etc.) = +1 extra
 * - All 4 flowers (梅蘭菊竹, ranks 1-4) = 2 bonus faan
 * - All 4 seasons (春夏秋冬, ranks 5-8) = 2 bonus faan
 * - All 8 = 8 bonus faan (花胡)
 */
export function calculateFlowerBonus(player: Player): { name: string; faan: number }[] {
  const flowers = player.flowers || [];
  if (flowers.length === 0) return [];

  const bonus: { name: string; faan: number }[] = [];
  const flowerNames = ['', '梅', '蘭', '菊', '竹', '春', '夏', '秋', '冬'];
  const ranks = new Set(flowers.map(f => f.rank));

  // Check all 8 first
  if (ranks.size === 8 && [1,2,3,4,5,6,7,8].every(r => ranks.has(r))) {
    bonus.push({ name: '花胡 (All 8 Flowers)', faan: 8 });
    return bonus;
  }

  // Each flower = 1 faan
  bonus.push({ name: `花牌 (${flowers.length} Flowers)`, faan: flowers.length });

  // Matching flower bonus: seat 0(E)→rank 1&5, seat 1(S)→rank 2&6, seat 2(W)→rank 3&7, seat 3(N)→rank 4&8
  const matchingFlowerRank = player.seatWind + 1; // 1-4
  const matchingSeasonRank = player.seatWind + 5; // 5-8
  let matchCount = 0;
  if (ranks.has(matchingFlowerRank)) matchCount++;
  if (ranks.has(matchingSeasonRank)) matchCount++;
  if (matchCount > 0) {
    bonus.push({ name: '正花 (Matching Flower)', faan: matchCount });
  }

  // All 4 flowers (梅蘭菊竹)
  if ([1,2,3,4].every(r => ranks.has(r))) {
    bonus.push({ name: '花槓 (All 4 Flowers 梅蘭菊竹)', faan: 2 });
  }

  // All 4 seasons (春夏秋冬)
  if ([5,6,7,8].every(r => ranks.has(r))) {
    bonus.push({ name: '季槓 (All 4 Seasons 春夏秋冬)', faan: 2 });
  }

  return bonus;
}
