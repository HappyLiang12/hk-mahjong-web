/**
 * Game Replay / Move History
 *
 * Records gameplay actions and provides playback navigation.
 */

import { GameState, Tile } from '../types';

export interface GameAction {
  turn: number;
  player: number; // seat index
  type: 'draw' | 'discard' | 'pong' | 'chow' | 'kong' | 'win' | 'pass' | 'flower_reveal';
  tile?: Tile;
  timestamp: number; // ms from game start
}

export interface GameReplay {
  id: string;
  date: string;
  actions: GameAction[];
  initialState: GameState;
  result: {
    winner: number | null;
    score: number;
    fan: number;
    pattern: string;
  };
}

/**
 * Records actions during gameplay with auto-timestamping.
 */
export class ReplayRecorder {
  private actions: GameAction[] = [];
  private startTime: number = Date.now();
  private _initialState: GameState | null = null;
  private _result: GameReplay['result'] = { winner: null, score: 0, fan: 0, pattern: '' };
  private _id: string = '';

  record(action: Omit<GameAction, 'timestamp'>): void {
    this.actions.push({
      ...action,
      timestamp: Date.now() - this.startTime,
    });
  }

  setInitialState(state: GameState): void {
    this._initialState = state;
  }

  setResult(result: GameReplay['result']): void {
    this._result = result;
  }

  setId(id: string): void {
    this._id = id;
  }

  getActions(): GameAction[] {
    return [...this.actions];
  }

  getReplay(): GameReplay {
    return {
      id: this._id || `replay-${Date.now()}`,
      date: new Date().toISOString(),
      actions: [...this.actions],
      initialState: this._initialState!,
      result: { ...this._result },
    };
  }

  reset(): void {
    this.actions = [];
    this.startTime = Date.now();
    this._initialState = null;
    this._result = { winner: null, score: 0, fan: 0, pattern: '' };
    this._id = '';
  }
}

/**
 * Navigates through a recorded replay step-by-step.
 */
export class ReplayPlayer {
  private replay: GameReplay;
  private currentAction: number = 0;

  constructor(replay: GameReplay) {
    this.replay = replay;
  }

  nextAction(): GameAction | null {
    if (this.currentAction >= this.replay.actions.length) return null;
    return this.replay.actions[this.currentAction++];
  }

  prevAction(): GameAction | null {
    if (this.currentAction <= 0) return null;
    this.currentAction--;
    return this.replay.actions[this.currentAction] ?? null;
  }

  seekTo(turn: number): GameAction[] {
    // Return all actions up to and including the given turn
    const actions = this.replay.actions.filter(a => a.turn <= turn);
    this.currentAction = actions.length;
    return actions;
  }

  isFinished(): boolean {
    return this.currentAction >= this.replay.actions.length;
  }

  getProgress(): { current: number; total: number } {
    return { current: this.currentAction, total: this.replay.actions.length };
  }

  getCurrentIndex(): number {
    return this.currentAction;
  }

  reset(): void {
    this.currentAction = 0;
  }

  getReplay(): GameReplay {
    return this.replay;
  }
}

/**
 * Create a replay recorder (barrel compat factory).
 */
export function createReplayRecorder(): ReplayRecorder {
  return new ReplayRecorder();
}
