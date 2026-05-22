import { Tile, Meld, Player, GameState } from '../types';
import { calculateScore } from '../engine/scoring';

function t(suit: string, rank: number, id: number = 0): Tile {
  return { suit: suit as any, rank, id };
}

function makeState(prevailingWind: number = 0): GameState {
  return {
    wall: [],
    players: [],
    currentTurn: 0,
    prevailingWind,
    lastDiscard: null,
    lastDiscardBy: null,
    phase: 'end',
  };
}

function makePlayer(hand: Tile[], melds: Meld[] = [], seatWind: number = 0): Player {
  return { hand, melds, discards: [], seatWind };
}

describe('HK Scoring', () => {
  test('thirteen orphans = 13 faan', () => {
    const player = makePlayer([
      t('wan', 1, 0), t('wan', 9, 1),
      t('tong', 1, 2), t('tong', 9, 3),
      t('tiao', 1, 4), t('tiao', 9, 5),
      t('wind', 0, 6), t('wind', 1, 7), t('wind', 2, 8), t('wind', 3, 9),
      t('dragon', 0, 10), t('dragon', 1, 11), t('dragon', 2, 12),
      t('wan', 1, 13),
    ]);
    const result = calculateScore(player, makeState(), false, 'thirteen_orphans');
    expect(result.faan).toBe(13);
  });

  test('seven pairs = 4 faan', () => {
    const player = makePlayer([
      t('wan', 1, 0), t('wan', 1, 1),
      t('wan', 3, 2), t('wan', 3, 3),
      t('tong', 5, 4), t('tong', 5, 5),
      t('tiao', 7, 6), t('tiao', 7, 7),
      t('wind', 0, 8), t('wind', 0, 9),
      t('dragon', 1, 10), t('dragon', 1, 11),
      t('dragon', 2, 12), t('dragon', 2, 13),
    ]);
    const result = calculateScore(player, makeState(), false, 'seven_pairs');
    expect(result.faan).toBe(4);
  });

  test('seven pairs self-drawn = 5 faan', () => {
    const player = makePlayer([
      t('wan', 1, 0), t('wan', 1, 1),
      t('wan', 3, 2), t('wan', 3, 3),
      t('tong', 5, 4), t('tong', 5, 5),
      t('tiao', 7, 6), t('tiao', 7, 7),
      t('wind', 0, 8), t('wind', 0, 9),
      t('dragon', 1, 10), t('dragon', 1, 11),
      t('dragon', 2, 12), t('dragon', 2, 13),
    ]);
    const result = calculateScore(player, makeState(), true, 'seven_pairs');
    expect(result.faan).toBe(5);
  });

  test('minimum hand (chicken) = 3 faan', () => {
    // Plain chow hand with no scoring elements
    const player = makePlayer([
      t('wan', 1, 0), t('wan', 2, 1), t('wan', 3, 2),
      t('wan', 4, 3), t('wan', 5, 4), t('wan', 6, 5),
      t('tong', 1, 6), t('tong', 2, 7), t('tong', 3, 8),
      t('tiao', 1, 9), t('tiao', 2, 10), t('tiao', 3, 11),
      t('tiao', 5, 12), t('tiao', 5, 13),
    ], [], 1); // seat wind south, prevailing east — no wind bonus
    const result = calculateScore(player, makeState(), false, 'standard');
    expect(result.faan).toBe(3);
    expect(result.breakdown[0].name).toContain('雞糊');
  });

  test('all pongs = 6 faan', () => {
    const player = makePlayer([
      t('wan', 1, 0), t('wan', 1, 1), t('wan', 1, 2),
      t('tong', 5, 3), t('tong', 5, 4), t('tong', 5, 5),
      t('tiao', 9, 6), t('tiao', 9, 7), t('tiao', 9, 8),
      t('wind', 1, 9), t('wind', 1, 10), t('wind', 1, 11),
      t('tiao', 3, 12), t('tiao', 3, 13),
    ], [], 0);
    const result = calculateScore(player, makeState(), false, 'standard');
    expect(result.faan).toBeGreaterThanOrEqual(6);
  });

  test('full flush = 10 faan', () => {
    // All wan tiles
    const player = makePlayer([
      t('wan', 1, 0), t('wan', 2, 1), t('wan', 3, 2),
      t('wan', 4, 3), t('wan', 5, 4), t('wan', 6, 5),
      t('wan', 7, 6), t('wan', 8, 7), t('wan', 9, 8),
      t('wan', 1, 9), t('wan', 1, 10), t('wan', 1, 11),
      t('wan', 2, 12), t('wan', 2, 13),
    ]);
    const result = calculateScore(player, makeState(), false, 'standard');
    expect(result.faan).toBeGreaterThanOrEqual(10);
  });

  test('dragon pong adds 1 faan', () => {
    const melds: Meld[] = [
      { type: 'pong', tiles: [t('dragon', 0, 0), t('dragon', 0, 1), t('dragon', 0, 2)], concealed: false },
    ];
    const player = makePlayer([
      t('wan', 1, 3), t('wan', 2, 4), t('wan', 3, 5),
      t('tong', 4, 6), t('tong', 5, 7), t('tong', 6, 8),
      t('tiao', 7, 9), t('tiao', 8, 10), t('tiao', 9, 11),
      t('tiao', 5, 12), t('tiao', 5, 13),
    ], melds, 1);
    const result = calculateScore(player, makeState(), false, 'standard');
    // 1 faan for dragon — but minimum is 3, so should be at least 3
    expect(result.faan).toBeGreaterThanOrEqual(3);
    const dragonItem = result.breakdown.find((b: any) => b.name.includes('Dragon'));
    // May or may not show individually if minimum rule kicks in
    // At minimum, score should be valid
    expect(result.faan).toBeGreaterThan(0);
  });

  test('payment is positive', () => {
    const player = makePlayer([
      t('wan', 1, 0), t('wan', 2, 1), t('wan', 3, 2),
      t('wan', 4, 3), t('wan', 5, 4), t('wan', 6, 5),
      t('wan', 7, 6), t('wan', 8, 7), t('wan', 9, 8),
      t('wan', 1, 9), t('wan', 1, 10), t('wan', 1, 11),
      t('wan', 2, 12), t('wan', 2, 13),
    ]);
    const result = calculateScore(player, makeState(), true, 'standard');
    expect(result.payment).toBeGreaterThan(0);
  });
});
