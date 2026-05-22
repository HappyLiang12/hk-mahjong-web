import {
  createRoundState,
  advanceRound,
  isGameOver,
  getPlayerWind,
  getWindDisplay,
  WIND_ORDER,
  RoundState,
} from '../engine/wind-rounds';

describe('wind-rounds', () => {
  describe('createRoundState', () => {
    it('creates initial state with east wind and dealer 0', () => {
      const s = createRoundState();
      expect(s.prevailingWind).toBe('east');
      expect(s.dealerSeat).toBe(0);
      expect(s.dealerConsecutive).toBe(0);
      expect(s.roundNumber).toBe(1);
      expect(s.handNumber).toBe(1);
      expect(s.bonusSticks).toBe(0);
    });
  });

  describe('advanceRound — dealer wins', () => {
    it('keeps dealer, increments consecutive and bonus sticks', () => {
      const s = createRoundState();
      const next = advanceRound(s, true, false);
      expect(next.dealerSeat).toBe(0);
      expect(next.dealerConsecutive).toBe(1);
      expect(next.bonusSticks).toBe(1);
      expect(next.handNumber).toBe(1); // doesn't advance
      expect(next.roundNumber).toBe(2);
    });

    it('stacks consecutive dealer wins', () => {
      let s = createRoundState();
      s = advanceRound(s, true, false);
      s = advanceRound(s, true, false);
      expect(s.dealerConsecutive).toBe(2);
      expect(s.bonusSticks).toBe(2);
      expect(s.dealerSeat).toBe(0);
    });
  });

  describe('advanceRound — draw', () => {
    it('keeps dealer, increments bonus sticks, no hand advance', () => {
      const s = createRoundState();
      const next = advanceRound(s, false, true);
      expect(next.dealerSeat).toBe(0);
      expect(next.bonusSticks).toBe(1);
      expect(next.dealerConsecutive).toBe(0);
      expect(next.handNumber).toBe(1);
    });
  });

  describe('advanceRound — dealer loses', () => {
    it('rotates dealer, resets consecutive and bonus, advances hand', () => {
      const s = createRoundState();
      const next = advanceRound(s, false, false);
      expect(next.dealerSeat).toBe(1);
      expect(next.dealerConsecutive).toBe(0);
      expect(next.bonusSticks).toBe(0);
      expect(next.handNumber).toBe(2);
    });

    it('advances prevailing wind after 4 hands', () => {
      let s: RoundState = { ...createRoundState(), handNumber: 4, dealerSeat: 3 };
      const next = advanceRound(s, false, false);
      expect(next.prevailingWind).toBe('south');
      expect(next.handNumber).toBe(1);
      expect(next.dealerSeat).toBe(0); // wraps around
    });

    it('full rotation through all winds', () => {
      let s = createRoundState();
      // Play 16 hands (4 per wind), dealer always loses
      for (let i = 0; i < 16; i++) {
        s = advanceRound(s, false, false);
      }
      // After 16 dealer losses: should have cycled through all 4 winds
      // After east(4) → south, south(4) → west, west(4) → north, north(4) → overflow
      expect(s.prevailingWind).toBe('north');
      expect(s.handNumber).toBe(5); // overflow signals game over
    });
  });

  describe('isGameOver', () => {
    it('east_only: not over during east', () => {
      const s = createRoundState();
      expect(isGameOver(s, { roundWind: 'east_only' })).toBe(false);
    });

    it('east_only: over when wind advances to south', () => {
      const s: RoundState = { ...createRoundState(), prevailingWind: 'south', handNumber: 1 };
      expect(isGameOver(s, { roundWind: 'east_only' })).toBe(true);
    });

    it('east_south: over when wind reaches west', () => {
      const s: RoundState = { ...createRoundState(), prevailingWind: 'west', handNumber: 1 };
      expect(isGameOver(s, { roundWind: 'east_south' })).toBe(true);
    });

    it('east_south: not over during south', () => {
      const s: RoundState = { ...createRoundState(), prevailingWind: 'south', handNumber: 3 };
      expect(isGameOver(s, { roundWind: 'east_south' })).toBe(false);
    });

    it('full: over after north hand 5 (overflow)', () => {
      const s: RoundState = { ...createRoundState(), prevailingWind: 'north', handNumber: 5 };
      expect(isGameOver(s, { roundWind: 'full' })).toBe(true);
    });

    it('full: not over during north hand 4', () => {
      const s: RoundState = { ...createRoundState(), prevailingWind: 'north', handNumber: 4 };
      expect(isGameOver(s, { roundWind: 'full' })).toBe(false);
    });
  });

  describe('getPlayerWind', () => {
    it('dealer is always east', () => {
      expect(getPlayerWind(0, 0)).toBe('east');
      expect(getPlayerWind(2, 2)).toBe('east');
    });

    it('seats relative to dealer', () => {
      // Dealer is seat 1
      expect(getPlayerWind(1, 1)).toBe('east');
      expect(getPlayerWind(2, 1)).toBe('south');
      expect(getPlayerWind(3, 1)).toBe('west');
      expect(getPlayerWind(0, 1)).toBe('north');
    });
  });

  describe('getWindDisplay', () => {
    it('returns correct display for east', () => {
      const d = getWindDisplay('east');
      expect(d.char).toBe('東');
      expect(d.emoji).toBe('🀀');
      expect(d.en).toBe('East');
      expect(d['zh-TW']).toBe('東');
    });

    it('returns correct display for all winds', () => {
      for (const w of WIND_ORDER) {
        const d = getWindDisplay(w);
        expect(d.char).toBeTruthy();
        expect(d.emoji).toBeTruthy();
        expect(d.en).toBeTruthy();
      }
    });
  });
});
