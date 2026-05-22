import { Canvas } from '@react-three/fiber';
import { useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TableScene from '@/scenes/TableScene';
import type { TableSceneState } from '@/scenes/TableScene';
import type { Tile, ClaimIntent } from '@/types';
import { useGameStore } from '@/store/gameStore';
import GameHUD from '@/components/hud/GameHUD';

const WIND_CHARS: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };

export default function GameScreen() {
  const navigate = useNavigate();

  // ── Store selectors ──
  const game = useGameStore((s) => s.game);
  const phase = useGameStore((s) => s.phase);
  const selectedTileId = useGameStore((s) => s.selectedTileId);
  const claimOptions = useGameStore((s) => s.claimOptions);
  const roundState = useGameStore((s) => s.roundState);

  // ── Auto-start game on mount ──
  useEffect(() => {
    if (!game) {
      useGameStore.getState().newGame();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive TableSceneState from gameStore ──
  const sceneState: TableSceneState | null = useMemo(() => {
    if (!game) return null;
    return {
      wall: game.wall,
      players: game.players.map((p) => ({
        hand: p.hand,
        melds: p.melds,
        discards: p.discards,
        flowers: p.flowers,
      })),
      currentTurn: game.currentTurn,
      allDiscards: game.players.flatMap((p) => p.discards),
    };
  }, [game]);

  // ── Derived HUD values ──
  const isHumanTurn = game?.currentTurn === 0;
  const wind = WIND_CHARS[roundState.prevailingWind] ?? '東';

  // ── Action handlers ──
  const handleTileClick = useCallback((tile: Tile) => {
    useGameStore.getState().selectTile(tile.id);
  }, []);

  const handleDiscard = useCallback(() => {
    useGameStore.getState().confirmDiscard();
  }, []);

  const handleCancelSelection = useCallback(() => {
    useGameStore.setState({ selectedTileId: null });
  }, []);

  const handleDraw = useCallback(() => {
    useGameStore.getState().runAITurn();
  }, []);

  const handleClaim = useCallback((type: ClaimIntent['type']) => {
    useGameStore.getState().claimAction(type);
  }, []);

  const handlePass = useCallback(() => {
    useGameStore.getState().passAction();
  }, []);

  const handleBack = useCallback(() => navigate('/'), [navigate]);

  // ── Map claimOptions to ClaimIntent[] for HUD ──
  const claims: ClaimIntent[] = useMemo(
    () =>
      claimOptions.map((opt) => ({
        type: opt.type,
        playerId: 0,
        handTiles: opt.handTiles,
      })),
    [claimOptions],
  );

  // ── Render guard: wait for game to be ready ──
  if (!sceneState || !game || !phase) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-900 text-white">
        <p className="text-lg animate-pulse">Initializing game…</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        className="w-full h-full"
      >
        <TableScene
          state={sceneState}
          selectedTileId={selectedTileId ?? undefined}
          highlightedTileIds={[]}
          onTileClick={handleTileClick}
        />
      </Canvas>

      {/* HUD overlay */}
      <GameHUD
        wind={wind}
        round={roundState.handNumber}
        dealer={roundState.dealerSeat}
        wallCount={game.wall.length}
        isHumanTurn={isHumanTurn}
        currentPlayerIndex={game.currentTurn}
        currentPlayerName={game.currentTurn === 0 ? '你' : `Player ${game.currentTurn}`}
        phase={phase}
        claims={claims}
        onClaim={handleClaim}
        onPass={handlePass}
        claimTimeoutMs={5000}
        hasSelectedTile={selectedTileId !== null}
        onDiscard={handleDiscard}
        onCancelSelection={handleCancelSelection}
        canDraw={phase === 'draw'}
        onDraw={handleDraw}
        inputDisabled={false}
        turnTimeSeconds={30}
        timerRunning={isHumanTurn && (phase === 'draw' || phase === 'discard')}
        onTimeout={() => {}}
        onSettings={() => navigate('/settings')}
        canUndo={false}
        onHint={() => {}}
        hintsRemaining={3}
        onBack={handleBack}
      />
    </div>
  );
}
