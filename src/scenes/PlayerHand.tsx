import type { Tile } from '@/types';
import Tile3D from './Tile3D';

interface PlayerHandProps {
  tiles: Tile[];
  selectedTileId?: number;
  highlightedTileIds?: number[];
  onTileClick?: (tile: Tile) => void;
  interactive?: boolean;
}

const TILE_W = 0.09;
const TILE_GAP = 0.003;

export default function PlayerHand({
  tiles,
  selectedTileId,
  highlightedTileIds = [],
  onTileClick,
  interactive = true,
}: PlayerHandProps) {
  if (!tiles || tiles.length === 0) {
    return null;
  }

  const totalWidth = tiles.length * (TILE_W + TILE_GAP);
  const startX = -totalWidth / 2 + TILE_W / 2;

  // Player hand is at the bottom of the table (z = +1.2)
  // Tiles are face-up, rotated slightly toward the player
  const baseZ = 1.15;
  const baseY = 0;

  return (
    <group position={[0, baseY, baseZ]}>
      {tiles.map((tile, i) => {
        const x = startX + i * (TILE_W + TILE_GAP);
        const isSelected = tile.id === selectedTileId;
        const isHighlighted = highlightedTileIds.includes(tile.id);

        return (
          <Tile3D
            key={`hand-${tile.id}`}
            tile={tile}
            faceUp={true}
            position={[x, 0, 0]}
            rotation={[-0.3, 0, 0]} // slight tilt toward player
            highlight={
              isSelected ? 'selected' : isHighlighted ? 'hint' : 'none'
            }
            onClick={interactive ? () => onTileClick?.(tile) : undefined}
          />
        );
      })}
    </group>
  );
}
