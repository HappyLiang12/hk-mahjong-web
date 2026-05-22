import { GameState, Player, Tile } from '../types';
import { createTileSetWithOptions, shuffleTiles, isFlowerTile } from './tiles';

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
 * Initialize a new game round.
 */
export function initGame(dealer: number = 0, prevailingWind: number = 0, options?: { flowers?: boolean }): GameState {
  const useFlowers = options?.flowers ?? false;
  const wall = shuffleTiles(createTileSetWithOptions({ flowers: useFlowers }));

  const players: Player[] = [];
  for (let i = 0; i < 4; i++) {
    const seatWind = (i - dealer + 4) % 4;
    players.push(createPlayer(seatWind));
  }

  // Deal: groups of 4, three rounds, then 1 each
  for (let round = 0; round < 3; round++) {
    for (let p = 0; p < 4; p++) {
      const idx = (dealer + p) % 4;
      for (let t = 0; t < 4; t++) {
        players[idx].hand.push(wall.pop()!);
      }
    }
  }
  for (let p = 0; p < 4; p++) {
    const idx = (dealer + p) % 4;
    players[idx].hand.push(wall.pop()!);
  }

  // Dealer gets 14th tile
  players[dealer].hand.push(wall.pop()!);

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
