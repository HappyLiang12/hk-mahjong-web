import type { Tile } from '@/types';
import Tile3D from './Tile3D';

interface DiscardPool3DProps {
  discards: Tile[];
}

const TILE_W = 0.09;
const TILE_H = 0.12;
const TILE_GAP = 0.002;
const TILES_PER_ROW = 8;

export default function DiscardPool3D({ discards }: DiscardPool3DProps) {
  if (!discards || discards.length === 0) return null;

  return (
    <group position={[0, 0.001, 0]}>
      {discards.map((tile, i) => {
        const row = Math.floor(i / TILES_PER_ROW);
        const col = i % TILES_PER_ROW;

        const totalRowWidth = Math.min(TILES_PER_ROW, discards.length - row * TILES_PER_ROW) * (TILE_W + TILE_GAP);
        const startX = -totalRowWidth / 2 + TILE_W / 2;

        const x = startX + col * (TILE_W + TILE_GAP);
        const z = row * (TILE_H + TILE_GAP) - 0.2;

        return (
          <Tile3D
            key={`discard-${tile.id}`}
            tile={tile}
            faceUp={true}
            position={[x, 0, z]}
            rotation={[0, 0, 0]}
          />
        );
      })}
    </group>
  );
}
