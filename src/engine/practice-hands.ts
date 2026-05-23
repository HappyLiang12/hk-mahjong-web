import type { Suit, Tile } from '../types';

/** Lightweight tile spec — suit + rank only, no id. */
export interface PracticeHandTile {
  suit: Suit;
  rank: number;
}

/** A curated practice hand: 13 tiles + 1 drawn tile. */
export interface PracticeHandSpec {
  hand: PracticeHandTile[];
  draw: PracticeHandTile;
}

/** Pre-built meld for AI opponents in practice scenarios. */
export interface PracticeMeldSpec {
  type: 'chow' | 'pong' | 'kong';
  tiles: PracticeHandTile[];
}

/** Scenario identifiers used by PracticeScreen and gameStore. */
export type PracticeScenarioId =
  | 'standard-hand'
  | 'one-away'
  | 'mixed-suit'
  | 'all-pong'
  | 'defense'
  | 'fast-game';

/* ── Curated hands ─────────────────────────────────────────────── */

const ONE_AWAY: PracticeHandSpec = {
  hand: [
    { suit: 'wan', rank: 1 }, { suit: 'wan', rank: 2 }, { suit: 'wan', rank: 3 },
    { suit: 'tong', rank: 4 }, { suit: 'tong', rank: 5 }, { suit: 'tong', rank: 6 },
    { suit: 'tiao', rank: 7 }, { suit: 'tiao', rank: 8 }, { suit: 'tiao', rank: 9 },
    { suit: 'dragon', rank: 0 }, { suit: 'dragon', rank: 0 },
    { suit: 'wan', rank: 3 }, { suit: 'wan', rank: 5 },
  ],
  draw: { suit: 'tong', rank: 5 },
};

const MIXED_SUIT: PracticeHandSpec = {
  hand: [
    { suit: 'wan', rank: 1 }, { suit: 'wan', rank: 2 }, { suit: 'wan', rank: 3 },
    { suit: 'wan', rank: 5 }, { suit: 'wan', rank: 6 }, { suit: 'wan', rank: 7 },
    { suit: 'wan', rank: 8 }, { suit: 'wan', rank: 9 },
    { suit: 'dragon', rank: 0 }, { suit: 'dragon', rank: 0 },
    { suit: 'dragon', rank: 1 }, { suit: 'dragon', rank: 1 },
    { suit: 'wind', rank: 0 },
  ],
  draw: { suit: 'wan', rank: 9 },
};

const ALL_PONG: PracticeHandSpec = {
  hand: [
    { suit: 'wan', rank: 1 }, { suit: 'wan', rank: 1 },
    { suit: 'tong', rank: 3 }, { suit: 'tong', rank: 3 },
    { suit: 'tiao', rank: 7 }, { suit: 'tiao', rank: 7 },
    { suit: 'dragon', rank: 2 }, { suit: 'dragon', rank: 2 },
    { suit: 'wind', rank: 1 }, { suit: 'wind', rank: 1 },
    { suit: 'wan', rank: 5 },
    { suit: 'tong', rank: 8 },
    { suit: 'tiao', rank: 2 },
  ],
  draw: { suit: 'wind', rank: 1 },
};

/** Defense scenario: AI opponents have pre-built melds. */
const DEFENSE: PracticeHandSpec = {
  hand: [
    { suit: 'wan', rank: 2 }, { suit: 'wan', rank: 4 }, { suit: 'wan', rank: 7 },
    { suit: 'tong', rank: 1 }, { suit: 'tong', rank: 3 }, { suit: 'tong', rank: 6 },
    { suit: 'tiao', rank: 3 }, { suit: 'tiao', rank: 5 }, { suit: 'tiao', rank: 8 },
    { suit: 'wind', rank: 0 },
    { suit: 'dragon', rank: 0 },
    { suit: 'dragon', rank: 2 }, { suit: 'dragon', rank: 2 },
  ],
  draw: { suit: 'tiao', rank: 5 },
};

/** AI melds for the defense scenario. */
const DEFENSE_AI_MELDS: (PracticeMeldSpec[] | null)[] = [
  null, // human — no meld
  [  // AI player 1: exposed pong of East wind
    { type: 'pong', tiles: [
      { suit: 'wind', rank: 0 }, { suit: 'wind', rank: 0 }, { suit: 'wind', rank: 0 },
    ]},
  ],
  [  // AI player 2: exposed chow of 4-5-6 wan
    { type: 'chow', tiles: [
      { suit: 'wan', rank: 4 }, { suit: 'wan', rank: 5 }, { suit: 'wan', rank: 6 },
    ]},
  ],
  [  // AI player 3: exposed kong of Red dragon
    { type: 'kong', tiles: [
      { suit: 'dragon', rank: 1 }, { suit: 'dragon', rank: 1 },
      { suit: 'dragon', rank: 1 }, { suit: 'dragon', rank: 1 },
    ]},
  ],
];

/* ── Registry ──────────────────────────────────────────────────── */

const SCENARIO_HANDS: Record<PracticeScenarioId, PracticeHandSpec | null> = {
  'standard-hand': null, // random deal
  'one-away': ONE_AWAY,
  'mixed-suit': MIXED_SUIT,
  'all-pong': ALL_PONG,
  'defense': DEFENSE,
  'fast-game': null, // random deal; timer is UI concern
};

const SCENARIO_AI_MELDS: Record<PracticeScenarioId, (PracticeMeldSpec[] | null)[]> = {
  'standard-hand': [null, null, null, null],
  'one-away': [null, null, null, null],
  'mixed-suit': [null, null, null, null],
  'all-pong': [null, null, null, null],
  'defense': DEFENSE_AI_MELDS,
  'fast-game': [null, null, null, null],
};

/* ── Validation ────────────────────────────────────────────────── */

const VALID_SUITS: Suit[] = ['wan', 'tong', 'tiao', 'wind', 'dragon'];

/** Validate a practice hand spec. Returns null if valid, error string if not. */
export function validatePracticeHand(spec: PracticeHandSpec | null): string | null {
  if (spec === null) return null; // random hands are valid

  if (spec.hand.length !== 13) {
    return `hand must have 13 tiles, got ${spec.hand.length}`;
  }
  if (spec.draw && (spec.draw.suit == null || spec.draw.rank == null)) {
    return 'draw tile is invalid';
  }

  // Check valid suits/ranks and max copies per tile
  const count = new Map<string, number>();
  const allTiles = [...spec.hand, spec.draw];

  for (const t of allTiles) {
    if (!VALID_SUITS.includes(t.suit)) {
      return `invalid suit: ${t.suit}`;
    }
    if (t.rank < 0 || t.rank > 9) {
      return `invalid rank: ${t.rank} for suit ${t.suit}`;
    }
    const key = `${t.suit}:${t.rank}`;
    count.set(key, (count.get(key) || 0) + 1);
  }

  for (const [key, c] of count) {
    if (c > 4) {
      return `too many copies of ${key}: ${c} (max 4)`;
    }
    if (key.startsWith('flower') && c > 1) {
      return `too many copies of flower tile ${key}: ${c} (max 1)`;
    }
  }

  return null;
}

/** Get the total number of meld tiles an AI player needs from the wall (hand size = 13 - meld tiles). */
function aiMeldTileCount(specs: PracticeMeldSpec[]): number {
  return specs.reduce((sum, m) => sum + m.tiles.length, 0);
}

/** Validate AI meld specs for a scenario. */
export function validateAiMelds(
  melds: (PracticeMeldSpec[] | null)[] | null,
): string | null {
  if (!melds) return null;
  if (melds.length !== 4) return `melds must have 4 entries (one per player), got ${melds.length}`;

  for (let i = 0; i < 4; i++) {
    const playerMelds = melds[i];
    if (!playerMelds) continue;

    let totalTiles = 0;
    for (const m of playerMelds) {
      totalTiles += m.tiles.length;
      for (const t of m.tiles) {
        if (!VALID_SUITS.includes(t.suit)) {
          return `player ${i} meld: invalid suit ${t.suit}`;
        }
      }
    }

    // AI hand = 13 - meld tile count
    const handSize = 13 - totalTiles;
    if (handSize < 0) {
      return `player ${i}: melds consume ${totalTiles} tiles, exceeding 13`;
    }
  }

  return null;
}

/* ── Public API ────────────────────────────────────────────────── */

/** Get the curated hand for a scenario. Returns null for random-deal scenarios. */
export function getPracticeHand(scenario: PracticeScenarioId): PracticeHandSpec | null {
  return SCENARIO_HANDS[scenario] ?? null;
}

/** Get AI melds for a scenario. Returns array of 4 entries (null = no meld for that player). */
export function getPracticeAiMelds(scenario: PracticeScenarioId): (PracticeMeldSpec[] | null)[] {
  return SCENARIO_AI_MELDS[scenario] ?? [null, null, null, null];
}

/** Get the PracticeScenarioId list. */
export function getPracticeScenarios(): PracticeScenarioId[] {
  return Object.keys(SCENARIO_HANDS) as PracticeScenarioId[];
}
