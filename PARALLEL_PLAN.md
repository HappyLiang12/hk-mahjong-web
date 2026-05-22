# hk-mahjong-web — Parallel Workstream Decomposition

**Author:** BA
**Date:** 2026-05-21
**Status:** Ready for dispatch
**Based on:** SPEC.md v1.0 (962 lines), current file tree, tsc --noEmit pass

---

## 1. Current State Assessment

### 1.1 What Exists (as of 2026-05-21)

| Directory/File | Status | Details |
|---|---|---|
| `src/types/index.ts` | ✅ **Complete** | All core types: Tile, Suit, Player, GameState, Phase, ScoreResult, ClaimIntent, RoundState, WinType, ActionType. 89 lines. |
| `src/engine/` | ⚠️ **Partial** | 5 of 20+ files ported: `tiles.ts` (85L), `game.ts` (110L), `turns.ts` (240L), `melds.ts` (174L), `winning.ts` (163L). **15+ files remaining.** |
| `src/ai/` | ❌ **Not started** | 0 of 6 files |
| `src/store/` | ❌ **Not started** | 0 of 4 stores |
| `src/scenes/` | ❌ **Not started** | 0 of 6+ R3F components |
| `src/i18n/` | ❌ **Not started** | 0 files, no locale JSONs |
| `src/hooks/` | ❌ **Not started** | 0 of 5 hooks |
| `src/audio/` | ❌ **Not started** | 0 files |
| `src/components/screens/` | ⚠️ **Stubs only** | 5 placeholder screens (Menu, Game, Settings, EndGame, Scoring) — no real logic |
| `src/components/game/` | ❌ **Not started** | 0 of 6 game UI components |
| `src/components/layout/` | ❌ **Not started** | 0 of 2 layout components |
| `src/components/shared/` | ❌ **Not started** | 0 of 4 shared components |
| `src/App.tsx` | ✅ **Scaffold** | Router with 5 routes wired |
| `src/main.tsx` | ✅ **Scaffold** | React entry with BrowserRouter |
| `src/index.css` | ✅ **Scaffold** | Tailwind + CSS variable palette |
| `vite.config.ts` | ✅ | Vite 8 + React plugin + Tailwind 4 |
| `vitest.config.ts` | ✅ | jsdom, globals, path aliases |
| `tsconfig.app.json` | ✅ | TS 6.0, strict, bundler mode |
| `package.json` | ✅ | All deps installed (R3F, Zustand, GSAP, i18next, Howler, etc.) |

### 1.2 Build Status

```
tsc --noEmit    → ✅ PASSES (zero errors)
npm run dev     → ✅ Works (placeholder app renders at localhost:5173)
npm run build   → Not yet verified
vitest          → Not yet run (no test files exist)
```

### 1.3 What's Done vs Remaining

| Layer | Done | Remaining |
|---|---|---|
| Engine | 5/20 files | **15 files** (scoring, wind-rounds, hand-sort, house-rules, game-modes, replay, combo-system, lucky-tiles, payment, undo, multiplayer, hint-system, discard-advisor, ai-advanced, ai-scaling) |
| AI | 0/6 files | **6 files** (index, discard, claim, defense, shanten, personalities) |
| Types | Complete | Minor extensions for web-specific types |
| i18n | 0 files | Index setup + 3 locale JSON files (zh-TW, zh-CN, ja) |
| Stores | 0 files | 4 Zustand stores (game, settings, stats, ui) |
| 3D Scenes | 0 files | 6+ R3F components |
| UI Screens | 5 stubs | ~27 real screens + 6 game HUD components + 4 shared + 2 layout |
| Hooks | 0 files | 5 custom hooks |
| Audio | 0 files | AudioManager + SFX/music |
| Tests | 0 files | ~200 unit + integration + E2E |

---

## 2. Parallel Workstream Map

### Principle: File-scope ownership. No two workstreams touch the same file.

### Wave 1 — Foundation (3 streams, ZERO mutual dependencies)

```
┌─────────────────────────────────────────────────────────────┐
│                        WAVE 1 (parallel)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   DEV-A      │  │   DEV-B      │  │   DEV-C          │  │
│  │   Engine     │  │   AI Module  │  │   i18n + Shared  │  │
│  │   src/engine/│  │   src/ai/    │  │   + Layout UI    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  NO shared files — can all run simultaneously               │
└─────────────────────────────────────────────────────────────┘
```

### Wave 2 — State + UX (3 streams, all depend on Wave 1 completion)

```
┌─────────────────────────────────────────────────────────────┐
│                        WAVE 2 (parallel)                     │
│                    depends on: DEV-A ∧ DEV-B ∧ DEV-C         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   DEV-D      │  │   DEV-E      │  │   DEV-F          │  │
│  │   Stores     │  │   3D Scenes  │  │   Screens +      │  │
│  │   src/store/ │  │   src/scenes/│  │   Game HUD       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  Each owns exclusive directories — no file conflicts         │
│  Can test independently with mock data                       │
└─────────────────────────────────────────────────────────────┘
```

### Wave 3 — Integration (1 stream, depends on Wave 2)

```
┌─────────────────────────────────────────────────────────────┐
│                        WAVE 3                                │
│            depends on: DEV-D ∧ DEV-E ∧ DEV-F                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   DEV-G                                             │   │
│  │   Hooks + Audio + Wire-up + P1 Screens              │   │
│  │   src/hooks/, src/audio/, src/App.tsx               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Workstream Specifications

### DEV-A: Core Engine Port

| Attribute | Value |
|---|---|
| **Directories owned** | `src/engine/` (exclusive) |
| **Files to create/modify** | `scoring.ts`, `wind-rounds.ts`, `hand-sort.ts`, `house-rules.ts`, `game-modes.ts`, `replay.ts`, `combo-system.ts`, `lucky-tiles.ts`, `payment.ts`, `undo.ts`, `multiplayer.ts`, `hint-system.ts`, `discard-advisor.ts`, `ai-advanced.ts`, `ai-scaling.ts`, `index.ts` (barrel) |
| **Files to NOT touch** | `tiles.ts`, `game.ts`, `turns.ts`, `melds.ts`, `winning.ts` (already ported — read-only reference) |
| **Source repo** | `/home/user/hk-mahjong/src/engine/` |
| **Dependencies** | None (pure TS, zero external deps) |
| **Acceptance criteria** | All 20 engine files pass `tsc --noEmit`; Vitest tests pass for each module (adapted from mobile Jest tests); barrel export `src/engine/index.ts` re-exports all public APIs |
| **Estimated effort** | 6-8 hours (15 files to port + tests) |

### DEV-B: AI Module Port

| Attribute | Value |
|---|---|
| **Directories owned** | `src/ai/` (exclusive) |
| **Files to create** | `index.ts`, `discard.ts`, `claim.ts`, `defense.ts`, `shanten.ts`, `personalities.ts` |
| **Source repo** | `/home/user/hk-mahjong/src/ai/` |
| **Dependencies** | None (pure TS — depends on types already in `src/types/index.ts`) |
| **Acceptance criteria** | All 6 AI files pass `tsc --noEmit`; Vitest tests pass (ported from mobile); barrel export works; AI decision functions produce deterministic output for given input |
| **Estimated effort** | 2-3 hours |

### DEV-C: i18n + Shared Components + Layout

| Attribute | Value |
|---|---|
| **Directories owned** | `src/i18n/`, `src/components/shared/`, `src/components/layout/` |
| **Files to create** | `i18n/index.ts`, `i18n/locales/zh-TW.json`, `i18n/locales/zh-CN.json`, `i18n/locales/ja.json`; `components/shared/Button.tsx`, `components/shared/Modal.tsx`, `components/shared/TileLabel.tsx`, `components/shared/ScoreBreakdown.tsx`; `components/layout/AppShell.tsx`, `components/layout/GameHUD.tsx` |
| **Source reference** | Copy locale JSONs from mobile; create web-native shared components |
| **Dependencies** | None (i18n JSONs are data-only; shared components use Tailwind + framer-motion only) |
| **Acceptance criteria** | i18next initialized; `t('game.yourTurn')` resolves to "你的回合"; Button/Modal/TileLabel components render with Tailwind styling; AppShell provides layout wrapper; GameHUD provides HTML overlay skeleton; all pass `tsc --noEmit` |
| **Estimated effort** | 2-3 hours |

### DEV-D: Zustand Stores

| Attribute | Value |
|---|---|
| **Directories owned** | `src/store/` (exclusive) |
| **Files to create** | `gameStore.ts`, `settingsStore.ts`, `statsStore.ts`, `uiStore.ts` |
| **Dependencies** | DEV-A (engine types/functions), DEV-B (AI functions), `src/types/index.ts` (already done) |
| **Key interfaces** | `gameStore`: newGame(), selectTile(), confirmDiscard(), claimAction(), passAction(), runAITurn(); `settingsStore`: persist all settings to localStorage; `statsStore`: record games, streaks, achievements; `uiStore`: screen navigation, modal, toast, camera preset |
| **Acceptance criteria** | `newGame()` creates valid GameState; `confirmDiscard()` calls engine.discardTile() and advances state; `runAITurn()` calls AI decision and applies action; settings persist across reload; stores work with zustand devtools; all pass Vitest tests |
| **Estimated effort** | 4-5 hours |

### DEV-E: 3D Table Scenes (R3F)

| Attribute | Value |
|---|---|
| **Directories owned** | `src/scenes/` (exclusive) |
| **Files to create** | `TableScene.tsx`, `Tile3D.tsx`, `TileRack.tsx`, `DiscardPool.tsx`, `MeldZone.tsx`, `Environment.tsx` |
| **Dependencies** | DEV-A (Tile/GameState types), DEV-C (Tailwind design tokens for consistency). Can start with mock store data before DEV-D completes. |
| **Key 3D elements** | `<TableScene>` — root group with all sub-components; `<Tile3D>` — BoxGeometry 0.09×0.12×0.06, Canvas texture face, interactive; `<TileRack>` — arranges 13 tiles in row; `<DiscardPool>` — grid layout for discards; `<MeldZone>` — per-seat exposed melds; `<Environment>` — lighting, table surface, camera |
| **Performance targets** | InstancedMesh for tiles; texture atlas for faces; <200 draw calls; ≥60 FPS |
| **Acceptance criteria** | Table renders with lit surface; 136 distinct tiles renderable (face-up and face-down); tiles highlight on hover/select; camera orbits with mouse drag; scene reads from Zustand store (mock allowed); all pass Vitest component tests with R3F test utils |
| **Estimated effort** | 8-10 hours (heavy 3D work) |

### DEV-F: UI Screens P0 + Game HUD

| Attribute | Value |
|---|---|
| **Directories owned** | `src/components/screens/` (P0 screens), `src/components/game/` |
| **Files to create/modify** | **New screens:** `LobbyScreen.tsx`, `OnboardingScreen.tsx`; **Rebuild stubs:** `MenuScreen.tsx`, `GameScreen.tsx`, `SettingsScreen.tsx`, `EndGameScreen.tsx`, `ScoringScreen.tsx`; **Game HUD:** `HandControls.tsx`, `ClaimPanel.tsx`, `TurnIndicator.tsx`, `RoundInfoBar.tsx`, `WindRoundHUD.tsx`, `TurnTimer.tsx` |
| **Files to NOT touch** | Already-existing screen files can be REPLACED (they are stubs with no logic to preserve) |
| **Dependencies** | DEV-C (shared components, layout), DEV-D (stores for wiring). Can start with mock store data. |
| **Acceptance criteria** | Menu → Lobby → Game → EndGame → Scoring → Menu full flow works; All P0 screens render with real Tailwind styling; Game HUD overlays show correct state; ClaimPanel shows legal claim buttons; HandControls enables tile selection/discard; Keyboard shortcuts D/1-9/Enter/P/Esc work; all pass `tsc --noEmit` |
| **Estimated effort** | 6-8 hours (8 screens + 6 HUD components) |

### DEV-G: Hooks + Audio + Wire-up + P1 Screens

| Attribute | Value |
|---|---|
| **Directories owned** | `src/hooks/`, `src/audio/`, modifies `src/App.tsx` |
| **Files to create** | `hooks/useGameLoop.ts`, `hooks/useAI.ts`, `hooks/useAudio.ts`, `hooks/useKeyboard.ts`, `hooks/useResponsive.ts`; `audio/AudioManager.ts` |
| **Files to modify** | `src/App.tsx` — add remaining route entries; `src/main.tsx` — add I18nProvider |
| **Dependencies** | ALL Wave 2 streams (DEV-D stores, DEV-E scenes, DEV-F screens) |
| **Acceptance criteria** | useGameLoop orchestrates full turn cycle (human→AI→human); useAI triggers AI decisions with configured delay; useAudio plays SFX on draw/discard/pong/win; useKeyboard maps D=draw, 1-9=slot, Enter=confirm, P=pass, Esc=back; AudioManager wraps Howler.js with sprite support; App.tsx has all P0+P1 routes; full game playable end-to-end |
| **Estimated effort** | 4-5 hours |

---

## 4. Dependency Graph

```
                    ┌──────────────────┐
                    │   types/index.ts  │  ← Already exists
                    │   (pre-existing)  │
                    └────────┬─────────┘
                             │ ALL streams depend on this
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│    DEV-A     │  │    DEV-B     │  │     DEV-C        │
│  src/engine/ │  │   src/ai/    │  │  i18n + shared   │
│  (15 files)  │  │  (6 files)   │  │  + layout UI     │
└──────┬───────┘  └──────┬───────┘  └────────┬─────────┘
       │                 │                    │
       └─────────┬───────┴────────────────────┘
                 │  Wave 1 → Wave 2 gate
                 │  (all 3 must complete)
        ┌────────┼────────┬────────────────────┐
        ▼        ▼        ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│    DEV-D     │  │    DEV-E     │  │     DEV-F        │
│  src/store/  │  │ src/scenes/  │  │  screens + HUD   │
│  (4 stores)  │  │ (6 R3F comp) │  │  (14 components) │
└──────┬───────┘  └──────┬───────┘  └────────┬─────────┘
       │                 │                    │
       └─────────┬───────┴────────────────────┘
                 │  Wave 2 → Wave 3 gate
                 │  (all 3 must complete)
                 ▼
        ┌──────────────────────┐
        │       DEV-G          │
        │  hooks + audio       │
        │  + wire-up           │
        └──────────────────────┘
```

### Dependency Matrix

| Stream | Depends On | Blocks |
|---|---|---|
| DEV-A | types (exists) | DEV-D, DEV-E, DEV-F |
| DEV-B | types (exists) | DEV-D, DEV-F |
| DEV-C | types (exists), i18next (installed) | DEV-D, DEV-F |
| DEV-D | DEV-A, DEV-B, DEV-C | DEV-G |
| DEV-E | DEV-A, DEV-C | DEV-G |
| DEV-F | DEV-C, DEV-D (can start with mocks) | DEV-G |
| DEV-G | DEV-D, DEV-E, DEV-F | (terminal) |

---

## 5. File Ownership Map (Conflict Prevention)

```
src/
├── types/index.ts          ← Pre-existing, read-only for all streams
├── engine/*.ts             ← DEV-A (exclusive)
├── ai/*.ts                 ← DEV-B (exclusive)
├── i18n/*                  ← DEV-C (exclusive)
├── components/shared/*     ← DEV-C (exclusive)
├── components/layout/*     ← DEV-C (exclusive)
├── store/*.ts              ← DEV-D (exclusive)
├── scenes/*.tsx            ← DEV-E (exclusive)
├── components/screens/*    ← DEV-F (exclusive, replaces stubs)
├── components/game/*       ← DEV-F (exclusive)
├── hooks/*.ts              ← DEV-G (exclusive)
├── audio/*                 ← DEV-G (exclusive)
├── App.tsx                 ← DEV-G (modifies to add routes)
└── main.tsx                ← DEV-G (modifies to add I18nProvider)
```

**Zero overlap guarantee: each directory is owned by exactly one workstream.**

---

## 6. Ready-to-Run Kanban Create Commands

These are executed by the BA via `kanban_create()` tool calls. Each task includes:
- Precise file ownership (no ambiguity)
- Acceptance criteria
- Parent dependency links (for Wave 2/3)

### Wave 1 — No parents (ready immediately)

```
DEV-A: Port remaining 15 engine files from mobile, adapt tests to Vitest, create barrel export
  owner: src/engine/ (exclusive)
  files: scoring.ts, wind-rounds.ts, hand-sort.ts, house-rules.ts, game-modes.ts,
         replay.ts, combo-system.ts, lucky-tiles.ts, payment.ts, undo.ts,
         multiplayer.ts, hint-system.ts, discard-advisor.ts, ai-advanced.ts,
         ai-scaling.ts, index.ts (total: 16 new files)
  do NOT touch: tiles.ts, game.ts, turns.ts, melds.ts, winning.ts (already done)
  AC: all 20 engine files pass tsc --noEmit; Vitest tests adapted from mobile pass

DEV-B: Port all 6 AI files from mobile, adapt tests to Vitest
  owner: src/ai/ (exclusive)
  files: index.ts, discard.ts, claim.ts, defense.ts, shanten.ts, personalities.ts
  AC: all 6 files pass tsc --noEmit; Vitest tests pass

DEV-C: Setup i18n + create shared UI primitives + layout shell
  owner: src/i18n/, src/components/shared/, src/components/layout/ (exclusive)
  files: i18n/index.ts + 3 locale JSONs; shared/Button,Modal,TileLabel,ScoreBreakdown;
         layout/AppShell,GameHUD (total: 10 files)
  AC: i18next works; shared components render with Tailwind; AppShell wraps routes
```

### Wave 2 — Parents: DEV-A, DEV-B, DEV-C

```
DEV-D: Build all 4 Zustand stores, wire to engine/AI functions
  owner: src/store/ (exclusive)
  files: gameStore.ts, settingsStore.ts, statsStore.ts, uiStore.ts
  AC: newGame/discard/claim flow works; settings persist; stats record games

DEV-E: Build R3F 3D table scene with tiles, racks, discard pool
  owner: src/scenes/ (exclusive)
  files: TableScene.tsx, Tile3D.tsx, TileRack.tsx, DiscardPool.tsx, MeldZone.tsx, Environment.tsx
  AC: 3D table renders; 136 tile variants; hover/select highlight; camera controls

DEV-F: Build P0 screens + game HUD components, keyboard shortcuts
  owner: src/components/screens/ (P0), src/components/game/ (exclusive)
  files: 8 screens (2 new + 6 rebuilds), 6 game HUD components
  AC: full menu→play→end→menu flow; claim panel; keyboard shortcuts
```

### Wave 3 — Parents: DEV-D, DEV-E, DEV-F

```
DEV-G: Build hooks, audio system, wire up App.tsx, add P1 screens
  owner: src/hooks/, src/audio/, modifies src/App.tsx, src/main.tsx
  files: 5 hooks, 1 AudioManager, route additions
  AC: full game loop works end-to-end; audio plays; keyboard shortcuts active
```

---

## 7. Risk Assessment

| Risk | Mitigation |
|---|---|
| Running DEV task (t_de3ff66e) may create files in directories DEV-A through DEV-G will own | Each DEV task starts with a git pull to sync latest state; file-level scoping means conflicts are mergeable |
| Engine port quality varies per file | DEV-A includes running all Vitest tests as acceptance gate |
| 3D performance on low-end GPUs | DEV-E includes InstancedMesh optimization and quality presets |
| i18n translations incomplete | DEV-C copies existing locale JSONs; gaps filled with English fallback |
| Store API may need adjustment after screens are built | DEV-D and DEV-F can iterate — stores expose getters/setters via zustand |

---

## 8. Total Effort Estimate

| Stream | Files | Est. Hours |
|---|---|---|
| DEV-A | 16 | 6-8h |
| DEV-B | 6 | 2-3h |
| DEV-C | 10 | 2-3h |
| DEV-D | 4 | 4-5h |
| DEV-E | 6 | 8-10h |
| DEV-F | 14 | 6-8h |
| DEV-G | 6 | 4-5h |
| **Total** | **62 files** | **32-42h** |

**Parallelized wall-clock estimate:** ~16-20 hours (Wave 1: 8h max + Wave 2: 10h max + Wave 3: 5h max, with 3 workers per wave).
