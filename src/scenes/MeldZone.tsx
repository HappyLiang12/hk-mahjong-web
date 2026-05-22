import type { Meld, MeldType } from '@/types';
import Tile3D from './Tile3D';

interface MeldZoneProps {
  melds: Meld[];
  position: 'left' | 'top' | 'right' | 'bottom';
}

const TILE_W = 0.09;
const TILE_H = 0.12;
const TILE_GAP = 0.002;

export default function MeldZone({ melds, position }: MeldZoneProps) {
  if (!melds || melds.length === 0) return null;

  // Position melds in a line for each player's zone
  const posMap: Record<string, [number, number, number]> = {
    bottom: [0, TILE_H / 2 + 0.005, 1.0], // below player hand
    top: [0, TILE_H / 2 + 0.005, -1.0], // above top opponent
    left: [-1.05, TILE_H / 2 + 0.005, 0], // left of left opponent
    right: [1.05, TILE_H / 2 + 0.005, 0], // right of right opponent
  };

  const basePos = posMap[position];
  const isHorizontal = position === 'bottom' || position === 'top';

  // Calculate total meld tiles
  const totalTiles = melds.reduce((sum, m) => sum + m.tiles.length, 0);
  const totalWidth = totalTiles * (TILE_W + TILE_GAP);

  let tileIndex = 0;

  return (
    <group position={basePos}>
      {melds.map((meld, mi) =>
        meld.tiles.map((tile) => {
          const offset = tileIndex * (TILE_W + TILE_GAP) - totalWidth / 2 + TILE_W / 2;
          tileIndex++;

          const rot: [number, number, number] = isHorizontal
            ? [-0.5, 0, 0] // tilted toward viewer for bottom
            : position === 'left'
              ? [0, 0, -Math.PI / 2] // face right
              : [0, 0, Math.PI / 2]; // face left

          const pos: [number, number, number] = isHorizontal
            ? [offset, 0, 0]
            : [0, 0, offset];

          return (
            <Tile3D
              key={`meld-${position}-${mi}-${tile.id}`}
              tile={tile}
              faceUp={true}
              position={pos}
              rotation={rot}
            />
          );
        }),
      )}
    </group>
  );
}
