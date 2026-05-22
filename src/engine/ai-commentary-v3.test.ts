import {
  createCommentaryState,
  getAvailableLines,
  triggerCommentary,
  setExcitement,
  setGamePhase,
  switchPersonality,
  tickCooldowns,
  formatLine,
  PERSONALITIES,
  COMMENTARY_LINES,
  CommentaryState,
} from './ai-commentary-v3';

describe('AI Commentary V3', () => {
  describe('createCommentaryState', () => {
    test('creates default state with first personality', () => {
      const state = createCommentaryState();
      expect(state.personality).toBe(PERSONALITIES[0].id);
      expect(state.excitement).toBe(0);
      expect(state.lastLines).toEqual([]);
      expect(state.cooldowns).toEqual({});
      expect(state.gamePhase).toBe('early');
    });

    test('creates state with specified personality', () => {
      const state = createCommentaryState('professor-wong');
      expect(state.personality).toBe('professor-wong');
    });

    test('throws on unknown personality', () => {
      expect(() => createCommentaryState('nonexistent')).toThrow();
    });
  });

  describe('getAvailableLines', () => {
    test('returns lines matching trigger and personality', () => {
      const state = createCommentaryState('uncle-keung');
      const lines = getAvailableLines(state, 'discard');
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line.trigger).toBe('discard');
        expect(line.personality).toBe('uncle-keung');
      }
    });

    test('returns empty for unknown trigger', () => {
      const state = createCommentaryState('uncle-keung');
      const lines = getAvailableLines(state, 'nonexistent_event');
      expect(lines).toHaveLength(0);
    });

    test('filters by minExcitement', () => {
      const state = createCommentaryState('mad-dragon');
      // At excitement 0, only lines with minExcitement 0 should be available
      const lines = getAvailableLines(state, 'win');
      for (const line of lines) {
        expect(line.minExcitement).toBe(0);
      }
    });
  });

  describe('triggerCommentary', () => {
    test('returns a line and updated state', () => {
      const state = createCommentaryState('uncle-keung');
      const result = triggerCommentary(state, 'discard', { lang: 'en' });
      expect(result.line).toBeTruthy();
      expect(result.state.excitement).toBeGreaterThan(0);
      expect(result.state.lastLines.length).toBe(1);
    });

    test('sets cooldown on used line', () => {
      const state = createCommentaryState('uncle-keung');
      const result = triggerCommentary(state, 'discard', { lang: 'en' });
      const lineId = result.state.lastLines[0];
      expect(result.state.cooldowns[lineId]).toBeGreaterThan(0);
    });

    test('returns null line when no matching trigger', () => {
      const state = createCommentaryState('uncle-keung');
      const result = triggerCommentary(state, 'nonexistent', { lang: 'en' });
      expect(result.line).toBeNull();
    });

    test('uses context.seed for deterministic line selection', () => {
      const state1 = createCommentaryState('uncle-keung');
      const state2 = createCommentaryState('uncle-keung');
      const r1 = triggerCommentary(state1, 'discard', { lang: 'en', seed: 0 });
      const r2 = triggerCommentary(state2, 'discard', { lang: 'en', seed: 0 });
      expect(r1.line).toBe(r2.line);
    });

    test('excitement is capped at 1', () => {
      const state: CommentaryState = {
        ...createCommentaryState('mad-dragon'),
        excitement: 0.95,
      };
      const result = triggerCommentary(state, 'win', { lang: 'en' });
      expect(result.state.excitement).toBe(1);
    });
  });

  describe('setExcitement', () => {
    test('sets excitement level', () => {
      const state = createCommentaryState();
      const updated = setExcitement(state, 0.5);
      expect(updated.excitement).toBe(0.5);
    });

    test('clamps to [0, 1]', () => {
      const state = createCommentaryState();
      expect(setExcitement(state, 2).excitement).toBe(1);
      expect(setExcitement(state, -1).excitement).toBe(0);
    });
  });

  describe('switchPersonality', () => {
    test('switches personality and resets cooldowns', () => {
      let state = createCommentaryState('uncle-keung');
      // Trigger a line to add cooldown
      const triggered = triggerCommentary(state, 'discard', { lang: 'en' });
      state = triggered.state;
      expect(Object.keys(state.cooldowns).length).toBeGreaterThan(0);

      const switched = switchPersonality(state, 'mad-dragon');
      expect(switched.personality).toBe('mad-dragon');
      expect(switched.lastLines).toEqual([]);
      expect(switched.cooldowns).toEqual({});
    });

    test('throws on unknown personality', () => {
      expect(() => switchPersonality(createCommentaryState(), 'nobody')).toThrow();
    });
  });

  describe('tickCooldowns', () => {
    test('reduces cooldowns by elapsed time', () => {
      let state = createCommentaryState('uncle-keung');
      const triggered = triggerCommentary(state, 'discard', { lang: 'en' });
      state = triggered.state;

      const cooldownValue = Object.values(state.cooldowns)[0];
      const updated = tickCooldowns(state, cooldownValue - 1);
      expect(Object.values(updated.cooldowns)[0]).toBe(1);
    });

    test('removes expired cooldowns', () => {
      let state = createCommentaryState('uncle-keung');
      const triggered = triggerCommentary(state, 'discard', { lang: 'en' });
      state = triggered.state;

      const cooldownValue = Object.values(state.cooldowns)[0];
      const updated = tickCooldowns(state, cooldownValue + 1);
      expect(Object.keys(updated.cooldowns).length).toBe(0);
    });
  });

  describe('formatLine', () => {
    test('returns text for requested language', () => {
      const line = COMMENTARY_LINES[0];
      expect(formatLine(line, 'en')).toBeTruthy();
      expect(formatLine(line, 'zh-TW')).toBeTruthy();
      expect(formatLine(line, 'ja')).toBeTruthy();
    });

    test('falls back to English for unknown language', () => {
      const line = COMMENTARY_LINES[0];
      expect(formatLine(line, 'fr')).toBe(line.text.en);
    });
  });

  describe('PERSONALITIES', () => {
    test('all 5 personalities defined', () => {
      expect(PERSONALITIES).toHaveLength(5);
    });

    test('all IDs are unique', () => {
      const ids = PERSONALITIES.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('COMMENTARY_LINES', () => {
    test('has lines for all personalities', () => {
      const personalityIds = new Set(PERSONALITIES.map(p => p.id));
      for (const line of COMMENTARY_LINES) {
        expect(personalityIds.has(line.personality)).toBe(true);
      }
    });
  });
});
