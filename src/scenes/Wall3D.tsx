import type { Tile } from '@/types';
import Tile3D from './Tile3D';

interface Wall3DProps {
  wall: Tile[];
}

const TILE_W = 0.09;
const TILE_H = 0.12;
const TILE_D = 0.06;

export default function Wall3D({ wall }: Wall3DProps) {
  if (!wall || wall.length === 0) {
    return null;
  }

  // Stack tiles in rows of 17 (double-stacked wall)
  const tilesPerRow = 17;
  const stackHeight = 2; // double-stacked

  // Center the wall
  const totalWidth = tilesPerRow * (TILE_W + 0.002);
  const startX = -totalWidth / 2 + TILE_W / 2;

  return (
    <group position={[0, 0, 0]}>
      {wall.slice(0, tilesPerRow * stackHeight).map((tile, i) => {
        const row = Math.floor(i / tilesPerRow);
        const col = i % tilesPerRow;
        const x = startX + col * (TILE_W + 0.002);
        const y = row * (TILE_H + 0.002) + TILE_H / 2;
        const z = 1.3; // top side of table

        return (
          <Tile3D
            key={`wall-${tile.id}`}
            tile={tile}
            faceUp={false}
            position={[x, y, z]}
            rotation={[0, 0, Math.PI]} // face toward center
          />
        );
      })}

      {/* Wall count indicator */}
      {wall.length > 0 && (
        <mesh position={[startX - 0.2, TILE_H + 0.02, 1.3]}>
          <planeGeometry args={[0.15, 0.08]} />
          <meshBasicMaterial color="#ffffff" opacity={0.7} transparent>
            {/* Count is displayed as a 2D overlay via GameHUD instead */}
          </meshBasicMaterial>
        </mesh>
      )}
    </group>
  );
}
