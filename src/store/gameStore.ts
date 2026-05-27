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

  // FSM
  aiFsm: AiFsmState;

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
  handleAiTimeout: () => void;
  cancelAiFsm: () => void;
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

type AiStep = 'IDLE' | 'THINKING' | 'DRAW' | 'DISCARD' | 'CLAIM_CHECK' | 'NEXT_PLAYER' | 'DONE';

interface AiFsmState {
  aiStep: AiStep;
  aiStepCount: number;
  aiStartTime: number;
}

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
    if (signal === 'continue') startAiTurn(get, set);
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
        startAiTurn(get, set);
        return;
      }
      if (game.currentTurn !== 0) {
        startAiTurn(get, set);
      }
      return;
    }
  }

  // No claims
  advanceTurn(game);
  set({ game: { ...game }, phase: game.phase, currentTurn: game.currentTurn });
  startAiTurn(get, set);
}

// ── AI FSM tick ──

function tickAiFsm(get: GetFn, set: SetFn): void {
  const state = get();
  const { game, aiFsm: fsm } = state;

  if (!game || game.phase === 'end') {
    set({ aiFsm: { ...fsm, aiStep: 'DONE' } });
    return;
  }

  if (fsm.aiStepCount > 100) {
    console.error('tickAiFsm: step limit exceeded');
    set({ aiFsm: { ...fsm, aiStep: 'DONE' } });
    return;
  }

  if (Date.now() - fsm.aiStartTime > 30000) {
    console.error('tickAiFsm: timeout after', Date.now() - fsm.aiStartTime, 'ms');
    set({ aiFsm: { ...fsm, aiStep: 'DONE' } });
    return;
  }

  switch (fsm.aiStep) {
    case 'THINKING': {
      const delay = state.aiDelay;
      setTimeout(() => {
        const s = get();
        if (s.aiFsm.aiStep !== 'THINKING') return;
        set({ aiFsm: { aiStep: 'DRAW', aiStepCount: s.aiFsm.aiStepCount + 1, aiStartTime: s.aiFsm.aiStartTime } });
        tickAiFsm(get, set);
      }, delay);
      break;
    }

    case 'DRAW': {
      if (game.currentTurn === 0) {
        set({ aiFsm: { ...fsm, aiStep: 'DONE' } });
        return;
      }
      if (game.phase === 'draw') {
        const g = get().game!;
        const drawn = drawTile(g);
        if (!drawn) {
          endRound(get, set, null, false);
          set({ aiFsm: { ...get().aiFsm, aiStep: 'DONE' } });
          return;
        }
        const pid = g.currentTurn;
        const p = g.players[pid];
        if (checkWin(p)) {
          g.phase = 'end';
          endRound(get, set, pid, true);
          set({ aiFsm: { ...get().aiFsm, aiStep: 'DONE' } });
          return;
        }
      }
      set({ aiFsm: { aiStep: 'DISCARD', aiStepCount: fsm.aiStepCount + 1, aiStartTime: fsm.aiStartTime } });
      setTimeout(() => tickAiFsm(get, set), 0);
      break;
    }

    case 'DISCARD': {
      const g = get().game!;
      if (g.currentTurn === 0 || g.phase !== 'discard') {
        set({ aiFsm: { ...fsm, aiStep: 'DONE' } });
        return;
      }
      const pid = g.currentTurn;
      const player = g.players[pid];
      if (player.hand.length > 0) {
        const discardIdx = player.hand.length - 1;
        discardTile(g, player.hand[discardIdx].id);
      }
      set({ game: { ...g }, phase: g.phase, currentTurn: g.currentTurn });
      set({ aiFsm: { aiStep: 'CLAIM_CHECK', aiStepCount: fsm.aiStepCount + 1, aiStartTime: fsm.aiStartTime } });
      setTimeout(() => tickAiFsm(get, set), 0);
      break;
    }

    case 'CLAIM_CHECK': {
      const g = get().game!;
      if (g.phase === 'claim') {
        const signal = resolveAiClaims(get(), set);
        const fresh = get().game!;
        set({ game: { ...fresh }, phase: fresh.phase, currentTurn: fresh.currentTurn });
        if (signal === 'stop') {
          if (fresh.phase === 'end') {
            endRound(get, set, fresh.currentTurn, false);
          }
          set({ aiFsm: { ...get().aiFsm, aiStep: 'DONE' } });
          return;
        }
      }
      set({ aiFsm: { aiStep: 'NEXT_PLAYER', aiStepCount: fsm.aiStepCount + 1, aiStartTime: fsm.aiStartTime } });
      setTimeout(() => tickAiFsm(get, set), 0);
      break;
    }

    case 'NEXT_PLAYER': {
      const s = get();
      if (!s.game || s.game.phase === 'end') {
        set({ aiFsm: { ...s.aiFsm, aiStep: 'DONE' } });
        return;
      }
      if (s.game.currentTurn === 0 && s.game.phase === 'draw') {
        set({ aiFsm: { ...s.aiFsm, aiStep: 'DONE' } });
        return;
      }
      if (s.game.currentTurn !== 0) {
        set({ aiFsm: { aiStep: 'THINKING', aiStepCount: s.aiFsm.aiStepCount + 1, aiStartTime: s.aiFsm.aiStartTime } });
        setTimeout(() => tickAiFsm(get, set), 0);
        return;
      }
      set({ aiFsm: { ...s.aiFsm, aiStep: 'DONE' } });
      break;
    }

    case 'DONE':
    default:
      break;
  }
}

// ── AI turn entry point ──

function startAiTurn(get: GetFn, set: SetFn): void {
  const state = get();
  const { game } = state;

  if (!game || game.phase === 'end') return;

  // Human draw phase
  if (game.currentTurn === 0 && game.phase === 'draw') {
    const g = get().game!;
    const drawn = drawTile(g);
    if (!drawn) {
      endRound(get, set, null, false);
      return;
    }
    const p = g.players[0];
    if (checkWin(p)) {
      set({
        game: { ...g },
        phase: g.phase,
        currentTurn: g.currentTurn,
        claimOptions: [{ type: 'win' }, { type: 'pass' as any }],
      });
      return;
    }
    set({ game: { ...g }, phase: g.phase, currentTurn: g.currentTurn });
    return;
  }

  if (game.currentTurn === 0) return;

  set({ aiFsm: { aiStep: 'THINKING', aiStepCount: 0, aiStartTime: Date.now() } });
  Promise.resolve().then(() => tickAiFsm(get, set));
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

  // FSM
  aiFsm: { aiStep: 'IDLE', aiStepCount: 0, aiStartTime: 0 },

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

    // P6: verify practice mode initialization
    if (isPractice) {
      console.debug('[Store] newGame in practice mode', { allowUndo, showHints, aiDifficulty, scenario: st.practiceScenario });
    }

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
      aiFsm: { aiStep: 'IDLE', aiStepCount: 0, aiStartTime: 0 },
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
      if (sig === 'continue') startAiTurn(get, set);
      return;
    }
  },

  passAction: () => {
    const { game } = get();
    if (!game || game.phase !== 'claim') return;
    set({ claimOptions: [] });

    const state = get();
    const signal = resolveAiClaims(state, set);
    if (signal === 'continue') startAiTurn(get, set);
  },

  runAITurn: () => {
    startAiTurn(get, set);
  },

  handleAiTimeout: () => {
    Promise.resolve().then(() => startAiTurn(get, set));
  },

  cancelAiFsm: () => {
    set({ aiFsm: { aiStep: 'IDLE', aiStepCount: 0, aiStartTime: 0 } });
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
