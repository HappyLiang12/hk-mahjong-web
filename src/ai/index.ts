import { Tile, GameState, Action, AiDifficulty } from '../types';
import { chooseDiscard } from './discard';
import { shouldClaimWin, shouldClaimPong, shouldClaimChow, shouldClaimKong } from './claim';
import { anyDangerousOpponent, safestDiscard } from './defense';
import { calculateShanten } from './shanten';
import { AIPersonality } from './personalities';

export { chooseDiscard } from './discard';
export { shouldClaimWin, shouldClaimPong, shouldClaimChow, shouldClaimKong } from './claim';
export { calculateShanten, shantenByForm } from './shanten';
export { isSafeTile, isDangerousOpponent, anyDangerousOpponent, getDangerousOpponents, safetyScore, safestDiscard } from './defense';
export { PERSONALITIES, getRandomPersonalities, applyPersonality } from './personalities';
export type { AIPersonality } from './personalities';

export function aiDecide(
  gs: GameState, pid: number,
  difficulty: AiDifficulty = 'normal', personality?: AIPersonality,
): Action {
  const p = gs.players[pid];
  if (gs.phase === 'draw') return { type: 'draw', playerId: pid };
  if (gs.phase === 'discard') {
    const discVariant = personality || null;
    if (difficulty === 'easy') return { type: 'discard', playerId: pid, tile: chooseDiscard(gs, pid, 'easy', discVariant || undefined) };
    let tile: Tile;
    if (anyDangerousOpponent(gs, pid)) {
      const nd = chooseDiscard(gs, pid, difficulty, discVariant || undefined);
      const ns = calculateShanten(p.hand.filter(t => t.id !== nd.id), p.melds);
      const sd = safestDiscard(p.hand, gs, pid);
      const ss = calculateShanten(p.hand.filter(t => t.id !== sd.id), p.melds);
      const defensiveness = personality?.style.defensiveness ?? 0.5;
      const threshold = Math.max(0, 1 + Math.round(defensiveness * 2 - 1));
      tile = ss <= ns + threshold ? sd : nd;
      if (personality && Math.random() < personality.style.bluffFrequency * 0.3) tile = nd;
    } else {
      tile = chooseDiscard(gs, pid, difficulty, discVariant || undefined);
    }
    return { type: 'discard', playerId: pid, tile };
  }
  if (gs.phase === 'claim') {
    const d = gs.lastDiscard; const db = gs.lastDiscardBy;
    if (!d || db === null || db === pid) return { type: 'pass', playerId: pid };
    if (shouldClaimWin(p, d)) return { type: 'win', playerId: pid, tile: d };
    if (shouldClaimKong(p, d)) return { type: 'kong', playerId: pid, tile: d };
    if (shouldClaimPong(p, d, difficulty, personality)) return { type: 'pong', playerId: pid, tile: d };
    const cr = shouldClaimChow(p, d, pid, db, difficulty, personality);
    if (cr.claim && cr.tiles) return { type: 'chow', playerId: pid, tile: d, tiles: cr.tiles };
    return { type: 'pass', playerId: pid };
  }
  return { type: 'pass', playerId: pid };
}
