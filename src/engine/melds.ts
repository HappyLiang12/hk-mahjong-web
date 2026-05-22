import { Tile, Meld, Player, GameState } from '../types';

/**
 * Check if two tiles match by suit and rank (ignoring id).
 */
export function tilesMatch(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

function countMatching(tiles: Tile[], target: Tile): number {
  return tiles.filter(t => tilesMatch(t, target)).length;
}

function findMatching(hand: Tile[], target: Tile): Tile[] {
  return hand.filter(t => tilesMatch(t, target));
}

export function canPong(player: Player, discard: Tile): boolean {
  return countMatching(player.hand, discard) >= 2;
}

export function doPong(player: Player, discard: Tile): Meld | null {
  const matching = findMatching(player.hand, discard);
  if (matching.length < 2) return null;

  const used = matching.slice(0, 2);
  for (const t of used) {
    const idx = player.hand.findIndex(h => h.id === t.id);
    if (idx !== -1) player.hand.splice(idx, 1);
  }

  const meld: Meld = { type: 'pong', tiles: [...used, discard], concealed: false };
  player.melds.push(meld);
  return meld;
}

export function getChowOptions(player: Player, discard: Tile): Tile[][] {
  if (discard.suit === 'wind' || discard.suit === 'dragon') return [];

  const hand = player.hand;
  const s = discard.suit;
  const r = discard.rank;
  const options: Tile[][] = [];

  // discard as low: [discard, +1, +2]
  if (r <= 7) {
    const t1 = hand.find(t => t.suit === s && t.rank === r + 1);
    const t2 = hand.find(t => t.suit === s && t.rank === r + 2 && (!t1 || t.id !== t1.id));
    if (t1 && t2) options.push([t1, t2]);
  }
  // discard as middle: [-1, discard, +1]
  if (r >= 2 && r <= 8) {
    const t1 = hand.find(t => t.suit === s && t.rank === r - 1);
    const t2 = hand.find(t => t.suit === s && t.rank === r + 1 && (!t1 || t.id !== t1.id));
    if (t1 && t2) options.push([t1, t2]);
  }
  // discard as high: [-2, -1, discard]
  if (r >= 3) {
    const t1 = hand.find(t => t.suit === s && t.rank === r - 2);
    const t2 = hand.find(t => t.suit === s && t.rank === r - 1 && (!t1 || t.id !== t1.id));
    if (t1 && t2) options.push([t1, t2]);
  }

  return options;
}

export function canChow(player: Player, discard: Tile): boolean {
  return getChowOptions(player, discard).length > 0;
}

export function doChow(player: Player, discard: Tile, handTiles: Tile[]): Meld | null {
  if (handTiles.length !== 2) return null;

  for (const t of handTiles) {
    if (!player.hand.some(h => h.id === t.id)) return null;
  }
  for (const t of handTiles) {
    const idx = player.hand.findIndex(h => h.id === t.id);
    if (idx !== -1) player.hand.splice(idx, 1);
  }

  const allTiles = [...handTiles, discard].sort((a, b) => a.rank - b.rank);
  const meld: Meld = { type: 'chow', tiles: allTiles, concealed: false };
  player.melds.push(meld);
  return meld;
}

export function canExposedKong(player: Player, discard: Tile): boolean {
  return countMatching(player.hand, discard) >= 3;
}

export function doExposedKong(player: Player, discard: Tile): Meld | null {
  const matching = findMatching(player.hand, discard);
  if (matching.length < 3) return null;

  const used = matching.slice(0, 3);
  for (const t of used) {
    const idx = player.hand.findIndex(h => h.id === t.id);
    if (idx !== -1) player.hand.splice(idx, 1);
  }

  const meld: Meld = { type: 'kong', tiles: [...used, discard], concealed: false };
  player.melds.push(meld);
  return meld;
}

export function getConcealedKongOptions(player: Player): Tile[][] {
  const seen = new Set<string>();
  const options: Tile[][] = [];

  for (const tile of player.hand) {
    const key = `${tile.suit}-${tile.rank}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const matching = findMatching(player.hand, tile);
    if (matching.length === 4) {
      options.push(matching);
    }
  }
  return options;
}

export function doConcealedKong(player: Player, tiles: Tile[]): Meld | null {
  if (tiles.length !== 4) return null;
  if (!tiles.every(t => tilesMatch(t, tiles[0]))) return null;
  for (const t of tiles) {
    if (!player.hand.some(h => h.id === t.id)) return null;
  }

  for (const t of tiles) {
    const idx = player.hand.findIndex(h => h.id === t.id);
    if (idx !== -1) player.hand.splice(idx, 1);
  }

  const meld: Meld = { type: 'kong', tiles, concealed: true };
  player.melds.push(meld);
  return meld;
}

export function getPromotedKongOptions(player: Player): { meldIndex: number; tile: Tile }[] {
  const options: { meldIndex: number; tile: Tile }[] = [];

  for (let i = 0; i < player.melds.length; i++) {
    const meld = player.melds[i];
    if (meld.type !== 'pong' || meld.concealed) continue;

    const target = meld.tiles[0];
    const match = player.hand.find(t => tilesMatch(t, target));
    if (match) {
      options.push({ meldIndex: i, tile: match });
    }
  }
  return options;
}

export function doPromotedKong(player: Player, meldIndex: number, tile: Tile): Meld | null {
  const meld = player.melds[meldIndex];
  if (!meld || meld.type !== 'pong') return null;
  if (!tilesMatch(meld.tiles[0], tile)) return null;

  const idx = player.hand.findIndex(h => h.id === tile.id);
  if (idx === -1) return null;

  player.hand.splice(idx, 1);
  meld.type = 'kong';
  meld.tiles.push(tile);
  return meld;
}

export function drawReplacement(state: GameState): Tile | null {
  if (state.wall.length === 0) return null;
  return state.wall.shift()!;
}
