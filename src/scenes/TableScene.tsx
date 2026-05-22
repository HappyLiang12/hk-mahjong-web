import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { Tile } from '@/types';
import type { Meld } from '@/types';
import Environment from './Environment';
import Wall3D from './Wall3D';
import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import DiscardPool3D from './DiscardPool3D';
import MeldZone from './MeldZone';
import FlowerZone from './FlowerZone';

/** Game state slice for 3D rendering — mirrors what the Zustand store provides */
export interface TableSceneState {
  wall: Tile[];
  players: {
    hand: Tile[];
    melds: Meld[];
    discards: Tile[];
    flowers?: Tile[];
  }[];
  currentTurn: number;
  allDiscards: Tile[]; // merged from all players for central display
}

interface TableSceneProps {
  state: TableSceneState;
  selectedTileId?: number;
  highlightedTileIds?: number[];
  onTileClick?: (tile: Tile) => void;
}

export default function TableScene({
  state,
  selectedTileId,
  highlightedTileIds,
  onTileClick,
}: TableSceneProps) {
  const { wall, players, allDiscards } = state;

  // Human is player[0] (bottom)
  const humanPlayer = players[0] ?? { hand: [], melds: [], discards: [], flowers: [] };
  const opponentPlayers = players.slice(1); // [left, top, right]

  const opponentPositions: ('left' | 'top' | 'right')[] = ['left', 'top', 'right'];

  return (
    <>
      <Environment />

      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={[0, 3.5, 2.0]}
        fov={50}
        near={0.1}
        far={50}
      />

      {/* Controls — orbit, zoom, pan */}
      <OrbitControls
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.1}
        minPolarAngle={Math.PI / 6} // prevent going under table
        maxPolarAngle={Math.PI / 2.2} // prevent going too high
        minDistance={1.5}
        maxDistance={8}
        maxAzimuthAngle={Math.PI / 1.5}
        minAzimuthAngle={-Math.PI / 1.5}
      />

      {/* Wall — remaining draw pile */}
      <Wall3D wall={wall} />

      {/* Human player hand (bottom) */}
      <PlayerHand
        tiles={humanPlayer.hand}
        selectedTileId={selectedTileId}
        highlightedTileIds={highlightedTileIds}
        onTileClick={onTileClick}
        interactive={true}
      />

      {/* Human player melds */}
      <MeldZone melds={humanPlayer.melds} position="bottom" />

      {/* Human player flowers */}
      <FlowerZone flowers={humanPlayer.flowers ?? []} position="bottom" />

      {/* Opponent hands and melds */}
      {opponentPlayers.map((player, i) => (
        <group key={`opponent-group-${i}`}>
          <OpponentHand
            count={player.hand.length}
            position={opponentPositions[i]}
          />
          <MeldZone melds={player.melds} position={opponentPositions[i]} />
          <FlowerZone flowers={player.flowers ?? []} position={opponentPositions[i]} />
        </group>
      ))}

      {/* Central discard pool */}
      <DiscardPool3D discards={allDiscards} />
    </>
  );
}
