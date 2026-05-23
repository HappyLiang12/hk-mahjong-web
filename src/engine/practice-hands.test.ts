import { describe, it, expect } from 'vitest';
import { getPracticeHand, getPracticeAiMelds, validatePracticeHand, validateAiMelds } from './practice-hands';
import type { PracticeScenarioId, PracticeHandSpec, PracticeMeldSpec, PracticeHandTile } from './practice-hands';
import type { Suit } from '../types';

describe('validatePracticeHand', () => {
  function makeHand(tiles: PracticeHandTile[]): PracticeHandSpec {
    const hand = tiles.slice(0, 13);
    return { hand, draw: tiles[13] ?? tiles[0] };
  }

  function makeTiles(n: number, suit: Suit = 'wan'): PracticeHandTile[] {
    return Array.from({ length: n }, (_, i) => ({
      suit,
      rank: (i % 9) + 1,
    }));
  }

  it('accepts valid 13-tile hand', () => {
    const spec = makeHand(makeTiles(14));
    expect(validatePracticeHand(spec)).toBeNull();
  });

  it('rejects hand with wrong tile count', () => {
    const spec = { hand: makeTiles(10), draw: { suit: 'wan' as any, rank: 1 } };
    const result = validatePracticeHand(spec);
    expect(result).not.toBeNull();
    expect(result).toContain('13');
  });

  it('rejects invalid suit', () => {
    const spec = {
      hand: Array.from({ length: 13 }, () => ({ suit: 'invalid' as any, rank: 1 })),
      draw: { suit: 'invalid' as any, rank: 1 },
    };
    const result = validatePracticeHand(spec);
    expect(result).not.toBeNull();
    expect(result).toContain('invalid suit');
  });

  it('rejects invalid rank', () => {
    const spec = {
      hand: Array.from({ length: 13 }, () => ({ suit: 'wan' as any, rank: 10 })),
      draw: { suit: 'wan' as any, rank: 10 },
    };
    const result = validatePracticeHand(spec);
    expect(result).not.toBeNull();
    expect(result).toContain('invalid rank');
  });

  it('rejects too many copies of same tile (>4)', () => {
    const hand: PracticeHandTile[] = [];
    for (let i = 0; i < 5; i++) hand.push({ suit: 'wan', rank: 1 });
    for (let i = 0; i < 8; i++) hand.push({ suit: 'tong', rank: 2 });
    const spec: PracticeHandSpec = { hand, draw: { suit: 'tiao', rank: 3 } };
    const result = validatePracticeHand(spec);
    expect(result).not.toBeNull();
    expect(result).toContain('too many copies');
  });

  it('allows up to 4 copies of same tile', () => {
    const hand: PracticeHandTile[] = [];
    for (let i = 0; i < 4; i++) hand.push({ suit: 'wan', rank: 1 });
    for (let i = 0; i < 4; i++) hand.push({ suit: 'wan', rank: 2 });
    for (let i = 0; i < 3; i++) hand.push({ suit: 'tong', rank: 3 });
    for (let i = 0; i < 2; i++) hand.push({ suit: 'tiao', rank: 4 });
    const spec: PracticeHandSpec = { hand, draw: { suit: 'tiao', rank: 5 } };
    expect(validatePracticeHand(spec)).toBeNull();
  });

  it('accepts null for random hands', () => {
    expect(validatePracticeHand(null)).toBeNull();
  });
});

describe('getPracticeHand', () => {
  const scenarios: PracticeScenarioId[] = [
    'standard-hand', 'one-away', 'mixed-suit', 'all-pong', 'defense', 'fast-game',
  ];

  it('returns null for standard-hand', () => {
    expect(getPracticeHand('standard-hand')).toBeNull();
  });

  it('returns null for fast-game', () => {
    expect(getPracticeHand('fast-game')).toBeNull();
  });

  it('returns hand spec for one-away', () => {
    const result = getPracticeHand('one-away');
    expect(result).not.toBeNull();
    expect(result!.hand).toHaveLength(13);
    expect(validatePracticeHand(result)).toBeNull();
  });

  it('returns hand spec for mixed-suit', () => {
    const result = getPracticeHand('mixed-suit');
    expect(result).not.toBeNull();
    expect(validatePracticeHand(result)).toBeNull();
  });

  it('returns hand spec for all-pong', () => {
    const result = getPracticeHand('all-pong');
    expect(result).not.toBeNull();
    expect(validatePracticeHand(result)).toBeNull();
  });

  it('returns hand spec for defense', () => {
    const result = getPracticeHand('defense');
    expect(result).not.toBeNull();
    expect(validatePracticeHand(result)).toBeNull();
  });
});

describe('getPracticeAiMelds', () => {
  it('returns melds array for defense scenario', () => {
    const melds = getPracticeAiMelds('defense');
    expect(melds).toBeDefined();
    expect(melds).toHaveLength(4);
    // Human player (index 0) has no meld
    expect(melds[0]).toBeNull();
    // AI players 1-3 have melds
    expect(melds[1]).not.toBeNull();
    expect(melds[1]!).toHaveLength(1);
    expect(melds[2]).not.toBeNull();
    expect(melds[3]).not.toBeNull();
  });

  it('returns empty melds array for non-defense scenarios', () => {
    for (const scenario of ['standard-hand', 'one-away', 'mixed-suit', 'all-pong', 'fast-game'] as PracticeScenarioId[]) {
      const melds = getPracticeAiMelds(scenario);
      expect(melds).toEqual([null, null, null, null]);
    }
  });

  it('validates defense melds are correct', () => {
    expect(validateAiMelds(getPracticeAiMelds('defense'))).toBeNull();
  });
});
