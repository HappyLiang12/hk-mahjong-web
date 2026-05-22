import type { Tile } from '@/types';
import Tile3D from './Tile3D';

interface FlowerZoneProps {
  flowers: Tile[];
  position: 'left' | 'top' | 'right' | 'bottom';
}

const TILE_W = 0.09;
const TILE_H = 0.12;
const TILE_GAP = 0.003;

export default function FlowerZone({ flowers, position }: FlowerZoneProps) {
  if (!flowers || flowers.length === 0) return null;

  // Position next to meld zone, further out
  const posMap: Record<string, [number, number, number]> = {
    bottom: [-1.15, TILE_H / 2 + 0.005, 0.95],
    top: [-1.15, TILE_H / 2 + 0.005, -0.95],
    left: [-0.95, TILE_H / 2 + 0.005, -1.15],
    right: [0.95, TILE_H / 2 + 0.005, -1.15],
  };

  const basePos = posMap[position];
  const isHorizontal = position === 'bottom' || position === 'top';

  return (
    <group position={basePos}>
      {flowers.map((flower, i) => {
        const offset = i * (TILE_W + TILE_GAP);
        const rot: [number, number, number] = isHorizontal
          ? [-0.5, 0, 0]
          : [0, 0, Math.PI / 2];

        const pos: [number, number, number] = isHorizontal
          ? [offset, 0, 0]
          : [0, 0, offset];

        return (
          <Tile3D
            key={`flower-${position}-${flower.id}`}
            tile={flower}
            faceUp={true}
            position={pos}
            rotation={rot}
          />
        );
      })}
    </group>
  );
}
