import { GameState } from '../types';

/**
 * Manages undo history for practice mode.
 * Stores deep copies of game states up to a configurable max.
 */
export class UndoManager {
  private history: GameState[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 10) {
    this.maxHistory = maxHistory;
  }

  saveState(state: GameState): void {
    const copy = JSON.parse(JSON.stringify(state)) as GameState;
    this.history.push(copy);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  undo(): GameState | null {
    return this.history.pop() ?? null;
  }

  clear(): void {
    this.history = [];
  }

  get length(): number {
    return this.history.length;
  }
}

/**
 * Factory: creates a new UndoManager with configurable max history.
 */
export function createUndoManager(maxHistory: number = 10): UndoManager {
  return new UndoManager(maxHistory);
}
