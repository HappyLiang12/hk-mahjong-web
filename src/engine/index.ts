// Core engine barrel exports
export { createTileSet, createTileSetWithOptions, shuffleTiles, tileName, isFlowerTile } from './tiles';
export { initGame, sortHand, revealFlowers } from './game';
export {
  drawTile, discardTile, getLegalClaims, resolveClaims, executeClaim,
  advanceTurn, isWallExhausted, declareConcealedKong, declarePromotedKong,
} from './turns';
export type { ClaimIntent } from './turns';
export {
  tilesMatch, canPong, doPong, canChow, getChowOptions, doChow,
  canExposedKong, doExposedKong, getConcealedKongOptions, doConcealedKong,
  getPromotedKongOptions, doPromotedKong, drawReplacement,
} from './melds';
export { tileCode, tileToCode, tileCounts, isStandardWin, isSevenPairs, isThirteenOrphans, checkWin, canWinWithTile } from './winning';
export type { WinType } from './winning';
export { calculateScore, calculateFlowerBonus } from './scoring';
export { sortHand as sortHandDetailed, groupBySuit, suggestDiscard, detectPotentialMelds } from './hand-sort';
export { createRoundState, advanceRound, isGameOver, getPlayerWind, getWindDisplay, WIND_ORDER } from './wind-rounds';
export type { Wind, RoundState } from './wind-rounds';
export { DEFAULT_HOUSE_RULES, validateHouseRules, mergeWithDefaults, getPreset } from './house-rules';
export type { HouseRules, PresetName } from './house-rules';
export { GAME_MODES, getGameMode } from './game-modes';
export type { GameMode, GameModeConfig } from './game-modes';
export { createMultiplayerGame, isHumanTurn, getCurrentHumanPlayer, getCurrentPlayerName, getNextHumanPlayer, shouldShowPassScreen } from './multiplayer';
export type { MultiplayerConfig } from './multiplayer';
export { calculatePayment, formatPaymentBreakdown } from './payment';
export type { PaymentResult } from './payment';
export { createComboTracker, incrementCombo, resetCombo, updateCombo, getActiveMultipliers, calculateTotalMultiplier, COMBO_RULES } from './combo-system';
export type { ComboTracker, ComboRule } from './combo-system';
export { checkLuckyTile, checkForLuckyEvent, applyLuckyEffect, LUCKY_EVENTS } from './lucky-tiles';
export type { LuckyTileEvent } from './lucky-tiles';
export { analyzeHand, evaluateHand, selectDiscard, shouldClaim, adaptStrategy, getDefensiveScore, blendProfiles, getProfile, AI_STRATEGY_PROFILES } from './ai-advanced';
export type { HandAnalysis, StrategyProfile, StrategyNode } from './ai-advanced';
export { getEffectiveDifficulty, calculateEffectiveDifficulty, updateSkillProfile, estimateInitialLevel, DEFAULT_SCALING_CONFIG, DEFAULT_SKILL_PROFILE } from './ai-scaling';
export type { PlayerSkillProfile, ScalingConfig, EffectiveDifficulty } from './ai-scaling';
export { createReplayRecorder, ReplayRecorder, ReplayPlayer } from './replay';
export type { GameAction, GameReplay } from './replay';
export { createUndoManager } from './undo';
export type { UndoManager } from './undo';
export { analyzeDiscards } from './discard-advisor';
export type { DiscardSuggestion } from './discard-advisor';
export { requestHint, canUseHint, remainingHints, createHintState, getCoachSuggestion, isHintButtonVisible, createHintUsageRecord, HINT_COOLDOWN_LIMIT, RANKED_HINT_BLOCKED_TIERS } from './hint-system';
export type { HintResult, HintState, HintUsageRecord, GameContext } from './hint-system';
