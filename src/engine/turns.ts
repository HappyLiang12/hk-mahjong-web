import { GameState, Tile, Player } from '../types';
import {
  canPong, doPong,
  canChow, getChowOptions, doChow,
  canExposedKong, doExposedKong,
  getConcealedKongOptions, doConcealedKong,
  getPromotedKongOptions, doPromotedKong,
  drawReplacement,
} from './melds';
import { sortHand, revealFlowers } from './game';
import { isFlowerTile } from './tiles';

/**
 * Draw a tile from the wall for the current player.
 * Transitions phase: draw → discard.
 */
export function drawTile(state: GameState): Tile | null {
  if (state.phase !== 'draw') return null;
  if (state.wall.length === 0) {
    state.phase = 'end';
    return null;
  }

  const tile = state.wall.pop()!;
  state.players[state.currentTurn].hand.push(tile);

  // Auto-reveal flower tiles
  if (isFlowerTile(tile)) {
    revealFlowers(state.players[state.currentTurn], state.wall);
    state.players[state.currentTurn].hand = sortHand(state.players[state.currentTurn].hand);
    if (state.wall.length === 0) {
      state.phase = 'end';
      return null;
    }
  }

  state.phase = 'discard';
  return tile;
}

/**
 * Current player discards a tile by id.
 * Transitions phase: discard → claim.
 */
export function discardTile(state: GameState, tileId: number): Tile | null {
  if (state.phase !== 'discard') return null;

  const player = state.players[state.currentTurn];
  const idx = player.hand.findIndex(t => t.id === tileId);
  if (idx === -1) return null;

  const tile = player.hand.splice(idx, 1)[0];
  player.discards.push(tile);
  player.hand = sortHand(player.hand);
  state.lastDiscard = tile;
  state.lastDiscardBy = state.currentTurn;
  state.phase = 'claim';
  return tile;
}

/** Claim priority: win=3, kong/pong=2, chow=1 */
function claimPriority(type: string): number {
  if (type === 'win') return 3;
  if (type === 'pong' || type === 'kong') return 2;
  if (type === 'chow') return 1;
  return 0;
}

export type ClaimIntent = {
  playerId: number;
  type: 'chow' | 'pong' | 'kong' | 'win';
  handTiles?: Tile[];
};

/**
 * Get all legal claims other players can make on the last discard.
 */
export function getLegalClaims(state: GameState): ClaimIntent[] {
  if (state.phase !== 'claim' || !state.lastDiscard || state.lastDiscardBy === null) return [];

  const discard = state.lastDiscard;
  const discardBy = state.lastDiscardBy;
  const claims: ClaimIntent[] = [];

  for (let i = 0; i < 4; i++) {
    if (i === discardBy) continue;
    const player = state.players[i];

    if (canExposedKong(player, discard)) {
      claims.push({ playerId: i, type: 'kong' });
    }
    if (canPong(player, discard)) {
      claims.push({ playerId: i, type: 'pong' });
    }
    const nextPlayer = (discardBy + 1) % 4;
    if (i === nextPlayer && canChow(player, discard)) {
      const options = getChowOptions(player, discard);
      for (const opt of options) {
        claims.push({ playerId: i, type: 'chow', handTiles: opt });
      }
    }
  }

  return claims;
}

/**
 * Resolve claims: highest priority wins (win > kong/pong > chow).
 * Ties broken by closest counter-clockwise from discarder.
 */
export function resolveClaims(claims: ClaimIntent[], discardBy: number): ClaimIntent | null {
  if (claims.length === 0) return null;

  return claims.reduce((best, c) => {
    const bp = claimPriority(best.type);
    const cp = claimPriority(c.type);
    if (cp > bp) return c;
    if (cp === bp) {
      const bestDist = (best.playerId - discardBy + 4) % 4;
      const cDist = (c.playerId - discardBy + 4) % 4;
      if (cDist < bestDist) return c;
    }
    return best;
  });
}

/**
 * Execute a resolved claim on the game state.
 */
export function executeClaim(state: GameState, claim: ClaimIntent): boolean {
  if (!state.lastDiscard || state.lastDiscardBy === null) return false;

  const discard = state.lastDiscard;
  const player = state.players[claim.playerId];
  const discardPlayer = state.players[state.lastDiscardBy];
  const dIdx = discardPlayer.discards.findIndex(t => t.id === discard.id);
  if (dIdx !== -1) discardPlayer.discards.splice(dIdx, 1);

  let success = false;

  switch (claim.type) {
    case 'pong':
      success = doPong(player, discard) !== null;
      if (success) {
        state.currentTurn = claim.playerId;
        state.phase = 'discard';
      }
      break;

    case 'kong':
      success = doExposedKong(player, discard) !== null;
      if (success) {
        state.currentTurn = claim.playerId;
        const replacement = drawReplacement(state);
        if (replacement) {
          player.hand.push(replacement);
          player.hand = sortHand(player.hand);
          state.phase = 'discard';
        } else {
          state.phase = 'end';
        }
      }
      break;

    case 'chow':
      if (claim.handTiles) {
        success = doChow(player, discard, claim.handTiles) !== null;
      }
      if (success) {
        state.currentTurn = claim.playerId;
        state.phase = 'discard';
      }
      break;

    case 'win':
      player.hand.push(discard);
      player.hand = sortHand(player.hand);
      state.currentTurn = claim.playerId;
      state.phase = 'end';
      success = true;
      break;
  }

  if (success) {
    state.lastDiscard = null;
    state.lastDiscardBy = null;
  } else {
    discardPlayer.discards.push(discard);
  }

  return success;
}

/**
 * Advance to next player's turn when no claims are made.
 */
export function advanceTurn(state: GameState): void {
  if (state.phase !== 'claim') return;

  state.lastDiscard = null;
  state.lastDiscardBy = null;
  state.currentTurn = (state.currentTurn + 1) % 4;
  state.phase = 'draw';
}

export function isWallExhausted(state: GameState): boolean {
  return state.wall.length === 0;
}

export function declareConcealedKong(state: GameState, tiles: Tile[]): boolean {
  if (state.phase !== 'discard') return false;
  const player = state.players[state.currentTurn];
  const meld = doConcealedKong(player, tiles);
  if (!meld) return false;

  const replacement = drawReplacement(state);
  if (replacement) {
    player.hand.push(replacement);
    player.hand = sortHand(player.hand);
  } else {
    state.phase = 'end';
  }
  return true;
}

export function declarePromotedKong(state: GameState, meldIndex: number, tile: Tile): boolean {
  if (state.phase !== 'discard') return false;
  const player = state.players[state.currentTurn];
  const meld = doPromotedKong(player, meldIndex, tile);
  if (!meld) return false;

  const replacement = drawReplacement(state);
  if (replacement) {
    player.hand.push(replacement);
    player.hand = sortHand(player.hand);
  } else {
    state.phase = 'end';
  }
  return true;
}
