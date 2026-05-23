import { GameState, Player, Tile, Suit, Meld } from '../types';
import { createTileSetWithOptions, shuffleTiles, isFlowerTile } from './tiles';

export interface InitGameHandTile {
  suit: Suit;
  rank: number;
}

export interface InitGameMeldSpec {
  type: 'pong' | 'chow' | 'kong';
  tiles: InitGameHandTile[];
}

export interface InitGameOptions {
  flowers?: boolean;
  /** Per-player hand overrides (14 tiles for dealer, 13 for others). null = random. */
  hands?: (InitGameHandTile[] | null)[];
  /** Per-player pre-built melds. null = none. */
  melds?: (InitGameMeldSpec[] | null)[];
}

/**
 * Create a fresh player with empty state.
 */
function createPlayer(seatWind: number): Player {
  return {
    hand: [],
    melds: [],
    discards: [],
    flowers: [],
    seatWind,
  };
}

/**
 * Sort a hand by suit order then rank (for convenience).
 */
export function sortHand(hand: Tile[]): Tile[] {
  const suitOrder: Record<string, number> = { wan: 0, tong: 1, tiao: 2, wind: 3, dragon: 4, flower: 5 };
  return [...hand].sort((a, b) => {
    const s = suitOrder[a.suit] - suitOrder[b.suit];
    return s !== 0 ? s : a.rank - b.rank;
  });
}

/**
 * Pull a tile matching (suit, rank) from the wall. Returns null if not found.
 */
function pullTileFromWall(wall: Tile[], suit: Suit, rank: number): Tile | null {
  const idx = wall.findIndex(t => t.suit === suit && t.rank === rank);
  if (idx === -1) return null;
  return wall.splice(idx, 1)[0];
}

/**
 * Build a meld from a spec by pulling tiles from the wall.
 */
function buildMeldFromSpec(wall: Tile[], spec: InitGameMeldSpec): Meld | null {
  const tiles: Tile[] = [];
  for (const ht of spec.tiles) {
    const tile = pullTileFromWall(wall, ht.suit, ht.rank);
    if (!tile) return null;
    tiles.push(tile);
  }
  return { type: spec.type, tiles, concealed: false };
}

/**
 * Initialize a new game round.
 */
export function initGame(dealer: number = 0, prevailingWind: number = 0, options?: InitGameOptions): GameState {
  const useFlowers = options?.flowers ?? false;
  const wall = shuffleTiles(createTileSetWithOptions({ flowers: useFlowers }));

  const players: Player[] = [];
  for (let i = 0; i < 4; i++) {
    const seatWind = (i - dealer + 4) % 4;
    players.push(createPlayer(seatWind));
  }

  // Apply pre-built melds before dealing (these consume wall tiles)
  if (options?.melds) {
    for (let i = 0; i < 4; i++) {
      const meldSpecs = options.melds[i];
      if (meldSpecs) {
        for (const spec of meldSpecs) {
          const meld = buildMeldFromSpec(wall, spec);
          if (meld) players[i].melds.push(meld);
        }
      }
    }
  }

  // If hands are provided, pull from wall by (suit, rank) match
  if (options?.hands) {
    for (let i = 0; i < 4; i++) {
      const handSpec = options.hands[i];
      if (handSpec) {
        // Count existing tiles in melds for this player
        const meldTileCount = players[i].melds.reduce((sum, m) => sum + m.tiles.length, 0);
        const targetSize = i === dealer ? 14 : 13;
        const needed = targetSize - meldTileCount;
        if (handSpec.length !== needed) {
          // Fallback to random deal for safety
          continue;
        }
        for (const ht of handSpec) {
          const tile = pullTileFromWall(wall, ht.suit, ht.rank);
          if (tile) players[i].hand.push(tile);
        }
      }
    }
  }

  // Deal remaining tiles randomly if not all assigned
  const totalAssigned = players.reduce((sum, p) => sum + p.hand.length, 0);
  const totalMelds = players.reduce((sum, p) => sum + p.melds.reduce((s, m) => s + m.tiles.length, 0), 0);
  const expected = useFlowers ? 144 : 136;
  const expectedHandTotal = 14 + 13 * 3;  // dealer 14 + 3 others × 13
  const expectedAssigned = expectedHandTotal + totalMelds;

  if (totalAssigned < expectedHandTotal) {
    // Random deal for unassigned hands
    // Figure out which players still need tiles
    for (let i = 0; i < 4; i++) {
      const meldTileCount = players[i].melds.reduce((sum, m) => sum + m.tiles.length, 0);
      const targetSize = i === dealer ? 14 : 13;
      const needed = targetSize - players[i].hand.length - meldTileCount;
      for (let t = 0; t < needed; t++) {
        if (wall.length > 0) players[i].hand.push(wall.pop()!);
      }
    }
  }

  // Sort all hands
  for (const player of players) {
    player.hand = sortHand(player.hand);
  }

  const state: GameState = {
    wall,
    players,
    currentTurn: dealer,
    prevailingWind,
    lastDiscard: null,
    lastDiscardBy: null,
    phase: 'discard',
  };

  // Reveal flower tiles
  if (useFlowers) {
    for (const player of players) {
      revealFlowers(player, wall);
    }
    for (const player of players) {
      player.hand = sortHand(player.hand);
    }
  }

  return state;
}

/**
 * Reveal all flower tiles in a player's hand, replacing each from the wall.
 */
export function revealFlowers(player: Player, wall: Tile[]): Tile[] {
  if (!player.flowers) player.flowers = [];
  const revealed: Tile[] = [];
  let hasFlower = true;
  while (hasFlower) {
    hasFlower = false;
    for (let i = player.hand.length - 1; i >= 0; i--) {
      if (isFlowerTile(player.hand[i])) {
        const flower = player.hand.splice(i, 1)[0];
        player.flowers.push(flower);
        revealed.push(flower);
        if (wall.length > 0) {
          const replacement = wall.shift()!;
          player.hand.push(replacement);
        }
        hasFlower = true;
        break;
      }
    }
  }
  return revealed;
}
