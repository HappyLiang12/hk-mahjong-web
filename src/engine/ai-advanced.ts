/**
 * AI Strategy Engine: Multi-Level Decision Trees
 *
 * Provides strategy profiles, hand evaluation, discard selection,
 * claim decisions, and adaptive strategy blending for HK Mahjong AI.
 */

import { Tile, Meld, Player, GameState } from '../types';
import { calculateShanten } from '../ai/shanten';
import { tileToCode } from './winning';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StrategyNode {
  id: string;
  type: 'decision' | 'action' | 'evaluate';
  condition?: string;
  weight: number;
  children: string[];
}

export interface StrategyProfile {
  id: string;
  name: string;
  aggressiveness: number;    // 0-1
  defensiveness: number;     // 0-1
  riskTolerance: number;     // 0-1
  adaptability: number;      // 0-1
  preferredPatterns: string[];
}

export interface HandAnalysis {
  shanten: number;
  waitingTiles: Tile[];
  suggestedDiscards: Tile[];
}

// ---------------------------------------------------------------------------
// 5 Built-in Strategy Profiles
// ---------------------------------------------------------------------------

export const AI_STRATEGY_PROFILES: StrategyProfile[] = [
  {
    id: 'aggressive',
    name: 'Aggressive Attacker',
    aggressiveness: 0.9,
    defensiveness: 0.2,
    riskTolerance: 0.85,
    adaptability: 0.4,
    preferredPatterns: ['all-triplets', 'mixed-one-suit'],
  },
  {
    id: 'defensive',
    name: 'Cautious Defender',
    aggressiveness: 0.2,
    defensiveness: 0.9,
    riskTolerance: 0.15,
    adaptability: 0.5,
    preferredPatterns: ['all-sequences', 'common-hand'],
  },
  {
    id: 'balanced',
    name: 'Balanced Player',
    aggressiveness: 0.5,
    defensiveness: 0.5,
    riskTolerance: 0.5,
    adaptability: 0.7,
    preferredPatterns: ['all-sequences', 'mixed-one-suit'],
  },
  {
    id: 'opportunist',
    name: 'Opportunist',
    aggressiveness: 0.7,
    defensiveness: 0.3,
    riskTolerance: 0.7,
    adaptability: 0.9,
    preferredPatterns: ['all-triplets', 'all-honors'],
  },
  {
    id: 'calculating',
    name: 'Calculating Strategist',
    aggressiveness: 0.4,
    defensiveness: 0.6,
    riskTolerance: 0.35,
    adaptability: 0.8,
    preferredPatterns: ['pure-one-suit', 'all-sequences'],
  },
];

// ---------------------------------------------------------------------------
// Profile lookup
// ---------------------------------------------------------------------------

export function getProfile(id: string): StrategyProfile | undefined {
  return AI_STRATEGY_PROFILES.find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// Tile helpers (using Tile objects)
// ---------------------------------------------------------------------------

function tileKey(tile: Tile): string {
  return `${tile.suit}-${tile.rank}`;
}

/** Count occurrences of each tile key. */
function countTiles(hand: Tile[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of hand) m.set(tileKey(t), (m.get(tileKey(t)) ?? 0) + 1);
  return m;
}

/** Check if a tile is an honor tile (wind or dragon). */
function isHonor(tile: Tile): boolean {
  return tile.suit === 'wind' || tile.suit === 'dragon';
}

/** Check if a tile is a terminal (rank 1 or 9). */
function isTerminal(tile: Tile): boolean {
  if (isHonor(tile)) return false;
  return tile.rank === 1 || tile.rank === 9;
}

/** Count pairs, triplets, and sequences present in the hand. */
function analyzeGroups(hand: Tile[]): { pairs: number; triplets: number; sequences: number; isolated: number } {
  const counts = countTiles(hand);
  let pairs = 0;
  let triplets = 0;
  let sequences = 0;
  let isolated = 0;

  const used = new Map<string, number>();

  // Count triplets first
  for (const [tileKey, count] of counts) {
    if (count >= 3) {
      triplets++;
      used.set(tileKey, (used.get(tileKey) ?? 0) + 3);
    }
  }

  // Count pairs from remaining
  for (const [tk, count] of counts) {
    const remaining = count - (used.get(tk) ?? 0);
    if (remaining >= 2) {
      pairs++;
      used.set(tk, (used.get(tk) ?? 0) + 2);
    }
  }

  // Simple sequence detection for numbered suits
  const suits = ['wan', 'tong', 'tiao'];
  for (const suit of suits) {
    for (let r = 1; r <= 7; r++) {
      const a = `${suit}-${r}`;
      const b = `${suit}-${r + 1}`;
      const c = `${suit}-${r + 2}`;
      const ra = (counts.get(a) ?? 0) - (used.get(a) ?? 0);
      const rb = (counts.get(b) ?? 0) - (used.get(b) ?? 0);
      const rc = (counts.get(c) ?? 0) - (used.get(c) ?? 0);
      if (ra > 0 && rb > 0 && rc > 0) {
        sequences++;
        used.set(a, (used.get(a) ?? 0) + 1);
        used.set(b, (used.get(b) ?? 0) + 1);
        used.set(c, (used.get(c) ?? 0) + 1);
      }
    }
  }

  // Count isolated tiles
  for (const [tk, count] of counts) {
    const remaining = count - (used.get(tk) ?? 0);
    isolated += remaining;
  }

  return { pairs, triplets, sequences, isolated };
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Evaluate a hand given a strategy profile.
 * Returns a score (0-100), a recommended strategy name, and target tiles.
 */
export function evaluateHand(
  hand: Tile[],
  profile: StrategyProfile,
): { score: number; strategy: string; targets: Tile[] } {
  const groups = analyzeGroups(hand);
  const counts = countTiles(hand);

  // Base score from groups
  let score = groups.triplets * 20 + groups.sequences * 15 + groups.pairs * 8;

  // Strategy alignment bonus
  let strategy = 'mixed';
  const targets: Tile[] = [];

  if (profile.preferredPatterns.includes('all-triplets') && groups.triplets >= 2) {
    score += 15 * profile.aggressiveness;
    strategy = 'all-triplets';
    // Target tiles that have pairs (could become triplets)
    for (const t of hand) {
      const cnt = counts.get(tileKey(t)) ?? 0;
      if (cnt === 2) targets.push(t);
    }
  } else if (profile.preferredPatterns.includes('all-sequences') && groups.sequences >= 2) {
    score += 15 * (1 - profile.aggressiveness);
    strategy = 'all-sequences';
  } else if (profile.preferredPatterns.includes('pure-one-suit')) {
    // Check suit concentration
    const suitCounts: Record<string, number> = {};
    for (const t of hand) {
      if (!isHonor(t)) suitCounts[t.suit] = (suitCounts[t.suit] ?? 0) + 1;
    }
    const maxSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0];
    if (maxSuit && maxSuit[1] >= hand.length * 0.6) {
      score += 20;
      strategy = 'pure-one-suit';
    }
  }

  // Defensive penalty for isolated honors when profile is aggressive
  const isolatedHonors = hand.filter((t) => isHonor(t) && (counts.get(tileKey(t)) ?? 0) === 1);
  score -= isolatedHonors.length * 3 * profile.aggressiveness;

  // Adaptability bonus for hand flexibility
  score += groups.pairs * 3 * profile.adaptability;

  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, strategy, targets };
}

/**
 * Select the best tile to discard given hand, profile, and game state.
 */
export function selectDiscard(
  hand: Tile[],
  profile: StrategyProfile,
  gameState: { discardPool?: Tile[] },
): { tile: Tile | null; reason: string; confidence: number } {
  if (hand.length === 0) {
    return { tile: null, reason: 'empty hand', confidence: 0 };
  }

  const discardPool = gameState?.discardPool ?? [];
  const counts = countTiles(hand);

  // Score each tile for discard desirability (higher = better to discard)
  interface Candidate {
    tile: Tile;
    discardScore: number;
    reason: string;
  }
  const candidates: Candidate[] = [];

  const seen = new Set<string>();
  for (const tile of hand) {
    const key = tileKey(tile);
    if (seen.has(key)) continue;
    seen.add(key);

    let discardScore = 0;
    let reason = '';

    const count = counts.get(key) ?? 0;

    // Isolated tiles are good discard candidates
    if (count === 1) {
      discardScore += 30;
      reason = 'isolated tile';
    }

    // Honor tiles with single copy — safe discard for defensive profiles
    if (isHonor(tile) && count === 1) {
      discardScore += 20 * profile.defensiveness;
      reason = 'isolated honor';
    }

    // Terminals are slightly less useful
    if (isTerminal(tile) && count === 1) {
      discardScore += 10;
      reason = reason || 'isolated terminal';
    }

    // Tiles already in discard pool are safer
    const poolCount = discardPool.filter((d) => tileKey(d) === key).length;
    discardScore += poolCount * 8 * profile.defensiveness;

    // Penalty for discarding pairs (we want to keep them)
    if (count === 2) {
      discardScore -= 15;
      reason = reason || 'pair — keep';
    }

    // Heavy penalty for discarding from triplets
    if (count >= 3) {
      discardScore -= 30;
      reason = reason || 'triplet — keep';
    }

    // Risk-tolerant profiles care less about safety
    const defScore = getDefensiveScore(tile, discardPool);
    discardScore += defScore * profile.defensiveness * 0.5;
    discardScore -= (1 - defScore / 100) * profile.riskTolerance * 10;

    candidates.push({ tile, discardScore, reason });
  }

  candidates.sort((a, b) => b.discardScore - a.discardScore);
  const best = candidates[0];

  const confidence = Math.min(1, Math.max(0, best.discardScore / 60));
  return { tile: best.tile, reason: best.reason, confidence: Math.round(confidence * 100) / 100 };
}

/**
 * Decide whether to claim a discarded tile (chi/pong/kong/win).
 */
export function shouldClaim(
  claimType: string,
  hand: Tile[],
  tile: Tile,
  profile: StrategyProfile,
): { claim: boolean; priority: number } {
  const counts = countTiles(hand);
  const tileCount = counts.get(tileKey(tile)) ?? 0;

  // Win always claims
  if (claimType === 'win') {
    return { claim: true, priority: 100 };
  }

  // Kong: need 3 copies in hand
  if (claimType === 'kong') {
    if (tileCount >= 3) {
      const priority = 70 + profile.aggressiveness * 20;
      return { claim: true, priority: Math.round(priority) };
    }
    return { claim: false, priority: 0 };
  }

  // Pong: need 2 copies in hand
  if (claimType === 'pong') {
    if (tileCount >= 2) {
      // Aggressive profiles pong more
      const base = 40 + profile.aggressiveness * 30;
      // Defensive profiles hesitate
      const penalty = profile.defensiveness * 15;
      const priority = Math.round(base - penalty);
      return { claim: priority > 40, priority };
    }
    return { claim: false, priority: 0 };
  }

  // Chi (sequence claim): only from left player, need adjacent tiles
  if (claimType === 'chi') {
    if (isHonor(tile)) return { claim: false, priority: 0 };

    const rank = tile.rank;
    const suit = tile.suit;

    // Check for possible sequences
    function has(r: number): boolean {
      return hand.some(t => t.suit === suit && t.rank === r);
    }

    const canChi =
      (rank >= 3 && has(rank - 1) && has(rank - 2)) ||
      (rank >= 2 && rank <= 8 && has(rank - 1) && has(rank + 1)) ||
      (rank <= 7 && has(rank + 1) && has(rank + 2));

    if (canChi) {
      const base = 30 + (1 - profile.aggressiveness) * 20;
      const priority = Math.round(base);
      return { claim: priority > 35, priority };
    }
    return { claim: false, priority: 0 };
  }

  return { claim: false, priority: 0 };
}

/**
 * Adapt a strategy profile based on game progress (0 = start, 1 = end).
 * As game progresses, profiles shift toward more defensive play.
 */
export function adaptStrategy(
  profile: StrategyProfile,
  gameProgress: number,
): StrategyProfile {
  const progress = Math.max(0, Math.min(1, gameProgress));
  const shift = progress * profile.adaptability;

  return {
    ...profile,
    aggressiveness: Math.max(0, Math.min(1, profile.aggressiveness - shift * 0.3)),
    defensiveness: Math.max(0, Math.min(1, profile.defensiveness + shift * 0.4)),
    riskTolerance: Math.max(0, Math.min(1, profile.riskTolerance - shift * 0.25)),
    adaptability: profile.adaptability,
    preferredPatterns: [...profile.preferredPatterns],
  };
}

/**
 * Get a defensive safety score for a tile (0-100, higher = safer to discard).
 * Tiles already seen in the discard pool are safer.
 */
export function getDefensiveScore(tile: Tile, discardPool: Tile[]): number {
  const key = tileKey(tile);
  const poolCount = discardPool.filter((d) => tileKey(d) === key).length;

  let score = 0;

  // Each copy in pool makes it safer (max 4 copies per tile)
  score += poolCount * 25;

  // Honor tiles that haven't appeared are dangerous
  if (isHonor(tile) && poolCount === 0) {
    score -= 15;
  }

  // Terminals are slightly safer than middle tiles
  if (isTerminal(tile)) {
    score += 10;
  }

  // Middle tiles (4,5,6) are most dangerous
  if (!isHonor(tile) && tile.rank >= 4 && tile.rank <= 6) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Blend multiple profiles into one using weighted averaging.
 */
export function blendProfiles(
  profiles: StrategyProfile[],
  weights: number[],
): StrategyProfile {
  if (profiles.length === 0 || weights.length === 0) {
    throw new Error('blendProfiles requires at least one profile and weight');
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) {
    throw new Error('Total weight must be greater than zero');
  }

  const normalized = weights.map((w) => w / totalWeight);

  let aggressiveness = 0;
  let defensiveness = 0;
  let riskTolerance = 0;
  let adaptability = 0;
  const patternSet = new Set<string>();

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    const w = normalized[i];
    aggressiveness += p.aggressiveness * w;
    defensiveness += p.defensiveness * w;
    riskTolerance += p.riskTolerance * w;
    adaptability += p.adaptability * w;
    for (const pat of p.preferredPatterns) patternSet.add(pat);
  }

  return {
    id: 'blended',
    name: 'Blended Profile',
    aggressiveness: Math.round(aggressiveness * 1000) / 1000,
    defensiveness: Math.round(defensiveness * 1000) / 1000,
    riskTolerance: Math.round(riskTolerance * 1000) / 1000,
    adaptability: Math.round(adaptability * 1000) / 1000,
    preferredPatterns: [...patternSet],
  };
}

// ---------------------------------------------------------------------------
// Hand analysis (barrel export stub replacement)
// ---------------------------------------------------------------------------

/**
 * Analyze a player's hand to determine shanten, waiting tiles, and suggested discards.
 * Uses the shanten calculator from ai/shanten.
 */
export function analyzeHand(player: Player, state: GameState): HandAnalysis {
  const hand = player.hand;
  const melds = player.melds;
  const shanten = calculateShanten(hand, melds);

  // Find waiting tiles: for each possible tile (0-33), check if adding it reduces shanten
  const waitingTiles: Tile[] = [];
  const used = new Set<string>();
  for (const t of hand) used.add(tileKey(t));

  for (let code = 0; code < 34; code++) {
    let suit: 'wan' | 'tong' | 'tiao' | 'wind' | 'dragon';
    let rank: number;

    if (code < 9) { suit = 'wan'; rank = code + 1; }
    else if (code < 18) { suit = 'tong'; rank = code - 9 + 1; }
    else if (code < 27) { suit = 'tiao'; rank = code - 18 + 1; }
    else if (code < 31) { suit = 'wind'; rank = code - 27; }
    else { suit = 'dragon'; rank = code - 31; }

    const testTile: Tile = { suit, rank, id: -1 };
    const testHand = [...hand, testTile];
    if (calculateShanten(testHand, melds) < shanten) {
      waitingTiles.push(testTile);
    }
  }

  // Suggested discards: simple heuristic — isolate tiles first
  const suggestedDiscards: Tile[] = [];
  const handKeys = new Map<string, Tile[]>();
  for (const t of hand) {
    const k = tileKey(t);
    if (!handKeys.has(k)) handKeys.set(k, []);
    handKeys.get(k)!.push(t);
  }

  for (const t of hand) {
    const k = tileKey(t);
    const count = handKeys.get(k)!.length;
    // Isolated single tiles are good discard candidates
    if (count === 1) {
      // Check if it's isolated (no adjacent numbered tiles)
      let isIsolated = true;
      if (t.suit === 'wan' || t.suit === 'tong' || t.suit === 'tiao') {
        for (const other of hand) {
          if (other.suit === t.suit && Math.abs(other.rank - t.rank) <= 1 && t.id !== other.id) {
            isIsolated = false;
            break;
          }
        }
      }
      if (isIsolated) {
        suggestedDiscards.push(t);
      }
    }
  }

  return { shanten, waitingTiles, suggestedDiscards };
}
