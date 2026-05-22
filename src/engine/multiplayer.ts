import { GameState } from '../types';
import { initGame } from './game';

export interface MultiplayerConfig {
  mode: 'local_pass_play' | 'local_same_screen';
  playerNames: string[];
  humanPlayers: number[]; // seat indices that are human (rest are AI)
  turnTimer?: number; // seconds per turn, optional
}

/**
 * Create a multiplayer game with the given config.
 * Human players occupy the specified seats, AI fills the rest.
 */
export function createMultiplayerGame(config: MultiplayerConfig): GameState {
  if (config.playerNames.length !== 4) {
    throw new Error('playerNames must have exactly 4 entries');
  }
  if (config.humanPlayers.length < 1 || config.humanPlayers.length > 4) {
    throw new Error('humanPlayers must have 1-4 entries');
  }
  for (const idx of config.humanPlayers) {
    if (idx < 0 || idx > 3) {
      throw new Error('humanPlayers indices must be 0-3');
    }
  }
  return initGame(0, 0);
}

/**
 * Check if the current turn belongs to a human player.
 */
export function isHumanTurn(state: GameState, config: MultiplayerConfig): boolean {
  return config.humanPlayers.includes(state.currentTurn);
}

/**
 * Get the current human player index, or null if it's an AI turn.
 */
export function getCurrentHumanPlayer(state: GameState, config: MultiplayerConfig): number | null {
  if (config.humanPlayers.includes(state.currentTurn)) {
    return state.currentTurn;
  }
  return null;
}

/**
 * Get the name of the player whose turn it is.
 */
export function getCurrentPlayerName(state: GameState, config: MultiplayerConfig): string {
  return config.playerNames[state.currentTurn];
}

/**
 * Get the next human player after the current turn (for pass-and-play transition).
 */
export function getNextHumanPlayer(state: GameState, config: MultiplayerConfig): number | null {
  for (let offset = 1; offset <= 4; offset++) {
    const seat = (state.currentTurn + offset) % 4;
    if (config.humanPlayers.includes(seat)) {
      return seat;
    }
  }
  return null;
}

/**
 * Check if pass-and-play screen should be shown (between human turns).
 */
export function shouldShowPassScreen(
  state: GameState,
  config: MultiplayerConfig,
  previousHumanSeat: number | null
): boolean {
  if (config.mode !== 'local_pass_play') return false;
  if (!isHumanTurn(state, config)) return false;
  // Show pass screen if a different human is now playing
  if (previousHumanSeat !== null && previousHumanSeat !== state.currentTurn) {
    return true;
  }
  // Also show at game start for first human
  if (previousHumanSeat === null) return true;
  return false;
}
