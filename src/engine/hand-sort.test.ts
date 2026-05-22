import { Tile, Meld } from '../types';
import { sortHand, groupBySuit, suggestDiscard, detectPotentialMelds } from '../engine/hand-sort';

function tile(suit: Tile['suit'], rank: number, id: number): Tile {
  return { suit, rank, id };
}

describe('sortHand', () => {
  it('puts wan before tong before tiao before winds before dragons', () => {
    const hand = [
      tile('dragon', 0, 10),
      tile('tiao', 3, 5),
      tile('wan', 1, 1),
      tile('wind', 2, 8),
      tile('tong', 5, 3),
    ];
    const sorted = sortHand(hand);
    expect(sorted.map(t => t.suit)).toEqual(['wan', 'tong', 'tiao', 'wind', 'dragon']);
  });

  it('sorts by rank within suit', () => {
    const hand = [
      tile('wan', 9, 2),
      tile('wan', 1, 1),
      tile('wan', 5, 3),
    ];
    const sorted = sortHand(hand);
    expect(sorted.map(t => t.rank)).toEqual([1, 5, 9]);
  });

  it('returns empty array for empty hand', () => {
    expect(sortHand([])).toEqual([]);
  });

  it('handles mixed numbered suits and honors correctly', () => {
    const hand = [
      tile('dragon', 2, 20),
      tile('wind', 0, 15),
      tile('tong', 1, 5),
      tile('wan', 3, 2),
      tile('tiao', 7, 10),
      tile('wind', 3, 16),
      tile('dragon', 0, 18),
    ];
    const sorted = sortHand(hand);
    expect(sorted.map(t => t.suit)).toEqual(['wan', 'tong', 'tiao', 'wind', 'wind', 'dragon', 'dragon']);
    // Winds sorted by rank
    const winds = sorted.filter(t => t.suit === 'wind');
    expect(winds[0].rank).toBe(0); // East
    expect(winds[1].rank).toBe(3); // North
  });
});

describe('groupBySuit', () => {
  it('creates correct groups', () => {
    const hand = [
      tile('wan', 1, 1),
      tile('wan', 2, 2),
      tile('tong', 5, 3),
      tile('dragon', 0, 10),
    ];
    const groups = groupBySuit(hand);
    expect(groups.size).toBe(3);
    expect(groups.get('wan')!.length).toBe(2);
    expect(groups.get('tong')!.length).toBe(1);
    expect(groups.get('dragon')!.length).toBe(1);
  });

  it('returns empty map for empty hand', () => {
    expect(groupBySuit([]).size).toBe(0);
  });
});

describe('suggestDiscard', () => {
  it('identifies isolated tiles', () => {
    const hand = [
      tile('wan', 1, 1),
      tile('wan', 2, 2),  // pair with sequence
      tile('wan', 2, 22), // pair
      tile('tong', 5, 3), // isolated
      tile('dragon', 0, 10), // isolated
    ];
    const isolated = suggestDiscard(hand, []);
    const ids = isolated.map(t => t.id);
    expect(ids).toContain(3);   // tong-5 is isolated
    expect(ids).toContain(10);  // dragon-0 is isolated
    expect(ids).not.toContain(1); // wan-1 adjacent to wan-2
    expect(ids).not.toContain(2); // wan-2 has pair + adjacent
  });

  it('excludes meld tiles from consideration', () => {
    const hand = [
      tile('wan', 1, 1),
      tile('tong', 9, 5),
    ];
    const melds: Meld[] = [{
      type: 'pong',
      tiles: [tile('wan', 1, 1), tile('wan', 1, 50), tile('wan', 1, 51)],
      concealed: false,
    }];
    const isolated = suggestDiscard(hand, melds);
    // wan-1 is in meld so excluded; tong-9 is isolated in free tiles
    expect(isolated.map(t => t.id)).toContain(5);
  });

  it('returns empty for empty hand', () => {
    expect(suggestDiscard([], [])).toEqual([]);
  });
});

describe('detectPotentialMelds', () => {
  it('finds pairs', () => {
    const hand = [
      tile('wan', 3, 1),
      tile('wan', 3, 2),
      tile('tong', 9, 10),
    ];
    const melds = detectPotentialMelds(hand);
    const pair = melds.find(m => m.type === 'pair');
    expect(pair).toBeDefined();
    expect(pair!.tiles.length).toBe(2);
  });

  it('finds partial sequences', () => {
    const hand = [
      tile('tiao', 4, 1),
      tile('tiao', 5, 2),
      tile('dragon', 1, 10),
    ];
    const melds = detectPotentialMelds(hand);
    const seq = melds.find(m => m.type === 'partial_sequence');
    expect(seq).toBeDefined();
    expect(seq!.tiles.length).toBe(2);
  });

  it('finds triplets when 3 of same', () => {
    const hand = [
      tile('wan', 5, 1),
      tile('wan', 5, 2),
      tile('wan', 5, 3),
    ];
    const melds = detectPotentialMelds(hand);
    const triplet = melds.find(m => m.type === 'triplet');
    expect(triplet).toBeDefined();
    expect(triplet!.tiles.length).toBe(3);
  });

  it('returns empty for empty hand', () => {
    expect(detectPotentialMelds([])).toEqual([]);
  });
});
