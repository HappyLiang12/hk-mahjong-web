import { Tile, Meld } from '../types';
import { calculateShanten, shantenByForm } from './shanten';

function t(suit: string, rank: number, id: number = 0): Tile {
  return { suit: suit as any, rank, id };
}

describe('Shanten Calculator', () => {
  test('winning hand returns -1', () => {
    const hand = [
      t('wan', 1, 0), t('wan', 2, 1), t('wan', 3, 2),
      t('wan', 4, 3), t('wan', 5, 4), t('wan', 6, 5),
      t('wan', 7, 6), t('wan', 8, 7), t('wan', 9, 8),
      t('tong', 1, 9), t('tong', 1, 10), t('tong', 1, 11),
      t('tong', 2, 12), t('tong', 2, 13),
    ];
    expect(calculateShanten(hand, [])).toBe(-1);
  });

  test('tenpai hand returns 0', () => {
    const hand = [
      t('wan', 1, 0), t('wan', 2, 1), t('wan', 3, 2),
      t('wan', 4, 3), t('wan', 5, 4), t('wan', 6, 5),
      t('wan', 7, 6), t('wan', 8, 7), t('wan', 9, 8),
      t('tong', 1, 9), t('tong', 1, 10), t('tong', 1, 11),
      t('tong', 2, 12),
    ];
    expect(calculateShanten(hand, [])).toBe(0);
  });

  test('iishanten hand returns 1', () => {
    const hand = [
      t('wan', 1, 0), t('wan', 2, 1), t('wan', 3, 2),
      t('wan', 4, 3), t('wan', 5, 4), t('wan', 6, 5),
      t('wan', 7, 6), t('wan', 8, 7), t('wan', 9, 8),
      t('tong', 1, 9), t('tong', 1, 10),
      t('tong', 3, 11), t('tong', 5, 12),
    ];
    const sh = calculateShanten(hand, []);
    expect(sh).toBeGreaterThanOrEqual(0);
    expect(sh).toBeLessThanOrEqual(2);
  });

  test('seven pairs tenpai', () => {
    const hand = [
      t('wan', 1, 0), t('wan', 1, 1),
      t('wan', 3, 2), t('wan', 3, 3),
      t('tong', 5, 4), t('tong', 5, 5),
      t('tiao', 7, 6), t('tiao', 7, 7),
      t('wind', 0, 8), t('wind', 0, 9),
      t('dragon', 1, 10), t('dragon', 1, 11),
      t('dragon', 2, 12),
    ];
    const forms = shantenByForm(hand, []);
    expect(forms.sevenPairs).toBe(0);
  });

  test('thirteen orphans tenpai', () => {
    const hand = [
      t('wan', 1, 0), t('wan', 9, 1),
      t('tong', 1, 2), t('tong', 9, 3),
      t('tiao', 1, 4), t('tiao', 9, 5),
      t('wind', 0, 6), t('wind', 1, 7), t('wind', 2, 8), t('wind', 3, 9),
      t('dragon', 0, 10), t('dragon', 1, 11),
      t('dragon', 2, 12),
    ];
    const forms = shantenByForm(hand, []);
    expect(forms.thirteenOrphans).toBe(0);
  });

  test('thirteen orphans complete returns -1', () => {
    const hand = [
      t('wan', 1, 0), t('wan', 9, 1),
      t('tong', 1, 2), t('tong', 9, 3),
      t('tiao', 1, 4), t('tiao', 9, 5),
      t('wind', 0, 6), t('wind', 1, 7), t('wind', 2, 8), t('wind', 3, 9),
      t('dragon', 0, 10), t('dragon', 1, 11), t('dragon', 2, 12),
      t('wan', 1, 13),
    ];
    expect(calculateShanten(hand, [])).toBe(-1);
  });

  test('with existing melds reduces shanten', () => {
    const melds: Meld[] = [
      { type: 'pong', tiles: [t('wan', 1, 0), t('wan', 1, 1), t('wan', 1, 2)], concealed: false },
    ];
    const hand = [
      t('tong', 1, 3), t('tong', 2, 4), t('tong', 3, 5),
      t('tiao', 4, 6), t('tiao', 5, 7), t('tiao', 6, 8),
      t('wind', 0, 9), t('wind', 0, 10), t('wind', 0, 11),
      t('dragon', 2, 12),
    ];
    const sh = calculateShanten(hand, melds);
    expect(sh).toBe(0);
  });

  test('completely random hand has high shanten', () => {
    const hand = [
      t('wan', 1, 0), t('wan', 3, 1), t('wan', 5, 2),
      t('tong', 2, 3), t('tong', 4, 4), t('tong', 6, 5),
      t('tiao', 1, 6), t('tiao', 3, 7), t('tiao', 8, 8),
      t('wind', 0, 9), t('wind', 2, 10),
      t('dragon', 0, 11), t('dragon', 2, 12),
    ];
    const sh = calculateShanten(hand, []);
    expect(sh).toBeGreaterThanOrEqual(2);
  });
});
