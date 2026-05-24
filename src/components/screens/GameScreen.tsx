import { Canvas } from '@react-three/fiber';
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TableScene from '@/scenes/TableScene';
import type { TableSceneState } from '@/scenes/TableScene';
import type { Tile, ClaimIntent } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { createUndoManager } from '@/engine/undo';
import type { UndoManager } from '@/engine/undo';
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

  // P1: Practice mode fields
  const allowUndo = useGameStore((s) => s.allowUndo);
  const showHints = useGameStore((s) => s.showHints);

  // P2: WebGL recovery
  const webglLost = useGameStore((s) => s.webglLost);

  // P4: Hint fields
  const highlightedHintTileId = useGameStore((s) => s.highlightedHintTileId);
  const hintToastText = useGameStore((s) => s.hintToastText);
  const hintsRemaining = useGameStore((s) => {
    if (!s.hintState) return 0;
    if (s.hintState.isUnlimited) return 99;
    return s.hintState.maxHintsPerGame - s.hintState.hintsUsedThisGame;
  });

  // P3: UndoManager
  const undoManagerRef = useRef<UndoManager>(createUndoManager(10));
  const [canUndo, setCanUndo] = useState(false);

  // P6: debug logging for undo visibility
  useEffect(() => {
    console.debug('[Undo] GameScreen render', { allowUndo, canUndo, hasUndoHandler: !!handleUndo });
  }, [allowUndo, canUndo]);

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

  // P4: Build highlighted tile IDs (include hint highlight)
  const highlightedTileIds: number[] = useMemo(() => {
    const ids: number[] = [];
    if (highlightedHintTileId !== null) ids.push(highlightedHintTileId);
    return ids;
  }, [highlightedHintTileId]);

  // ── Action handlers ──
  const handleTileClick = useCallback((tile: Tile) => {
    useGameStore.getState().selectTile(tile.id);
  }, []);

  const handleDiscard = useCallback(() => {
    // P3: Save state before discard
    const st = useGameStore.getState();
    if (st.game && st.allowUndo) {
      undoManagerRef.current.saveState(st.game);
      console.debug('[Undo] saveState before discard', { historyLength: undoManagerRef.current.length });
      setCanUndo(undoManagerRef.current.canUndo());
    }
    useGameStore.getState().confirmDiscard();
  }, [allowUndo]);

  const handleCancelSelection = useCallback(() => {
    useGameStore.setState({ selectedTileId: null });
  }, []);

  const handleDraw = useCallback(() => {
    useGameStore.getState().runAITurn();
  }, []);

  const handleClaim = useCallback((type: ClaimIntent['type']) => {
    // P3: Save state before claim
    const st = useGameStore.getState();
    if (st.game && st.allowUndo) {
      undoManagerRef.current.saveState(st.game);
      console.debug('[Undo] saveState before claim', { historyLength: undoManagerRef.current.length });
      setCanUndo(undoManagerRef.current.canUndo());
    }
    useGameStore.getState().claimAction(type);
  }, [allowUndo]);

  const handlePass = useCallback(() => {
    useGameStore.getState().passAction();
  }, []);

  const handleBack = useCallback(() => navigate('/'), [navigate]);

  // P3: Undo handler
  const handleUndo = useCallback(() => {
    const prev = undoManagerRef.current.undo();
    if (prev) {
      useGameStore.setState({ game: prev, phase: prev.phase, currentTurn: prev.currentTurn });
      setCanUndo(undoManagerRef.current.canUndo());
    }
  }, []);

  // P4: Hint handler
  const handleHint = useCallback(() => {
    useGameStore.getState().requestHintAction();
  }, []);

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
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        className="w-full h-full"
        onCreated={({ gl }) => {
          // P2: WebGL context lost/recovery handlers
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            useGameStore.setState({ webglLost: true });
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            useGameStore.setState({ webglLost: false });
          });
        }}
      >
        <TableScene
          state={sceneState}
          selectedTileId={selectedTileId ?? undefined}
          highlightedTileIds={highlightedTileIds}
          onTileClick={handleTileClick}
        />
      </Canvas>

      {/* P2: WebGL recovery banner */}
      {webglLost && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-amber-900/70">
          <div className="text-amber-200 text-center p-6 rounded-xl bg-black/50">
            <div className="text-2xl font-bold mb-2">⚠️ 圖像引擎已斷線</div>
            <div className="text-sm">正在恢復中…</div>
          </div>
        </div>
      )}

      {/* P4: Hint toast */}
      {hintToastText && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-indigo-900/90 border border-indigo-500 text-indigo-200 px-4 py-2 rounded-lg shadow-lg animate-pulse text-sm font-medium">
            💡 {hintToastText}
          </div>
        </div>
      )}

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
        canUndo={allowUndo && canUndo}
        onUndo={allowUndo ? handleUndo : undefined}
        onHint={handleHint}
        hintsRemaining={hintsRemaining}
        onBack={handleBack}
      />
    </div>
  );
}
