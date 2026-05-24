import { create } from 'zustand';
import type { GameState, Tile, ActionType, ScoreResult, Phase } from '../types';
import type { ClaimIntent } from '../engine/turns';
import {
  initGame, drawTile, discardTile, getLegalClaims,
  executeClaim, advanceTurn, checkWin, canWinWithTile,
  calculateScore, createRoundState, advanceRound,
} from '../engine';
import { requestHint, createHintState } from '../engine/hint-system';
import type { HintResult, HintState } from '../engine/hint-system';
import { getPracticeHand, getPracticeAiMelds } from '../engine/practice-hands';
import type { PracticeScenarioId, PracticeHandSpec } from '../engine/practice-hands';
import type { InitGameOptions } from '../engine/game';
import type { RoundState, WinType } from '../engine';

export type AiDifficulty = 'easy' | 'normal' | 'hard';
export type GameSpeed = 'slow' | 'normal' | 'fast';
export type GameMode = 'standard' | 'practice';

export const SPEED_CONFIG: Record<GameSpeed, { aiThinkTime: number; animationMultiplier: number }> = {
  slow: { aiThinkTime: 2000, animationMultiplier: 1.5 },
  normal: { aiThinkTime: 800, animationMultiplier: 1.0 },
  fast: { aiThinkTime: 200, animationMultiplier: 0.5 },
};

export interface ClaimOption {
  type: 'chow' | 'pong' | 'kong' | 'win';
  handTiles?: Tile[];
}

export interface ReplayRecorder {
  record: (action: {
    turn: number;
    player: number;
    type: string;
    tile?: { suit: string; rank: number };
  }) => void;
  getReplay: () => {
    actions: { turn: number; player: number; type: string; tile?: { suit: string; rank: number } }[];
    initialState: { wall: { suit: string; rank: number }[]; hands: { suit: string; rank: number }[][]; dealer: number; roundWind: number } | null;
  };
  reset: () => void;
  setInitialState: (state: { wall: { suit: string; rank: number }[]; hands: { suit: string; rank: number }[][]; dealer: number; roundWind: number }) => void;
  setResult: (result: { winner: number | null; score: number; fan: number; pattern: string }) => void;
}

export interface GameStoreState {
  game: GameState | null;
  phase: Phase | null;
  currentTurn: number;
  selectedTileId: number | null;
  claimOptions: ClaimOption[];
  scoreResult: ScoreResult | null;
  winnerId: number | null;
  isDraw: boolean;
  isSelfDrawn: boolean;
  roundState: RoundState;
  replayRecorder: ReplayRecorder;

  aiDifficulty: AiDifficulty;
  gameSpeed: GameSpeed;
  aiDelay: number;
  flowerTiles: boolean;

  // P1: Practice mode initialization
  gameMode: GameMode;
  allowUndo: boolean;
  showHints: boolean;

  // P2: WebGL recovery
  webglLost: boolean;

  // P4: Hint system
  hintState: HintState | null;
  lastHintResult: HintResult | null;
  highlightedHintTileId: number | null;
  hintToastText: string | null;

  // Practice hands
  practiceScenario: PracticeScenarioId | null;

  newGame: () => void;
  selectTile: (tileId: number) => void;
  confirmDiscard: () => void;
  claimAction: (type: ActionType) => void;
  passAction: () => void;
  runAITurn: () => void;
  resolveWin: () => void;
  advanceRoundAction: (dealerWon: boolean, isDraw: boolean) => void;
  setGameSpeed: (speed: GameSpeed) => void;
  setAiDifficulty: (difficulty: AiDifficulty) => void;
  setFlowerTiles: (enabled: boolean) => void;
  setGameMode: (mode: GameMode) => void;
  setPracticeScenario: (scenario: PracticeScenarioId | null) => void;
  requestHintAction: () => void;
}

// ── ReplayRecorder factory ──

function createFullReplayRecorder(): ReplayRecorder {
  let actions: { turn: number; player: number; type: string; tile?: { suit: string; rank: number } }[] = [];
  let initialState: { wall: { suit: string; rank: number }[]; hands: { suit: string; rank: number }[][]; dealer: number; roundWind: number } | null = null;
  let result: { winner: number | null; score: number; fan: number; pattern: string } = { winner: null, score: 0, fan: 0, pattern: '' };

  return {
    record(action) { actions.push(action); },
    getReplay() { return { actions: [...actions], initialState }; },
    reset() {
      actions = [];
      initialState = null;
      result = { winner: null, score: 0, fan: 0, pattern: '' };
    },
    setInitialState(state) { initialState = state; },
    setResult(r) { result = r; },
  };
}

// ── Helper types ──

type SetFn = (partial: Partial<GameStoreState>) => void;
type GetFn = () => GameStoreState;

// ── Claim priority helpers ──

function getTypePriority(type: string): number {
  if (type === 'win') return 3;
  if (type === 'pong' || type === 'kong') return 2;
  if (type === 'chow') return 1;
  return 0;
}

function getOptionPriority(option: ClaimOption): number {
  return option.type === 'win' ? 3 : (option.type === 'pong' || option.type === 'kong') ? 2 : 1;
}

function getMaxClaimPriority(claims: ClaimIntent[]): number {
  return claims.reduce((max, c) => Math.max(max, getTypePriority(c.type)), 0);
}

function getMaxOptionPriority(options: ClaimOption[]): number {
  return options.reduce((max, o) => Math.max(max, getOptionPriority(o)), 0);
}

function resolveBestClaim(claims: ClaimIntent[], discardBy: number): ClaimIntent | null {
  if (claims.length === 0) return null;
  return claims.reduce((best, c) => {
    const bp = getTypePriority(best.type);
    const cp = getTypePriority(c.type);
    if (cp > bp) return c;
    if (cp === bp) {
      const bestDist = (best.playerId - discardBy + 4) % 4;
      const cDist = (c.playerId - discardBy + 4) % 4;
      if (cDist < bestDist) return c;
    }
    return best;
  });
}

// ── endRound ──

function endRound(prevGet: GetFn, set: SetFn, winnerId: number | null, isSelfDrawn: boolean): void {
  const state = prevGet();
  const { game, replayRecorder } = state;
  if (!game) return;

  game.phase = 'end';

  if (winnerId !== null) {
    const winner = game.players[winnerId];
    const selfDrawn = isSelfDrawn || game.lastDiscard === null;
    const winType = checkWin(winner);
    const result = calculateScore(winner, game, selfDrawn, winType || 'standard');

    replayRecorder.setResult({
      winner: winnerId,
      score: result.payment,
      fan: result.faan,
      pattern: winType || 'standard',
    });

    set({
      game: { ...game },
      phase: 'end',
      scoreResult: result,
      winnerId,
      isDraw: false,
      isSelfDrawn: selfDrawn,
    });
  } else {
    replayRecorder.setResult({ winner: null, score: 0, fan: 0, pattern: 'draw' });
    set({
      game: { ...game },
      phase: 'end',
      scoreResult: null,
      winnerId: null,
      isDraw: true,
      isSelfDrawn: false,
    });
  }
}

// ── AI claim collection ──

function collectAiClaims(game: GameState, _difficulty: AiDifficulty): ClaimIntent[] {
  if (!game.lastDiscard || game.lastDiscardBy === null) return [];

  const claims: ClaimIntent[] = [];
  const legal = getLegalClaims(game);

  for (const c of legal) {
    if (c.playerId !== 0) claims.push(c);
  }

  for (let i = 1; i <= 3; i++) {
    if (i === game.lastDiscardBy) continue;
    if (canWinWithTile(game.players[i], game.lastDiscard)) {
      if (!claims.some(c => c.playerId === i && c.type === 'win')) {
        claims.push({ playerId: i, type: 'win' });
      }
    }
  }

  return claims;
}

function getPlayerClaimOptions(game: GameState): ClaimOption[] {
  if (!game.lastDiscard || game.lastDiscardBy === 0) return [];

  const claims = getLegalClaims(game);
  const playerClaims = claims.filter(c => c.playerId === 0);

  const player = game.players[0];
  if (canWinWithTile(player, game.lastDiscard)) {
    playerClaims.push({ playerId: 0, type: 'win' });
  }

  return playerClaims.map(c => ({ type: c.type, handTiles: c.handTiles }));
}

// ── AI claim resolution ──

function resolveAiClaims(prevState: GameStoreState, set: SetFn): 'continue' | 'stop' {
  const { game, aiDifficulty } = prevState;
  if (!game || game.phase !== 'claim') return 'stop';

  if (!game.lastDiscard || game.lastDiscardBy === null) {
    advanceTurn(game);
    set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });
    return 'continue';
  }

  const aiClaims = collectAiClaims(game, aiDifficulty);

  if (aiClaims.length > 0) {
    const best = resolveBestClaim(aiClaims, game.lastDiscardBy);
    if (best) {
      if (best.type === 'win') {
        executeClaim(game, best);
        set({ game: { ...game }, phase: game.phase });
        return 'stop'; // caller handles endRound
      }
      const success = executeClaim(game, best);
      set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });
      if (!success) {
        advanceTurn(game);
        // advanceTurn always sets phase='draw' — wall exhaustion caught in drawTile
        set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });
        return 'continue';
      }
      if (game.currentTurn !== 0) return 'continue';
      return 'stop';
    }
  }

  // No claims — advance
  advanceTurn(game);
  set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });
  return 'continue';
}

// ── Claim phase processing ──

function processClaimPhase(prevState: GameStoreState, set: SetFn, get: GetFn): void {
  const { game } = prevState;
  if (!game || game.phase !== 'claim') return;

  if (game.lastDiscardBy === 0) {
    const signal = resolveAiClaims(prevState, set);
    if (signal === 'continue') processAiTurnSync(get(), set, get);
    return;
  }

  const playerOptions = getPlayerClaimOptions(game);
  const aiClaims = collectAiClaims(game, prevState.aiDifficulty);
  const bestAiPriority = getMaxClaimPriority(aiClaims);
  const bestPlayerPriority = getMaxOptionPriority(playerOptions);

  if (bestPlayerPriority >= bestAiPriority && playerOptions.length > 0) {
    const filtered = playerOptions.filter(o => getOptionPriority(o) >= bestAiPriority);
    if (filtered.length > 0) {
      set({ claimOptions: filtered });
      (get as any)._pendingAiClaims = aiClaims;
      return;
    }
  }

  if (aiClaims.length > 0) {
    const best = resolveBestClaim(aiClaims, game.lastDiscardBy!);
    if (best) {
      if (best.type === 'win') {
        executeClaim(game, best);
        set({ game: { ...game }, phase: game.phase });
        endRound(get, set, best.playerId, false);
        return;
      }
      const success = executeClaim(game, best);
      set({ game: { ...game }, phase: game.phase });
      if (!success) {
        advanceTurn(game);
        processAiTurnSync(get(), set, get);
        return;
      }
      if (game.currentTurn !== 0) {
        processAiTurnSync(get(), set, get);
      }
      return;
    }
  }

  // No claims
  advanceTurn(game);
  set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });
  processAiTurnSync(get(), set, get);
}

// ── AI turn processing ──

function processClaimPhaseFromAi(curState: GameStoreState, set: SetFn, get: GetFn): 'continue' | 'stop' {
  const { game, aiDifficulty } = curState;
  if (!game || game.phase !== 'claim') return 'stop';

  if (game.lastDiscardBy === 0) {
    return resolveAiClaims(curState, set);
  }

  const playerOptions = getPlayerClaimOptions(game);
  const aiClaims = collectAiClaims(game, aiDifficulty);
  const bestAiPriority = getMaxClaimPriority(aiClaims);
  const bestPlayerPriority = getMaxOptionPriority(playerOptions);

  if (bestPlayerPriority >= bestAiPriority && playerOptions.length > 0) {
    const filtered = playerOptions.filter(o => getOptionPriority(o) >= bestAiPriority);
    if (filtered.length > 0) {
      set({ claimOptions: filtered });
      return 'stop';
    }
  }

  if (aiClaims.length > 0) {
    const best = resolveBestClaim(aiClaims, game.lastDiscardBy!);
    if (best) {
      if (best.type === 'win') {
        executeClaim(game, best);
        set({ game: { ...game }, phase: game.phase });
        endRound(get, set, best.playerId, false);
        return 'stop';
      }
      executeClaim(game, best);
      set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });
      if (game.currentTurn !== 0) return 'continue';
      return 'stop';
    }
  }

  advanceTurn(game);
  set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });
  return 'continue';
}

// ── AI recursion depth guard (P1) ──

let aiRecursionDepth = 0;
const AI_MAX_RECURSION_DEPTH = 50;

function processAiTurnSync(state: GameStoreState, set: SetFn, get: GetFn): void {
  aiRecursionDepth++;
  try {
    _processAiTurnSync(state, set, get);
  } finally {
    aiRecursionDepth--;
  }
}

function _processAiTurnSync(state: GameStoreState, set: SetFn, get: GetFn): void {
  const { game, aiDelay } = state;
  if (!game) return;

  // P1: Recursion depth safety guard
  if (aiRecursionDepth > AI_MAX_RECURSION_DEPTH) {
    console.error('processAiTurnSync: recursion depth limit reached (', aiRecursionDepth, ')');
    endRound(get, set, null, false);
    return;
  }

  const MAX_ITERATIONS = 200;
  let safetyCounter = 0;

  // If player's draw phase, draw for them
  if (game.currentTurn === 0 && game.phase === 'draw') {
    const drawn = drawTile(game);
    if (!drawn) {
      endRound(get, set, null, false);
      return;
    }
    const p = game.players[0];
    if (checkWin(p)) {
      set({
        game: { ...game },
        phase: game.phase,
        currentTurn: game.currentTurn,
        claimOptions: [{ type: 'win' }, { type: 'pass' as any }],
      });
      return;
    }
    set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });
    return;
  }

  while (game.currentTurn !== 0 && game.phase !== 'end') {
    if (++safetyCounter > MAX_ITERATIONS) {
      console.error('processAiTurnSync: safety limit reached');
      endRound(get, set, null, false);
      return;
    }

    const pid = game.currentTurn;

    if (game.phase === 'draw') {
      const drawn = drawTile(game);
      if (!drawn) {
        endRound(get, set, null, false);
        return;
      }
      const p = game.players[pid];
      if (checkWin(p)) {
        game.phase = 'end';
        endRound(get, set, pid, true);
        return;
      }
    }

    if (game.phase === 'discard') {
      const player = game.players[pid];
      if (player.hand.length > 0) {
        const discardIdx = player.hand.length - 1;
        discardTile(game, player.hand[discardIdx].id);
      }
      set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });

      // After discard, phase is now 'claim' (set by discardTile)
      const curPhase = game.phase as Phase;
      if (curPhase === 'claim') {
        const signal = processClaimPhaseFromAi(get(), set, get);
        if (signal === 'stop') return;
        continue;
      }
    }
  }

  set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });

  // If player's draw phase
  if (game.currentTurn === 0 && game.phase === 'draw') {
    const drawn = drawTile(game);
    if (!drawn) {
      endRound(get, set, null, false);
      return;
    }
    const p = game.players[0];
    if (checkWin(p)) {
      set({
        game: { ...game },
        phase: game.phase,
        currentTurn: game.currentTurn,
        claimOptions: [{ type: 'win' }, { type: 'pass' as any }],
      });
      return;
    }
    set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });
  }
}

// ── Store ──

export const useGameStore = create<GameStoreState>((set, get) => ({
  game: null,
  phase: null,
  currentTurn: 0,
  selectedTileId: null,
  claimOptions: [],
  scoreResult: null,
  winnerId: null,
  isDraw: false,
  isSelfDrawn: false,
  roundState: createRoundState(),
  replayRecorder: createFullReplayRecorder(),
  aiDifficulty: 'normal',
  gameSpeed: 'normal',
  aiDelay: SPEED_CONFIG.normal.aiThinkTime,
  flowerTiles: false,

  // P1: Practice mode fields
  gameMode: 'standard',
  allowUndo: false,
  showHints: false,

  // P2: WebGL recovery
  webglLost: false,

  // P4: Hint system
  hintState: null,
  lastHintResult: null,
  highlightedHintTileId: null,
  hintToastText: null,

  // Practice hands
  practiceScenario: null,

  newGame: () => {
    const st = get();
    const isPractice = st.gameMode === 'practice';

    // P1+P5: explicit assignments for practice flags (no leaks)
    const allowUndo = isPractice;
    const showHints = isPractice;
    const aiDifficulty: AiDifficulty = isPractice ? 'easy' : st.aiDifficulty;

    // Practice hands: build InitGameOptions when scenario has curated hands
    const scenario = isPractice ? st.practiceScenario : null;
    let initOptions: InitGameOptions = { flowers: st.flowerTiles };

    if (scenario) {
      const scenarioHand = getPracticeHand(scenario);
      if (scenarioHand) {
        // Build player hand (13 + 1 draw) → dealer gets 14
        const playerTiles = [...scenarioHand.hand, scenarioHand.draw];
        const hands: (typeof playerTiles | null)[] = [playerTiles, null, null, null];
        initOptions.hands = hands;

        // Get AI melds from the scenario
        const aiMelds = getPracticeAiMelds(scenario);
        if (aiMelds.some(m => m !== null)) {
          initOptions.melds = [...aiMelds]; // copy: [human, ai1, ai2, ai3]
        }
      }
    }

    const game = initGame(0, 0, initOptions);

    // P1+P5: reset gameMode to standard after applying (prevents sticky practice state)
    // But keep allowUndo/showHints/aiDifficulty as set above for the current game

    const recorder = createFullReplayRecorder();
    recorder.setInitialState({
      wall: game.wall.map(t => ({ suit: t.suit, rank: t.rank })),
      hands: game.players.map(p => p.hand.map(t => ({ suit: t.suit, rank: t.rank }))),
      dealer: 0,
      roundWind: game.prevailingWind,
    });

    set({
      game,
      phase: game.phase,
      currentTurn: game.currentTurn,
      selectedTileId: null,
      claimOptions: [],
      scoreResult: null,
      winnerId: null,
      isDraw: false,
      isSelfDrawn: false,
      replayRecorder: recorder,
      // P1+P5: explicit practice flag assignments
      allowUndo,
      showHints,
      aiDifficulty,
      gameMode: 'standard',
      // P2: reset WebGL state
      webglLost: false,
      // P4: init hint state for practice mode
      hintState: showHints ? createHintState('practice', false) : null,
      lastHintResult: null,
      highlightedHintTileId: null,
      hintToastText: null,
    });
  },

  selectTile: (tileId: number) => {
    const { game, selectedTileId, hintToastText } = get();
    if (!game || game.currentTurn !== 0 || game.phase !== 'discard') return;

    // P4: clear hint highlight when user clicks any tile
    if (hintToastText || get().highlightedHintTileId !== null) {
      set({ highlightedHintTileId: null, hintToastText: null });
    }

    if (selectedTileId === tileId) {
      get().confirmDiscard();
    } else {
      set({ selectedTileId: tileId });
    }
  },

  confirmDiscard: () => {
    const { game, selectedTileId, replayRecorder } = get();
    if (!game || selectedTileId === null) return;
    if (game.currentTurn !== 0 || game.phase !== 'discard') return;

    const tile = discardTile(game, selectedTileId);
    if (!tile) return;

    replayRecorder.record({
      turn: game.currentTurn,
      player: 0,
      type: 'discard',
      tile: { suit: tile.suit, rank: tile.rank },
    });

    // P4: clear hint state on discard
    set({
      game: { ...game },
      phase: game.phase,
      selectedTileId: null,
      highlightedHintTileId: null,
      hintToastText: null,
    });

    const state = get();
    processClaimPhase(state, set, get);
  },

  claimAction: (type: ActionType) => {
    const { game, claimOptions, replayRecorder } = get();
    if (!game) return;

    // Self-draw win
    if (type === 'win' && game.phase === 'discard' && game.currentTurn === 0) {
      set({ claimOptions: [] });
      endRound(get, set, 0, true);
      return;
    }

    // Self-draw pass
    if (type === 'pass' && game.phase === 'discard' && game.currentTurn === 0) {
      set({ claimOptions: [] });
      return;
    }

    if (game.phase !== 'claim') return;
    if (!game.lastDiscard || game.lastDiscardBy === null) return;

    if (type === 'win') {
      const claim: ClaimIntent = { playerId: 0, type: 'win' };
      executeClaim(game, claim);
      set({ game: { ...game }, phase: game.phase, claimOptions: [] });
      endRound(get, set, 0, false);
      return;
    }

    const matchingOption = claimOptions.find(o => o.type === type);
    const claim: ClaimIntent = {
      playerId: 0,
      type: type as 'chow' | 'pong' | 'kong',
      handTiles: matchingOption?.handTiles,
    };
    const success = executeClaim(game, claim);
    set({ game: { ...game }, phase: game.phase, claimOptions: [] });

    if (success) {
      replayRecorder.record({ turn: game.currentTurn, player: 0, type });
    }

    if (!success) {
      const s = get();
      const sig = resolveAiClaims(s, set);
      if (sig === 'continue') processAiTurnSync(s, set, get);
      return;
    }
  },

  passAction: () => {
    const { game } = get();
    if (!game || game.phase !== 'claim') return;
    set({ claimOptions: [] });

    const state = get();
    const signal = resolveAiClaims(state, set);
    if (signal === 'continue') processAiTurnSync(state, set, get);
  },

  runAITurn: () => {
    const state = get();
    processAiTurnSync(state, set, get);
  },

  resolveWin: () => {
    const { game, winnerId } = get();
    if (!game || winnerId === null) return;

    const winner = game.players[winnerId];
    const selfDrawn = game.lastDiscard === null;
    const winType = checkWin(winner);
    const result = calculateScore(winner, game, selfDrawn, winType || 'standard');

    set({ scoreResult: result, isSelfDrawn: selfDrawn });
  },

  advanceRoundAction: (dealerWon: boolean, isDraw: boolean) => {
    const next = advanceRound(get().roundState, dealerWon, isDraw);
    set({ roundState: next });
  },

  setGameSpeed: (speed: GameSpeed) => {
    const cfg = SPEED_CONFIG[speed];
    set({ gameSpeed: speed, aiDelay: cfg.aiThinkTime });
  },

  setAiDifficulty: (difficulty: AiDifficulty) => set({ aiDifficulty: difficulty }),

  setFlowerTiles: (enabled: boolean) => set({ flowerTiles: enabled }),

  // P1+P5: setGameMode resets practice-only flags
  setGameMode: (mode: GameMode) => {
    const isPractice = mode === 'practice';
    set({
      gameMode: mode,
      allowUndo: isPractice,
      showHints: isPractice,
    });
  },

  // Practice hands: set scenario
  setPracticeScenario: (scenario: PracticeScenarioId | null) => set({ practiceScenario: scenario }),

  // P4: Request hint
  requestHintAction: () => {
    const state = get();
    // P7: debug logging
    const { game: g, hintState: hs } = state;
    console.debug('[Hint] requestHintAction called', {
      phase: g?.phase,
      currentTurn: g?.currentTurn,
      hintsRemaining: hs ? (hs.isUnlimited ? 'unlimited' : hs.maxHintsPerGame - hs.hintsUsedThisGame) : 'null',
    });
    const { game, hintState } = state;
    if (!game || !hintState) {
      console.debug('[Hint] requestHintAction: no game or no hintState');
      return;
    }
    if (game.currentTurn !== 0 || game.phase !== 'discard') {
      console.debug('[Hint] requestHintAction: not human discard phase', { currentTurn: game.currentTurn, phase: game.phase });
      return;
    }

    const player = game.players[0];
    const discards = game.players.flatMap(p => p.discards);
    const melds = game.players.flatMap(p => p.melds.map(m => m.tiles).flat());

    const hintResult = requestHint(
      hintState,
      player.hand,
      discards,
      melds,
      [],
    );

    if (!hintResult) return;

    const suggestedTileId = hintResult.result.suggestion.tile.id;

    set({
      lastHintResult: hintResult.result,
      highlightedHintTileId: suggestedTileId,
      hintToastText: hintResult.result.reasonText,
      hintState: hintResult.newState,
    });
  },
}));
