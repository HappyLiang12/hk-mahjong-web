import { Tile, GameState, Player, Meld } from '../types';
import {
  isSafeTile,
  isDiscardedByOpponent,
  isDangerousOpponent,
  anyDangerousOpponent,
  getDangerousOpponents,
  safetyScore,
  safestDiscard,
} from './defense';

function t(suit: Tile['suit'], rank: number, id: number = 0): Tile {
  return { suit, rank, id };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    wall: [],
    players: [
      { hand: [], melds: [], discards: [], seatWind: 0 },
      { hand: [], melds: [], discards: [], seatWind: 1 },
      { hand: [], melds: [], discards: [], seatWind: 2 },
      { hand: [], melds: [], discards: [], seatWind: 3 },
    ],
    currentTurn: 0,
    prevailingWind: 0,
    lastDiscard: null,
    lastDiscardBy: null,
    phase: 'discard',
    ...overrides,
  };
}

describe('Defense Module', () => {
  describe('isSafeTile', () => {
    test('tile is safe when all 4 copies visible', () => {
      const gs = makeGameState();
      // Add 4 copies to players' discards
      gs.players[0].discards = [t('wan', 1, 0)];
      gs.players[1].discards = [t('wan', 1, 1)];
      gs.players[2].discards = [t('wan', 1, 2)];
      gs.players[3].discards = [t('wan', 1, 3)];
      expect(isSafeTile(t('wan', 1, 100), gs)).toBe(true);
    });

    test('tile is not safe when fewer than 4 visible', () => {
      const gs = makeGameState();
      gs.players[0].discards = [t('wan', 1, 0)];
      expect(isSafeTile(t('wan', 1, 100), gs)).toBe(false);
    });

    test('counts exposed melds', () => {
      const gs = makeGameState();
      gs.players[0].melds = [
        {
          type: 'pong',
          tiles: [t('wan', 5, 10), t('wan', 5, 11), t('wan', 5, 12)],
          concealed: false,
        },
      ];
      gs.players[0].discards = [t('wan', 5, 13)];
      expect(isSafeTile(t('wan', 5, 100), gs)).toBe(true);
    });

    test('ignores concealed melds', () => {
      const gs = makeGameState();
      gs.players[0].melds = [
        {
          type: 'kong',
          tiles: [t('wan', 5, 10), t('wan', 5, 11), t('wan', 5, 12), t('wan', 5, 13)],
          concealed: true,
        },
      ];
      expect(isSafeTile(t('wan', 5, 100), gs)).toBe(false);
    });
  });

  describe('isDiscardedByOpponent', () => {
    test('returns true if opponent discarded the tile', () => {
      const opponent: Player = {
        hand: [],
        melds: [],
        discards: [t('wan', 3, 0), t('tong', 7, 1)],
        seatWind: 1,
      };
      expect(isDiscardedByOpponent(t('wan', 3, 100), opponent)).toBe(true);
    });

    test('returns false if opponent did not discard the tile', () => {
      const opponent: Player = {
        hand: [],
        melds: [],
        discards: [t('wan', 3, 0)],
        seatWind: 1,
      };
      expect(isDiscardedByOpponent(t('wan', 5, 100), opponent)).toBe(false);
    });
  });

  describe('isDangerousOpponent', () => {
    test('opponent with 3+ exposed melds is dangerous', () => {
      const opponent: Player = {
        hand: [t('wan', 1, 0), t('wan', 1, 1)],
        melds: [
          { type: 'pong', tiles: [], concealed: false },
          { type: 'pong', tiles: [], concealed: false },
          { type: 'chow', tiles: [], concealed: false },
        ],
        discards: [],
        seatWind: 1,
      };
      expect(isDangerousOpponent(opponent)).toBe(true);
    });

    test('opponent with 2 melds and few hand tiles is dangerous', () => {
      const opponent: Player = {
        hand: [t('wan', 1, 0), t('wan', 1, 1), t('wan', 2, 2)],
        melds: [
          { type: 'pong', tiles: [], concealed: false },
          { type: 'chow', tiles: [], concealed: false },
        ],
        discards: [],
        seatWind: 1,
      };
      expect(isDangerousOpponent(opponent)).toBe(true);
    });

    test('opponent with 2 melds and many hand tiles is not dangerous', () => {
      const opponent: Player = {
        hand: Array(7).fill(t('wan', 1, 0)),
        melds: [
          { type: 'pong', tiles: [], concealed: false },
          { type: 'chow', tiles: [], concealed: false },
        ],
        discards: [],
        seatWind: 1,
      };
      expect(isDangerousOpponent(opponent)).toBe(false);
    });

    test('opponent with few melds is not dangerous', () => {
      const opponent: Player = {
        hand: Array(10).fill(t('wan', 1, 0)),
        melds: [
          { type: 'pong', tiles: [], concealed: false },
        ],
        discards: [],
        seatWind: 1,
      };
      expect(isDangerousOpponent(opponent)).toBe(false);
    });
  });

  describe('anyDangerousOpponent', () => {
    test('returns true when any opponent is dangerous', () => {
      const gs = makeGameState();
      gs.players[2].melds = [
        { type: 'pong', tiles: [], concealed: false },
        { type: 'pong', tiles: [], concealed: false },
        { type: 'pong', tiles: [], concealed: false },
      ];
      gs.players[2].hand = [t('wan', 1, 0), t('wan', 1, 1)];
      expect(anyDangerousOpponent(gs, 0)).toBe(true);
    });

    test('returns false when no opponent is dangerous', () => {
      const gs = makeGameState();
      expect(anyDangerousOpponent(gs, 0)).toBe(false);
    });
  });

  describe('getDangerousOpponents', () => {
    test('returns list of dangerous opponent indices', () => {
      const gs = makeGameState();
      gs.players[1].melds = [
        { type: 'pong', tiles: [], concealed: false },
        { type: 'pong', tiles: [], concealed: false },
        { type: 'pong', tiles: [], concealed: false },
      ];
      gs.players[1].hand = [t('wan', 1, 0), t('wan', 1, 1)];
      const dangerous = getDangerousOpponents(gs, 0);
      expect(dangerous).toContain(1);
      expect(dangerous).not.toContain(0);
    });

    test('does not include self', () => {
      const gs = makeGameState();
      // Make all players dangerous
      for (let i = 0; i < 4; i++) {
        gs.players[i].melds = [
          { type: 'pong', tiles: [], concealed: false },
          { type: 'pong', tiles: [], concealed: false },
          { type: 'pong', tiles: [], concealed: false },
        ];
        gs.players[i].hand = [t('wan', 1, 0)];
      }
      const dangerous = getDangerousOpponents(gs, 0);
      expect(dangerous).not.toContain(0);
      expect(dangerous.length).toBe(3);
    });
  });

  describe('safetyScore', () => {
    test('perfectly safe tile scores 100', () => {
      const gs = makeGameState();
      for (let i = 0; i < 4; i++) {
        gs.players[i].discards = [t('wan', 1, i)];
      }
      expect(safetyScore(t('wan', 1, 100), gs, 0)).toBe(100);
    });

    test('visible copies increase score', () => {
      const gs = makeGameState();
      gs.players[0].discards = [t('wan', 1, 0), t('wan', 1, 1)];
      const score = safetyScore(t('wan', 1, 100), gs, 0);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });
  });

  describe('safestDiscard', () => {
    test('returns the safest tile', () => {
      const gs = makeGameState();
      // Make wan-1 safer (more visible)
      for (let i = 0; i < 3; i++) {
        gs.players[i].discards = [t('wan', 1, i)];
      }
      // wan-5 has no visible copies
      const candidates = [t('wan', 5, 10), t('wan', 1, 11)];
      const safest = safestDiscard(candidates, gs, 0);
      expect(safest.suit).toBe('wan');
      expect(safest.rank).toBe(1); // wan-1 is safer
    });

    test('throws on empty candidates', () => {
      const gs = makeGameState();
      expect(() => safestDiscard([], gs, 0)).toThrow();
    });

    test('returns first candidate when only one', () => {
      const gs = makeGameState();
      const result = safestDiscard([t('wan', 1, 0)], gs, 0);
      expect(result.suit).toBe('wan');
      expect(result.rank).toBe(1);
    });
  });
});
