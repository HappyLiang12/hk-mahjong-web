import { Tile, Suit } from '../types';

/**
 * Create the full 136-tile HK mahjong set (no flowers/seasons).
 * Tiles are returned in order; caller should shuffle.
 */
export function createTileSet(): Tile[] {
  return createTileSetWithOptions({ flowers: false });
}

/**
 * Create tile set with options. When flowers=true, includes 8 flower tiles (144 total).
 */
export function createTileSetWithOptions(options: { flowers: boolean }): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;

  // Numbered suits: wan, tong, tiao — ranks 1-9, 4 copies each
  const numberedSuits: Suit[] = ['wan', 'tong', 'tiao'];
  for (const suit of numberedSuits) {
    for (let rank = 1; rank <= 9; rank++) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({ suit, rank, id: id++ });
      }
    }
  }

  // Winds: 0=E, 1=S, 2=W, 3=N — 4 copies each
  for (let rank = 0; rank < 4; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ suit: 'wind', rank, id: id++ });
    }
  }

  // Dragons: 0=中, 1=發, 2=白 — 4 copies each
  for (let rank = 0; rank < 3; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ suit: 'dragon', rank, id: id++ });
    }
  }

  // Flower tiles: rank 1-8, one copy each (梅蘭菊竹春夏秋冬)
  if (options.flowers) {
    for (let rank = 1; rank <= 8; rank++) {
      tiles.push({ suit: 'flower', rank, id: id++ });
    }
  }

  return tiles;
}

/**
 * Fisher-Yates shuffle (in place).
 */
export function shuffleTiles(tiles: Tile[]): Tile[] {
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

/**
 * Human-readable tile name (for debugging/testing).
 */
export function tileName(tile: Tile): string {
  const suitNames: Record<Suit, string> = {
    wan: '萬', tong: '筒', tiao: '條', wind: '風', dragon: '龍', flower: '花',
  };
  const windNames = ['東', '南', '西', '北'];
  const dragonNames = ['中', '發', '白'];
  const flowerNames = ['梅', '蘭', '菊', '竹', '春', '夏', '秋', '冬'];

  if (tile.suit === 'wind') return windNames[tile.rank] + '風';
  if (tile.suit === 'dragon') return dragonNames[tile.rank];
  if (tile.suit === 'flower') return flowerNames[tile.rank - 1] || '花';
  return `${tile.rank}${suitNames[tile.suit]}`;
}

/**
 * Check if a tile is a flower tile.
 */
export function isFlowerTile(tile: Tile): boolean {
  return tile.suit === 'flower';
}
