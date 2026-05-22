import Tile3D from './Tile3D';

interface OpponentHandProps {
  count: number; // number of tiles (13 or 14)
  position: 'left' | 'top' | 'right';
}

const TILE_W = 0.09;
const TILE_H = 0.12;
const TILE_GAP = 0.003;

export default function OpponentHand({ count, position }: OpponentHandProps) {
  if (count <= 0) return null;

  const tiles = Array.from({ length: count }, (_, i) => i);

  // Layout based on position
  let tileFn: (i: number) => [number, number, number];
  let rotation: [number, number, number];

  switch (position) {
    case 'left':
      // Left side — vertical column, tiles face right
      rotation = [0, Math.PI / 2, 0];
      tileFn = (i) => {
        const totalHeight = count * (TILE_W + TILE_GAP);
        const startZ = -totalHeight / 2 + TILE_W / 2;
        return [-1.2, 0, startZ + i * (TILE_W + TILE_GAP)];
      };
      break;
    case 'top':
      // Top side — horizontal row, tiles face down
      rotation = [0.3, 0, Math.PI];
      tileFn = (i) => {
        const totalWidth = count * (TILE_W + TILE_GAP);
        const startX = -totalWidth / 2 + TILE_W / 2;
        return [startX + i * (TILE_W + TILE_GAP), 0, -1.15];
      };
      break;
    case 'right':
      // Right side — vertical column, tiles face left
      rotation = [0, -Math.PI / 2, 0];
      tileFn = (i) => {
        const totalHeight = count * (TILE_W + TILE_GAP);
        const startZ = -totalHeight / 2 + TILE_W / 2;
        return [1.2, 0, startZ + i * (TILE_W + TILE_GAP)];
      };
      break;
  }

  return (
    <group>
      {tiles.map((_, i) => (
        <Tile3D
          key={`opp-${position}-${i}`}
          faceUp={false}
          position={tileFn(i)}
          rotation={rotation}
        />
      ))}
    </group>
  );
}
