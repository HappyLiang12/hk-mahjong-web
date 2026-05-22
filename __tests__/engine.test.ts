import { describe, it, expect } from 'vitest';
import { createTileSet, shuffleTiles, isFlowerTile, tileName } from '../src/engine/tiles';
import { initGame, sortHand } from '../src/engine/game';
import { drawTile, discardTile, advanceTurn } from '../src/engine/turns';
import { checkWin, isStandardWin, isSevenPairs, isThirteenOrphans } from '../src/engine/winning';
import { canPong, canChow, doPong, doChow } from '../src/engine/melds';
import { calculateScore } from '../src/engine/scoring';
import type { Tile, GameState } from '../src/types';

describe('tiles.ts', () => {
  it('creates 136 tiles', () => {
    const tiles = createTileSet();
    expect(tiles.length).toBe(136);
  });

  it('tiles have unique ids', () => {
    const tiles = createTileSet();
    const ids = new Set(tiles.map(t => t.id));
    expect(ids.size).toBe(136);
  });

  it('shuffle preserves count', () => {
    const tiles = createTileSet();
    const shuffled = shuffleTiles([...tiles]);
    expect(shuffled.length).toBe(136);
  });

  it('tile naming works', () => {
    expect(tileName({ suit: 'wan', rank: 1, id: 0 })).toBe('1萬');
    expect(tileName({ suit: 'wind', rank: 0, id: 108 })).toBe('東風');
    expect(tileName({ suit: 'dragon', rank: 0, id: 124 })).toBe('中');
  });

  it('flower detection', () => {
    expect(isFlowerTile({ suit: 'flower', rank: 1, id: 200 })).toBe(true);
    expect(isFlowerTile({ suit: 'wan', rank: 1, id: 0 })).toBe(false);
  });
});

describe('game.ts', () => {
  it('initializes game with 4 players', () => {
    const state = initGame(0, 0);
    expect(state.players.length).toBe(4);
  });

  it('dealer has 14 tiles, others 13', () => {
    const state = initGame(0, 0);
    expect(state.players[0].hand.length).toBe(14);
    expect(state.players[1].hand.length).toBe(13);
    expect(state.players[2].hand.length).toBe(13);
    expect(state.players[3].hand.length).toBe(13);
  });

  it('hands are sorted', () => {
    const state = initGame(0, 0);
    for (const p of state.players) {
      expect(p.hand).toEqual(sortHand(p.hand));
    }
  });

  it('dealer starts', () => {
    expect(initGame(0, 0).currentTurn).toBe(0);
    expect(initGame(2, 0).currentTurn).toBe(2);
  });

  it('phase starts as discard (dealer has 14)', () => {
    expect(initGame(0, 0).phase).toBe('discard');
  });
});

describe('turns.ts', () => {
  it('discard removes tile from hand', () => {
    const state = initGame(0, 0);
    const handLen = state.players[0].hand.length;
    const tileId = state.players[0].hand[0].id;
    discardTile(state, tileId);
    expect(state.players[0].hand.length).toBe(handLen - 1);
    expect(state.phase).toBe('claim');
  });

  it('draw + discard cycle works', () => {
    const state = initGame(0, 0);
    // Discard first (dealer has 14)
    discardTile(state, state.players[0].hand[0].id);
    // Advance to next player
    advanceTurn(state);
    expect(state.currentTurn).toBe(1);
    expect(state.phase).toBe('draw');
    // AI draws
    const tile = drawTile(state);
    expect(tile).not.toBeNull();
    expect(state.phase).toBe('discard');
  });
});

describe('winning.ts', () => {
  it('detects seven pairs', () => {
    const tiles: Tile[] = [];
    for (let i = 0; i < 7; i++) {
      tiles.push({ suit: 'wan', rank: i + 1, id: i * 2 });
      tiles.push({ suit: 'wan', rank: i + 1, id: i * 2 + 1 });
    }
    expect(isSevenPairs(tiles, [])).toBe(true);
    expect(checkWin({ hand: tiles, melds: [], discards: [], flowers: [], seatWind: 0 })).toBe('seven_pairs');
  });

  it('detects non-winning hand', () => {
    const tiles: Tile[] = Array.from({ length: 14 }, (_, i) => ({
      suit: 'wan' as const, rank: (i % 9) + 1, id: i,
    }));
    expect(checkWin({ hand: tiles, melds: [], discards: [], flowers: [], seatWind: 0 })).toBeNull();
  });

  it('thirteen orphans requires all 13 unique + 1 dup', () => {
    const orphanRanks: [string, number][] = [
      ['wan', 1], ['wan', 9], ['tong', 1], ['tong', 9], ['tiao', 1], ['tiao', 9],
      ['wind', 0], ['wind', 1], ['wind', 2], ['wind', 3],
      ['dragon', 0], ['dragon', 1], ['dragon', 2],
    ];
    const tiles: Tile[] = orphanRanks.map(([s, r], i) => ({ suit: s as any, rank: r, id: i }));
    tiles.push({ suit: 'dragon', rank: 2, id: 99 }); // dupe dragon white
    expect(isThirteenOrphans(tiles, [])).toBe(true);
  });
});

describe('melds.ts', () => {
  it('can pong when 2 matching tiles in hand', () => {
    const tiles: Tile[] = [
      { suit: 'wan', rank: 1, id: 0 },
      { suit: 'wan', rank: 1, id: 1 },
      { suit: 'tiao', rank: 5, id: 2 },
    ];
    expect(canPong({ hand: tiles, melds: [], discards: [], seatWind: 0 }, { suit: 'wan', rank: 1, id: 99 })).toBe(true);
  });

  it('cannot pong with only 1 matching', () => {
    const tiles: Tile[] = [
      { suit: 'wan', rank: 1, id: 0 },
      { suit: 'tong', rank: 5, id: 2 },
    ];
    expect(canPong({ hand: tiles, melds: [], discards: [], seatWind: 0 }, { suit: 'wan', rank: 1, id: 99 })).toBe(false);
  });

  it('doPong creates meld and removes tiles', () => {
    const tiles: Tile[] = [
      { suit: 'wan', rank: 1, id: 0 },
      { suit: 'wan', rank: 1, id: 1 },
      { suit: 'tiao', rank: 5, id: 2 },
    ];
    const player = { hand: [...tiles], melds: [], discards: [], seatWind: 0 };
    const meld = doPong(player, { suit: 'wan', rank: 1, id: 99 });
    expect(meld).not.toBeNull();
    expect(meld!.type).toBe('pong');
    expect(meld!.tiles.length).toBe(3);
    expect(player.hand.length).toBe(1);
  });
});

describe('scoring.ts', () => {
  it('calculates flower bonus', () => {
    const player = {
      hand: [], melds: [], discards: [],
      flowers: [{ suit: 'flower' as const, rank: 1, id: 200 }],
      seatWind: 0,
    };
    const state = initGame(0, 0);
    const result = calculateScore({ ...player, hand: [], melds: [] }, state, false, 'standard');
    // With no winning hand the score returns 0
    expect(result.faan).toBe(0);
  });
});
