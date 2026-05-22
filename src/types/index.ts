// Tile suits
export type Suit = 'wan' | 'tong' | 'tiao' | 'wind' | 'dragon' | 'flower';

// Individual tile
export type Tile = {
  suit: Suit;
  rank: number; // 1-9 for numbered suits; wind: 0=E,1=S,2=W,3=N; dragon: 0=中,1=發,2=白
  id: number;   // unique id 0-135
};

// Meld types
export type MeldType = 'chow' | 'pong' | 'kong';

export type Meld = {
  type: MeldType;
  tiles: Tile[];
  concealed: boolean;
};

// Player state
export type Player = {
  hand: Tile[];
  melds: Meld[];
  discards: Tile[];
  flowers?: Tile[];
  seatWind: number; // 0=E, 1=S, 2=W, 3=N
};

// Game phases
export type Phase = 'draw' | 'discard' | 'claim' | 'end';

// Full game state
export type GameState = {
  wall: Tile[];
  players: Player[];    // [0]=human, [1..3]=AI
  currentTurn: number;  // index into players
  prevailingWind: number;
  lastDiscard: Tile | null;
  lastDiscardBy: number | null;
  phase: Phase;
};

// Player actions
export type ActionType = 'draw' | 'discard' | 'chow' | 'pong' | 'kong' | 'win' | 'pass';

export type Action = {
  type: ActionType;
  playerId: number;
  tile?: Tile;
  tiles?: Tile[]; // for melds
};

// Scoring result
export type ScoreResult = {
  faan: number;
  breakdown: { name: string; faan: number }[];
  payment: number;
};

// Claim intent from turns.ts
export type ClaimIntent = {
  type: 'chow' | 'pong' | 'kong' | 'win';
  playerId: number;
  /** For chow: the 2 hand tiles to use */
  handTiles?: Tile[];
};

// Wind / round state
export type Wind = 'east' | 'south' | 'west' | 'north';

export type RoundState = {
  prevailingWind: number;
  dealer: number;
  hand: number; // 1-4 (E1-E4, S1-S4, etc.)
};

// Win type from winning.ts
export type WinType = 'standard' | 'sevenPairs' | 'thirteenOrphans';

// AI difficulty (used by ai/ modules, originally from store)
export type AiDifficulty = 'easy' | 'normal' | 'hard';

// Engine re-exports
export type { HouseRules, PresetName } from '../engine/house-rules';
export type { GameMode, GameModeConfig } from '../engine/game-modes';
export type { MultiplayerConfig } from '../engine/multiplayer';
export type { PaymentResult } from '../engine/payment';
export type { HandAnalysis } from '../engine/ai-advanced';
export type { ComboTracker, ComboRule } from '../engine/combo-system';
export type { LuckyTileEvent } from '../engine/lucky-tiles';
export type { PlayerSkillProfile, ScalingConfig, EffectiveDifficulty } from '../engine/ai-scaling';
export type { GameAction, GameReplay } from '../engine/replay';
export type { CommentaryPersonality, CommentaryLine, CommentaryState } from '../engine/ai-commentary-v3';
export type { DiscardSuggestion } from '../engine/discard-advisor';
export type { HintResult, HintState, HintUsageRecord } from '../engine/hint-system';
export type { AIPersonality } from '../ai/personalities';
