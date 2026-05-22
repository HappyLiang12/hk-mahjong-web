# SPEC: HK Mahjong Web — Three.js 3D Web Port

**Author:** BA  
**Date:** 2026-05-21  
**Status:** Draft v1.0  
**Target Repo:** `/home/user/hk-mahjong-web/`  
**Source App:** `/home/user/hk-mahjong/` (React Native/Expo, 5,074 passing tests)

---

## Table of Contents
1. [Tech Stack Decision](#1-tech-stack-decision)
2. [Feature Parity Matrix](#2-feature-parity-matrix)
3. [Component Tree](#3-component-tree)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [DEV Task Breakdown (P0/P1/P2)](#5-dev-task-breakdown-p0p1p2)
6. [QA Strategy](#6-qa-strategy)

---

## 1. Tech Stack Decision

### 1.1 Overview

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | React 18 + Vite 6 | Matches mobile's React mental model; Vite provides fast HMR, optimized builds |
| **Language** | TypeScript 5.x (strict mode) | Same as mobile; strong typing critical for game logic |
| **3D Rendering** | react-three-fiber (R3F) + @react-three/drei | Declarative Three.js; component model mirrors React |
| **3D Physics** | @react-three/rapier (optional) | Tile collision/stacking; can start without physics for MVP |
| **State Management** | Zustand 5 | Same as mobile (Zustand 5); shared mental model for game store |
| **Routing** | react-router-dom v7 | Client-side routing for screen navigation |
| **Styling** | Tailwind CSS 4 | Utility-first, desktop-first responsive |
| **UI Animation** | framer-motion | For UI transitions, HUD overlays, menu animations |
| **3D Animation** | GSAP (greensock) + Three.js timeline | Tile flips, deals, discards, celebrations |
| **Audio** | Howler.js | Cross-browser audio with sprite support; direct replacement for expo-av |
| **i18n** | react-i18next (same as mobile) | Reuse zh-TW.json, zh-CN.json, ja.json translation files directly |
| **Unit Testing** | Vitest | Native ESM support, Jest-compatible API, faster |
| **E2E Testing** | Playwright | Cross-browser, can test WebGL canvas via CDP |
| **Visual Regression** | Playwright screenshots + pixelmatch | Screenshot diffing for 3D scene validation |
| **Linting** | ESLint 9 (flat config) + Prettier | Standard TS/React rules |
| **CI/CD** | GitHub Actions → Vercel | Automated test → deploy pipeline |
| **Monorepo** | Single package (not monorepo) | Engine logic stays in `src/engine/` for portability |

### 1.2 Dependency Map

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.x",
    "three": "^0.171.x",
    "@react-three/fiber": "^8.x",
    "@react-three/drei": "^9.x",
    "zustand": "^5.0.12",
    "framer-motion": "^11.x",
    "gsap": "^3.x",
    "howler": "^2.2.x",
    "i18next": "^25.8.20",
    "react-i18next": "^16.5.8",
    "tailwindcss": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^6.x",
    "vitest": "^2.x",
    "@playwright/test": "^1.x",
    "@types/three": "^0.x",
    "@types/howler": "^2.x",
    "eslint": "^9.x",
    "prettier": "^3.x",
    "pixelmatch": "^5.x",
    "pngjs": "^7.x"
  }
}
```

### 1.3 Project Structure

```
hk-mahjong-web/
├── public/                  # Static assets (favicon, audio)
│   └── audio/
│       ├── sfx/             # Tile click, win fanfare, draw, etc.
│       ├── music/           # Background tracks
│       └── voice/           # AI voice lines
├── src/
│   ├── engine/              # ← PORTED from mobile (pure TS, no RN deps)
│   │   ├── tiles.ts
│   │   ├── game.ts
│   │   ├── turns.ts
│   │   ├── winning.ts
│   │   ├── scoring.ts
│   │   ├── melds.ts
│   │   ├── wind-rounds.ts
│   │   ├── hand-sort.ts
│   │   ├── house-rules.ts
│   │   ├── game-modes.ts
│   │   ├── replay.ts
│   │   ├── combo-system.ts
│   │   ├── lucky-tiles.ts
│   │   ├── payment.ts
│   │   ├── undo.ts
│   │   ├── multiplayer.ts
│   │   ├── hint-system.ts
│   │   ├── discard-advisor.ts
│   │   ├── ai-advanced.ts
│   │   ├── ai-scaling.ts
│   │   └── index.ts
│   ├── ai/                  # ← PORTED from mobile (pure TS)
│   │   ├── index.ts
│   │   ├── discard.ts
│   │   ├── claim.ts
│   │   ├── defense.ts
│   │   ├── shanten.ts
│   │   └── personalities.ts
│   ├── store/               # Zustand stores (web-adapted)
│   │   ├── gameStore.ts     # Core game state
│   │   ├── settingsStore.ts # User settings persistence
│   │   ├── statsStore.ts    # Statistics
│   │   └── uiStore.ts       # UI state (current screen, modals)
│   ├── scenes/              # R3F 3D scenes
│   │   ├── TableScene.tsx   # Main 3D mahjong table
│   │   ├── Tile3D.tsx       # Individual 3D tile model
│   │   ├── TileRack.tsx     # Player's hand rack (13+ tiles)
│   │   ├── DiscardPool.tsx  # Central discard area
│   │   ├── MeldZone.tsx     # Exposed meld display area
│   │   └── Environment.tsx  # Lighting, background, table surface
│   ├── components/          # 2D React UI components (HTML overlay)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   └── GameHUD.tsx  # HTML overlay on top of 3D canvas
│   │   ├── game/
│   │   │   ├── HandControls.tsx    # Discard selection, confirm
│   │   │   ├── ClaimPanel.tsx      # Pong/Chow/Kong/Win/Pass
│   │   │   ├── TurnIndicator.tsx
│   │   │   ├── RoundInfoBar.tsx
│   │   │   ├── WindRoundHUD.tsx
│   │   │   └── TurnTimer.tsx
│   │   ├── screens/         # Full-screen routes
│   │   │   ├── MenuScreen.tsx
│   │   │   ├── LobbyScreen.tsx
│   │   │   ├── GameScreen.tsx
│   │   │   ├── EndGameScreen.tsx
│   │   │   ├── ScoringScreen.tsx
│   │   │   ├── SettingsScreen.tsx
│   │   │   ├── StatsScreen.tsx
│   │   │   ├── TutorialScreen.tsx
│   │   │   ├── AchievementsScreen.tsx
│   │   │   ├── LeaderboardScreen.tsx
│   │   │   ├── MatchHistoryScreen.tsx
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── HouseRulesScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── ... (full parity screens)
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── TileLabel.tsx
│   │       └── ScoreBreakdown.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useGameLoop.ts   # Turn orchestration
│   │   ├── useAI.ts         # AI decision trigger
│   │   ├── useAudio.ts      # Sound/music management
│   │   ├── useKeyboard.ts   # Desktop keyboard shortcuts
│   │   └── useResponsive.ts # Responsive layout detection
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/         # ← COPIED from mobile
│   │       ├── zh-TW.json
│   │       ├── zh-CN.json
│   │       └── ja.json
│   ├── types/
│   │   └── index.ts         # ← PORTED from mobile (may need extension)
│   ├── audio/
│   │   └── AudioManager.ts  # Howler.js wrapper
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css            # Tailwind entry
├── e2e/                     # Playwright tests
├── __tests__/               # Vitest unit tests
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── playwright.config.ts
└── package.json
```

---

## 2. Feature Parity Matrix

### 2.1 Core Engine (PORT — direct TypeScript reuse)

| Feature | Mobile File(s) | Web Approach | Parity |
|---------|---------------|--------------|--------|
| Tile set creation (136 tiles) | `engine/tiles.ts` | **Direct copy** — zero changes needed | ✅ 100% |
| Shuffle & deal | `engine/tiles.ts`, `engine/game.ts` | **Direct copy** — pure logic | ✅ 100% |
| Draw tile from wall | `engine/turns.ts` | **Direct copy** | ✅ 100% |
| Discard tile | `engine/turns.ts` | **Direct copy** | ✅ 100% |
| Legal claims (pong/chow/kong) | `engine/turns.ts`, `engine/melds.ts` | **Direct copy** | ✅ 100% |
| Claim resolution (priority) | `engine/turns.ts` | **Direct copy** | ✅ 100% |
| Win detection (standard) | `engine/winning.ts` | **Direct copy** | ✅ 100% |
| Win detection (7 pairs) | `engine/winning.ts` | **Direct copy** | ✅ 100% |
| Win detection (13 orphans) | `engine/winning.ts` | **Direct copy** | ✅ 100% |
| HK Scoring (all faan patterns) | `engine/scoring.ts` | **Direct copy** | ✅ 100% |
| Combo system | `engine/combo-system.ts` | **Direct copy** | ✅ 100% |
| Wind/round management | `engine/wind-rounds.ts` | **Direct copy** | ✅ 100% |
| Flower tiles & replacement draw | `engine/game.ts` | **Direct copy** | ✅ 100% |
| Hand sorting (HK conventions) | `engine/hand-sort.ts` | **Direct copy** | ✅ 100% |
| House rules (presets + custom) | `engine/house-rules.ts` | **Direct copy** | ✅ 100% |
| Game modes (4 modes) | `engine/game-modes.ts` | **Direct copy** | ✅ 100% |
| Lucky tile events | `engine/lucky-tiles.ts` | **Direct copy** | ✅ 100% |
| Payment calculation | `engine/payment.ts` | **Direct copy** | ✅ 100% |
| Replay recording/playback | `engine/replay.ts` | **Direct copy**; playback adapts for web | ✅ 100% |
| Undo manager | `engine/undo.ts` | **Direct copy** | ✅ 100% |
| Multiplayer (pass-and-play) | `engine/multiplayer.ts` | **Direct copy** + web-adapted UI | ✅ 100% |
| Hint system | `engine/hint-system.ts` | **Direct copy** | ✅ 100% |
| Discard advisor | `engine/discard-advisor.ts` | **Direct copy** | ✅ 100% |

### 2.2 AI (PORT — direct TypeScript reuse)

| Feature | Mobile File(s) | Web Approach | Parity |
|---------|---------------|--------------|--------|
| 3 difficulty levels | `ai/index.ts` | **Direct copy** | ✅ 100% |
| Discard selection (shanten-based) | `ai/discard.ts` | **Direct copy** | ✅ 100% |
| Claim decision (win/pong/chow/kong) | `ai/claim.ts` | **Direct copy** | ✅ 100% |
| Defensive play (danger detection) | `ai/defense.ts` | **Direct copy** | ✅ 100% |
| Shanten calculation | `ai/shanten.ts` | **Direct copy** | ✅ 100% |
| AI personalities (6+ profiles) | `ai/personalities.ts` | **Direct copy** | ✅ 100% |
| Advanced AI strategy | `engine/ai-advanced.ts` | **Direct copy** | ✅ 100% |
| AI skill scaling (adaptive) | `engine/ai-scaling.ts` | **Direct copy** | ✅ 100% |
| AI commentary | `engine/ai-commentary-v3.ts` | **Direct copy** | ✅ 100% |

### 2.3 UI — Full Parity Mapping

| Feature | Mobile Implementation | Web Approach | Priority |
|---------|----------------------|-------------|----------|
| **Main Menu** | `MenuScreen.tsx` | React component with framer-motion transitions | P0 |
| **Game Lobby** | `LobbyScreen.tsx`, `GameModeSelectScreen.tsx` | React component; mode cards with Tailwind | P0 |
| **Game Screen** (3D table) | `GameScreen.tsx`, `AnimatedTable.tsx`, `TileView.tsx` | R3F Canvas + HTML HUD overlay | P0 |
| **End Game / Scoring** | `EndGameScreen.tsx`, `ScoringScreen.tsx`, `ScoringReveal.tsx` | React component; score breakdown animation | P0 |
| **Settings** | `SettingsScreen.tsx` | React form; all settings from mobile | P0 |
| **Tutorial** | `TutorialScreen.tsx`, `TutorialMenuScreen.tsx`, `GuidedTutorialScreen.tsx` | Step-by-step with 3D demo scenes | P1 |
| **Stats / Dashboard** | `StatsScreen.tsx`, `StatsScreenV2.tsx`, `StatsDashboardScreen.tsx` | React + Recharts (charts) | P1 |
| **Achievements** | `AchievementsScreen.tsx` | React list with unlock animations | P1 |
| **Leaderboard** | `LeaderboardScreen.tsx` | React, localStorage-backed | P1 |
| **Match History** | `MatchHistoryScreen.tsx` | React list with filter/sort | P1 |
| **Onboarding** | `OnboardingScreen.tsx` | React wizard (language→theme→name) | P0 |
| **House Rules** | `HouseRulesScreen.tsx` | React form with preset selector | P1 |
| **Scoring Guide** | `ScoringGuideScreen.tsx` | React reference with search | P1 |
| **Profile** | `ProfileScreen.tsx`, `AvatarBuilderScreen.tsx` | React; avatar via CSS art / emoji | P2 |
| **Friends System** | `FriendsScreen.tsx` | localStorage; friend codes; comparison | P2 |
| **Shop & Currency** | `ShopScreen.tsx` | React storefront; virtual currency (local) | P2 |
| **Cloud Save** | `CloudSaveScreen.tsx` | JSON export/import + optional server sync | P2 |
| **Backup / Restore** | `BackupRestoreScreen.tsx` | JSON export/import; localStorage management | P2 |
| **Tile Skins** | `TileSkinsScreen.tsx` | 3D material/texture swap on tiles | P2 |
| **Decorations** | `DecorationsScreen.tsx` | 3D table decor (tablecloth, centerpiece) | P2 |
| **Customisation** | `CustomisationContainer.tsx`, `CustomisationScreen.tsx` | Unify tile skins + decorations + theme | P2 |
| **Daily Challenge** | `DailyChallengeScreen.tsx` | Seed-based daily puzzle | P2 |
| **Daily Rewards** | `DailyRewardsScreen.tsx` | Calendar-style reward tracker | P2 |
| **Season Pass** | `SeasonPassScreen.tsx` | Progression track UI | P2 |
| **Tournament** | `TournamentScreen.tsx` | Bracket UI | P2 |
| **Encyclopedia** | `EncyclopediaScreen.tsx` | Searchable tile/scoring reference | P2 |
| **Pattern Collection** | `PatternCollectionScreen.tsx` | Gallery of won patterns | P2 |
| **Journal** | `JournalScreen.tsx` | Game session diary | P2 |
| **Feedback** | `FeedbackScreen.tsx` | Form with rating + category | P2 |
| **Strategy Guide** | `StrategyGuideScreen.tsx` | Reference content | P2 |
| **Practice / Drills** | `PracticeScreen.tsx` | Specific scenario practice | P2 |
| **Replay Viewer** | `ReplayScreen.tsx` | Play back recorded games; VCR controls | P1 |
| **Spectator** | `SpectatorScreen.tsx`, `LiveSpectatorScreen.tsx` | Watch AI-vs-AI games (offline only) | P2 |
| **Performance Monitor** | `PerformanceScreen.tsx` | FPS counter, memory use | P2 |
| **What's New / Changelog** | `WhatsNewScreen.tsx` | Modal/changelog on update | P2 |
| **Shortcuts Reference** | `ShortcutsScreen.tsx` | Keyboard shortcuts overlay | P1 |

### 2.4 Web-Specific Enhancements (beyond mobile parity)

| Feature | Rationale |
|---------|-----------|
| **Keyboard shortcuts** | Desktop-first: D=draw, 1-9=discard slot, P=pass, Space=confirm |
| **Multi-window support** | Play in one tab, stats in another (Zustand + localStorage sync) |
| **Responsive layout** | Desktop primary; tablet secondary; mobile tertiary |
| **3D camera controls** | Orbit around table, zoom, preset views (overhead, player POV) |
| **Table theming** | 3D tablecloth, environment presets (teahouse, night, garden) |
| **PBR materials** | Physically-based tiles (ivory, bamboo, plastic variants) |
| **Particle effects** | 3D particles for win celebrations (confetti, fireworks) |
| **Screen-space reflections** | Polished table surface with reflections |
| **URL deep-linking** | `/game`, `/stats`, `/settings` — shareable URLs |

### 2.5 Scope Cut Decisions

| Feature Cut | Reason |
|-------------|--------|
| Haptics (vibration) | Desktop web has no standard haptic API; skip entirely |
| Push notifications (expo-notifications) | In-app notification center replaces this |
| Native app review prompts (expo-store-review) | Vercel deployment; replace with feedback prompt |
| expo-clipboard | Use `navigator.clipboard` web API |
| expo-linear-gradient | Use CSS `linear-gradient()` |
| AsyncStorage | Use `localStorage` directly (same async wrapper not needed) |
| expo-splash-screen | Use Vite's built-in splash via `<link rel="icon">` |
| Legal compliance consent | Simplified: cookie/GDPR banner as footer banner only |
| Social feed / sharing | Keep basic share (copy-to-clipboard); no server-backed feed |
| Voice chat | Not applicable to single-player web |
| Clan system | Cut for web MVP; may add if multiplayer added later |
| Room system / matchmaking | Cut (offline pass-and-play only; no server) |
| Gacha / Lucky draw | Cut for web MVP; gacha feels predatory on web |
| Mini-games | Cut; stretch goal |
| Trivia | Cut for MVP |

---

## 3. Component Tree

### 3.1 App Shell Hierarchy

```
<App>
├── <I18nProvider>                    # react-i18next wrapper
├── <BrowserRouter>
│   └── <Routes>
│       ├── <OnboardingScreen />      # /onboarding (first visit only)
│       ├── <AppShell>                # Persistent layout wrapper
│       │   ├── <MenuScreen />        # / (main menu)
│       │   ├── <LobbyScreen />       # /lobby
│       │   ├── <GameScreen />        # /game (3D scene + HUD)
│       │   ├── <EndGameScreen />     # /game/result
│       │   ├── <ScoringScreen />     # /game/scoring
│       │   ├── <SettingsScreen />    # /settings
│       │   ├── <StatsScreen />       # /stats
│       │   ├── <TutorialScreen />    # /tutorial
│       │   ├── <AchievementsScreen /># /achievements
│       │   ├── <LeaderboardScreen /> # /leaderboard
│       │   ├── <MatchHistoryScreen /># /history
│       │   ├── ...                  # P1/P2 screens
│       │   └── <HouseRulesScreen />  # /rules
│       └── <NotFound />              # 404
```

### 3.2 Game Screen (deep tree)

```
<GameScreen>                          # Route component
├── <GameHUD>                         # HTML overlay (absolute positioned)
│   ├── <RoundInfoBar />             # Top bar: wind, round, wall count, timer
│   ├── <WindRoundHUD />             # Wind indicators per seat
│   ├── <TurnIndicator />            # "Your turn" / "AI thinking..."
│   ├── <ClaimPanel />               # Pong/Chow/Kong/Win/Pass buttons
│   ├── <TurnTimer />                # Countdown when timer active
│   ├── <HandControls>               # Bottom: interactive tile selection
│   │   ├── <TileLabel />           # Individual tile button (×13/14)
│   │   └── <ConfirmDiscard />      # "Discard" confirmation
│   ├── <DiscardHintOverlay />       # Hint dots on suggested discards
│   ├── <HintButton />               # Coach hint trigger
│   └── <QuickActions />             # Undo, settings, forfeit
│
├── <R3FCanvas>                      # react-three-fiber Canvas
│   ├── <Environment>               # Lighting, skybox, ground
│   │   ├── <ambientLight />
│   │   ├── <directionalLight />    # Sun/key light
│   │   ├── <pointLight />          # Table lamp
│   │   └── <EnvironmentMap />      # Reflection map for tiles
│   ├── <TableScene>                 # Root 3D group
│   │   ├── <TableSurface />        # Green felt table
│   │   │   └── <mesh> (plane with texture)
│   │   ├── <Wall3D />              # The draw wall (stacked tiles)
│   │   │   └── <Tile3D /> ×N
│   │   ├── <OpponentHand area={0}> # Left player
│   │   │   └── <TileBack /> ×13   # Face-down tiles
│   │   ├── <OpponentHand area={1}> # Top player
│   │   │   └── <TileBack /> ×13
│   │   ├── <OpponentHand area={2}> # Right player
│   │   │   └── <TileBack /> ×13
│   │   ├── <PlayerHand>            # Bottom (human) hand
│   │   │   └── <Tile3D /> ×13/14  # Face-up, interactive
│   │   ├── <DiscardPool3D>         # Central discard area
│   │   │   └── <Tile3D /> ×N      # Sorted by order
│   │   ├── <MeldZone area={0..3}> # Each player's exposed melds
│   │   │   └── <Tile3D /> ×3/4
│   │   └── <FlowerZone area={0..3}># Each player's flower display
│   │       └── <Tile3D /> ×N
│   └── <Effects>                   # Particle systems, celebrations
│       ├── <DealAnimation />       # Tiles flying from wall to hands
│       ├── <DiscardAnimation />    # Tile flying from hand to pool
│       ├── <ClaimAnimation />      # Tile flying to meld zone
│       ├── <WinCelebration />      # Confetti, fireworks
│       └── <AmbientParticles />    # Floating dust motes
```

### 3.3 Tile Component Details

```
<Tile3D>
  Props: {
    tile: Tile,             # suit + rank data
    faceUp: boolean,        # show face or back
    position: [x, y, z],   # 3D world position
    rotation: Euler,        # orientation
    onClick?: () => void,   # interactive?
    highlight?: 'none' | 'hover' | 'selected' | 'hint' | 'danger',
  }
  Geometry: BoxGeometry(0.09, 0.12, 0.06)  # Standard tile proportions
  Material:
    - Body: MeshStandardMaterial (ivory white, roughness 0.3)
    - Face: Canvas texture (suit + rank characters engraved)
    - Back: MeshStandardMaterial (dark wood/bamboo texture)
  States:
    - idle: flat on surface
    - hover: lift 0.01m, slight glow
    - selected: lift 0.02m, gold outline
    - hint: subtle pulse animation
    - danger: red glow (opponent's dangerous discard)
```

---

## 4. Data Flow Architecture

### 4.1 Zustand Store Design

```
┌─────────────────────────────────────────────────────────┐
│                    Zustand Stores                       │
│                                                         │
│  ┌──────────────────┐  ┌───────────────────┐           │
│  │   gameStore      │  │  settingsStore    │           │
│  │                   │  │                    │           │
│  │ game: GameState   │  │ soundEnabled       │           │
│  │ phase: Phase      │  │ musicEnabled       │           │
│  │ currentTurn        │  │ themeName          │           │
│  │ selectedTileId     │  │ aiDifficulty       │           │
│  │ claimOptions       │  │ gameSpeed          │           │
│  │ scoreResult        │  │ minFan             │           │
│  │ winnerId           │  │ flowerTiles        │           │
│  │ roundState         │  │ autoSort           │           │
│  │ replayRecorder     │  │ language           │           │
│  │ adaptiveAI         │  │ accessibility       │           │
│  │                    │  │                     │           │
│  │ actions:           │  │ persist: localStorage│           │
│  │  newGame()         │  └───────────────────┘           │
│  │  selectTile()      │                                  │
│  │  confirmDiscard()  │  ┌───────────────────┐           │
│  │  claimAction()     │  │   statsStore      │           │
│  │  runAITurn()       │  │                    │           │
│  │  resolveWin()      │  │ gamesPlayed        │           │
│  │  advanceRound()    │  │ wins, losses       │           │
│  └──────────────────┘  │ winRate, streaks    │           │
│                         │ patternHistory      │           │
│  ┌──────────────────┐  │ achievements        │           │
│  │    uiStore       │  │                    │           │
│  │                   │  │ persist: localStorage│           │
│  │ currentScreen      │  └───────────────────┘           │
│  │ modal: string|null │                                  │
│  │ toast: Toast|null  │  ┌───────────────────┐           │
│  │ cameraPreset       │  │  audioStore       │           │
│  │ showClaimPanel     │  │                    │           │
│  └──────────────────┘  │ sfx volume          │           │
│                         │ music volume        │           │
│  All stores use        │ currentBGM          │           │
│  zustand/middleware     │ soundscape          │           │
│  (persist, devtools)    └───────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Game Loop Data Flow

```
Player Action (click tile → discard)
         │
         ▼
┌──────────────────────┐
│  gameStore.confirm   │  ← User clicks tile + "Discard"
│  Discard()           │
└──────┬───────────────┘
       │ calls engine
       ▼
┌──────────────────────┐
│  engine.discardTile  │  ← Pure function (PORTED)
│  (state, tileId)     │     Updates GameState immutably
└──────┬───────────────┘
       │ state.phase = 'claim'
       │ state.lastDiscard = tile
       ▼
┌──────────────────────┐
│  engine.getLegal     │  ← Check each opponent's
│  Claims(state)       │     pong/chow/kong/win options
└──────┬───────────────┘
       │ returns ClaimIntent[]
       ▼
       ┌─ Has claims? ─┐
       │ YES           │ NO
       ▼               ▼
┌──────────────┐  ┌──────────────┐
│ For each AI  │  │ advanceTurn  │
│ → aiDecide() │  │ → state.phase│
│   (PORTED)   │  │   = 'draw'   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│ resolveClaims│  │ 3D Animation     │
│ (PORTED)     │  │ (R3F)            │
│ → execute    │  │ tile flies to    │
│   claim      │  │ discard pool     │
│ → check win  │  └──────────────────┘
└──────┬───────┘
       │ if win detected
       ▼
┌──────────────────────┐
│  engine.checkWin()   │  ← PORTED
│  engine.calculate    │  ← PORTED
│  Score()             │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  gameStore.setWinner │
│  gameStore.setScore  │
│  uiStore → EndGame   │  ← Route to /game/result
│  statsStore.record() │
└──────────────────────┘

=== AI Turn Cycle ===
     AI player's turn (phase='draw')
              │
              ▼
     ┌────────────────────┐
     │ GameScreen detects │  ← Polling or store subscription
     │ !isHumanTurn       │
     └────────┬───────────┘
              │ setTimeout(aiDelay)
              ▼
     ┌────────────────────┐
     │ useAI hook calls   │
     │ aiDecide(state, id,│  ← PORTED from ai/index.ts
     │   difficulty,      │
     │   personality)     │
     └────────┬───────────┘
              │
              ▼
     ┌────────────────────┐
     │ Execute AI action: │
     │ draw → discard     │
     │ or claim → pass    │
     │ (via engine funcs) │
     └────────┬───────────┘
              │
              ▼
     ┌────────────────────┐
     │ Trigger 3D anim    │
     │ (R3F transitions)  │
     └────────┬───────────┘
              │
              ▼
        advanceTurn()
        → next player (may loop back to AI or reach human)
```

### 4.3 3D Rendering Pipeline

```
┌──────────────────────────────────────────────────────────┐
│                    Zustand Store                         │
│  GameState.wall[], players[].hand[], players[].melds[]   │
│  players[].discards[], lastDiscard, phase, lastDiscardBy │
└──────────────────────┬───────────────────────────────────┘
                       │ subscribe via zustand selector
                       ▼
┌──────────────────────────────────────────────────────────┐
│              R3F Scene Components                        │
│                                                          │
│  <TableScene> reads store → derives 3D positions         │
│    │                                                     │
│    ├─ wall[] → <Wall3D> positions tiles in stacks        │
│    ├─ players[0].hand[] → <PlayerHand> (bottom, face-up) │
│    ├─ players[1..3].hand[] → <OpponentHand> (face-down)  │
│    ├─ players[].melds[] → <MeldZone> per seat            │
│    ├─ players[].discards[] → <DiscardPool3D>            │
│    └─ players[].flowers[] → <FlowerZone> per seat       │
│                                                          │
│  3D Layout (top-down view):                              │
│                                                          │
│           [Opponent 1 — Top]                             │
│    🀫🀫🀫🀫🀫🀫🀫🀫🀫🀫🀫🀫🀫   ← face-down tiles         │
│                                                            │
│  [L]                    [DISCARD]          [R]           │
│  🀫                       🀄🀅🀆             🀫             │
│  🀫                   🀂🀃🀆🀃🀄             🀫             │
│  🀫                                        🀫             │
│  🀫          [WALL — remaining]            🀫             │
│  🀫       🀫🀫🀫🀫🀫🀫🀫🀫🀫🀫                  │
│                                                            │
│           [Player — Bottom (Human)]                       │
│    🀅🀅🀅 🀇🀈🀉 🀙🀚🀛 🀏🀏 ← face-up, sorted by suit     │
│           ↑ interactive, clickable                        │
└──────────────────────────────────────────────────────────┘
```

### 4.4 Animation Pipeline

```
Game Action (discard, pong, win, etc.)
         │
         ▼
┌──────────────────┐
│  engine function │  ← Mutates GameState
│  (pure logic)    │
└──────┬───────────┘
       │
       ├──→ 1. Update Zustand store immediately
       │      (data model is always correct)
       │
       └──→ 2. AnimationContext reads action
              │
              ▼
       ┌─────────────────┐
       │ AnimationQueue   │  ← Queue GSAP/R3F tweens
       │                  │
       │ enqueue({        │
       │   type:'discard',│
       │   tileId,        │
       │   from:[x,y,z],  │
       │   to:[x',y',z'], │
       │   duration:300,  │
       │ })               │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ GSAP timeline    │  ← Awaits animation completion
       │ or useFrame loop │
       │                  │
       │ Animate tile     │
       │ position 0→1     │
       │ with easing      │
       └────────┬────────┘
                │ onComplete
                ▼
       ┌─────────────────┐
       │ After anim done: │
       │ - If turn ended, │
       │   advanceTurn()  │
       │ - If game over,  │
       │   show end screen│
       └─────────────────┘

   DURING animation:
   - Player inputs are disabled (prevent race conditions)
   - Tiles rendered at interpolated positions
   - Physics-based stacking for discard pool (optional)
```

---

## 5. DEV Task Breakdown (P0/P1/P2)

### P0 — Minimum Playable Game (MVP) ≈ 2 weeks

| ID | Task | Description | Acceptance Criteria | Est. |
|----|------|-------------|---------------------|------|
| P0-1 | **Project scaffold** | Init Vite + React + TS + Tailwind + R3F + Zustand. Port `src/types/index.ts`. Configure ESLint/Prettier/tsconfig. | `npm run dev` → blank page; `npm test` → passes | 2h |
| P0-2 | **Port core engine** | Copy `src/engine/*.ts` from mobile to `src/engine/`. Verify all `import` paths resolve. Run existing Vitest equivalents. | All mobile engine tests pass (adapted to Vitest) | 4h |
| P0-3 | **Port AI module** | Copy `src/ai/*.ts` from mobile to `src/ai/`. | AI tests pass | 2h |
| P0-4 | **Port i18n** | Copy locale JSONs. Init i18next + react-i18next. | `t('game.yourTurn')` → "你的回合" | 30m |
| P0-5 | **Zustand gameStore** | Implement game store with `newGame()`, `selectTile()`, `confirmDiscard()`, `claimAction()`, `passAction()`. Wire to engine functions. | Can start a game, draw, discard, see AI respond via console log | 4h |
| P0-6 | **3D Table scene** | R3F canvas with table surface, basic lighting, wall stack (face-down tiles). | Table renders in browser; camera orbits with mouse drag | 3h |
| P0-7 | **3D Tiles** | Implement `<Tile3D>` with BoxGeometry, face texture rendering (canvas-based suit+rank). Face-up and face-down variants. | 136 distinct tiles render correctly | 6h |
| P0-8 | **Player hand rack** | Bottom-row rack with 13 tiles face-up, sorted, clickable. Selection highlight. | Click tile → highlighted; click again → unselected; "Discard" button visible | 4h |
| P0-9 | **Opponent hands** | Left/Top/Right opponent racks with face-down tiles. | 3 AI positions show 13 face-down tiles each | 2h |
| P0-10 | **Discard pool 3D** | Central discard area. Tiles fly from hand to pool on discard (animated). | Human discard → tile appears in center; AI discard → tile appears | 4h |
| P0-11 | **Claim panel** | HTML overlay buttons: Pong/Chow/Kong/Win/Pass. Shows only when legal claims exist. Pass auto-advances turn after timeout. | When AI discards matching tile, claim buttons appear; clicking Pong executes pong | 3h |
| P0-12 | **Game HUD** | RoundInfoBar, TurnIndicator, WindRoundHUD. Back button → menu. | Correct wind/round display; "Your turn" / "AI thinking" messages | 2h |
| P0-13 | **Scoring & End Game** | `EndGameScreen` + `ScoringScreen` showing winner, faan breakdown, payments. | Complete game → score screen with correct breakdown | 3h |
| P0-14 | **Menu → Lobby → Game flow** | Main menu with "New Game" button. Lobby with mode selection + start. | Full flow: menu → lobby → play → end → menu | 3h |
| P0-15 | **Keyboard shortcuts** | D=draw, 1-9/click=select tile, Enter=confirm discard, P=pass, Esc=back | Full game playable with keyboard only | 2h |
| P0-16 | **Settings screen** | Sound, music, theme, difficulty, speed, language settings. Persist to localStorage. | Settings change reflects in game immediately | 3h |

**P0 Milestone**: Complete single game vs 3 AI, with 3D table, scoring, menu/settings. Playable end-to-end.

---

### P1 — Polished Experience ≈ 2 weeks

| ID | Task | Description | Acceptance Criteria | Est. |
|----|------|-------------|---------------------|------|
| P1-1 | **Deal animation** | 13 tiles fly from wall to each player position with staggered timing. | Smooth 1.5s deal animation on `newGame()` | 4h |
| P1-2 | **Discard animation** | Tile lifts from hand, arcs to discard pool, settles. | GSAP tween with arc motion | 3h |
| P1-3 | **Claim animation** | Claimed tile + hand tiles slide to meld zone. | Smooth slide+settle on pong/chow/kong | 3h |
| P1-4 | **Win celebration** | Particles (confetti), screen shake, 3D text "食胡！". | Dramatic win feedback | 4h |
| P1-5 | **Audio system** | Howler.js wrapper. Tile click, draw, discard, pong, win, lose SFX. Background music toggle. | SFX play contextually; music loops | 6h |
| P1-6 | **AI thinking indicator** | Visual feedback when AI is "thinking": pulse on opponent area, "AI thinking..." text. | Clear visual distinction between human turn and AI turn | 2h |
| P1-7 | **Tutorial** | Step-by-step interactive tutorial using guided 3D scenes. Cover: tile recognition, melds, win conditions, scoring basics. | New player can complete tutorial in 5-10 min | 8h |
| P1-8 | **Stats screens** | Basic stats + dashboard with Recharts: win rate trend, faan distribution, games per day. | Charts render from real data | 6h |
| P1-9 | **Achievements** | Achievement definitions + unlock toast + achievement screen. ~20 achievements (first win, 100 games, etc.). | Unlock triggers, toast shows, screen lists | 4h |
| P1-10 | **Leaderboard** | localStorage-backed: highest score, highest faan, fastest win. | Records persist across sessions | 2h |
| P1-11 | **Match history** | List of past games with filter (win/loss/draw), sort (newest/score/duration), detail view. | ~50 games stored, filterable | 4h |
| P1-12 | **Onboarding** | Language → Theme → Name wizard on first visit. | 3-step onboarding; skip available | 2h |
| P1-13 | **House rules** | Preset selector (standard/casual/competitive/beginner) + custom toggles. | Custom rules reflect in game immediately | 3h |
| P1-14 | **Scoring guide** | Searchable reference of all HK scoring patterns with faan values. | All ~20+ patterns with descriptions | 3h |
| P1-15 | **Replay viewer** | Play back recorded games with VCR controls (play/pause/step/speed). | Saved replay plays back deterministically | 6h |
| P1-16 | **Responsive layout** | Tablet-optimized layout (touch-friendly buttons). Mobile fallback (simplified). | Tablet usable; mobile not broken | 4h |
| P1-17 | **Multiplayer pass-and-play** | Local multiplayer: 2-4 human players, pass device between turns. Privacy screen between turns. | 4 humans can play on same device | 4h |
| P1-18 | **Shortcuts reference** | Overlay showing all keyboard shortcuts. | Press ? → overlay appears | 1h |

**P1 Milestone**: Full-featured single-player game with tutorial, stats, achievements, replay, pass-and-play. Polish animations + audio.

---

### P2 — Full Feature Parity ≈ 3 weeks

| ID | Task | Description | Acceptance Criteria | Est. |
|----|------|-------------|---------------------|------|
| P2-1 | **Profile system** | Player name, avatar builder (emoji/preset), stats summary. | Profile persists in localStorage | 2h |
| P2-2 | **Friends system** | Friend codes, add/remove, comparison screen. | 6-digit codes, friend list | 4h |
| P2-3 | **Shop + Currency** | Virtual coin economy. Earn coins from games. Buy tile skins, decorations. | Coin balance + purchase flow | 8h |
| P2-4 | **Tile skins** | 3D material variants: classic ivory, bamboo, jade, gold, plastic. Unlock via shop/achievements. | Texture swap on all tiles | 6h |
| P2-5 | **Table decorations** | Tablecloth patterns, centerpiece objects, environment presets (teahouse, night, garden, rain). | Visual change to 3D table scene | 6h |
| P2-6 | **Soundscapes** | Ambient audio layers: teahouse chatter, night market, garden birds, rain, festival. | Background ambience with volume control | 4h |
| P2-7 | **AI difficulty selector** | Visual difficulty picker with personality preview. Adaptive AI toggle. | Difficulty affects AI play noticeably | 3h |
| P2-8 | **Daily challenge** | Seed-based daily puzzle. Pre-set hand, find optimal discard sequence. | New challenge each day; streak tracking | 6h |
| P2-9 | **Daily rewards** | Calendar-style reward tracker. Login bonus coins. | 7-day reward calendar | 3h |
| P2-10 | **Season pass** | Free + premium progression track with rewards. | 30-level progression | 6h |
| P2-11 | **Tournament mode** | Bracket UI. 8-hand extended play. Harder AI. | Tournament bracket + scoring | 4h |
| P2-12 | **Encyclopedia** | Searchable reference: all tiles, scoring patterns, winds, strategy tips. | Comprehensive reference | 3h |
| P2-13 | **Pattern collection** | Gallery of won patterns with date and score. | Track which patterns you've achieved | 2h |
| P2-14 | **Journal** | Session diary with notes. Auto-saved after each game. | Date-stamped entries with game summary | 2h |
| P2-15 | **Strategy guide** | Written strategy content: tile efficiency, defense, reading discards. | Multiple chapters with examples | 4h |
| P2-16 | **Practice drills** | Specific scenarios: "complete this hand", "find the winning discard", "defensive drill". | 3+ drill types | 6h |
| P2-17 | **Feedback system** | Rating + category + text feedback form. | Submit feedback; thank you screen | 2h |
| P2-18 | **Spectator mode** | Watch AI vs AI games. Camera presets (overhead, follow each player). | AI-vs-AI plays out automatically | 4h |
| P2-19 | **Performance monitor** | FPS counter, draw calls, memory. Quality presets (low/medium/high/auto). | Toggle with Ctrl+Shift+P | 3h |
| P2-20 | **Backup / restore** | Full data export/import as JSON. Section-level restore options. | Reliable data portability | 3h |
| P2-21 | **Winning hand showcase** | 3D display of winning hand with animated reveal. | Cards flip one by one to reveal pattern | 3h |
| P2-22 | **Voice lines** | AI characters speak contextual lines (win, lose, pong, etc.) via Web Speech API or pre-recorded audio. | Audio plays contextually with subtitle | 4h |
| P2-23 | **Accessibility** | Colorblind modes (protanopia/deuteranopia/tritanopia), font size, reduced motion, high contrast. | WCAG AA on all text; colorblind filter on tiles | 4h |
| P2-24 | **What's New / Changelog** | Modal on version update showing new features. | Modal appears once per version bump | 1h |
| P2-25 | **Service Worker / PWA** | Offline support: cache assets, game works without network. Install prompt. | Installable PWA; offline-playable | 4h |

**P2 Milestone**: Complete feature parity with mobile app. Every screen and system present. Web-specific enhancements (3D camera, PBR, keyboard) exceed mobile UX.

---

## 6. QA Strategy

### 6.1 Testing Philosophy

```
        ┌────────────┐
        │  Unit Tests │  Engine, AI, store logic
        │  (Vitest)   │  ~5,000 tests ported from mobile
        └──────┬─────┘
               │
        ┌──────▼─────┐
        │ Integration │  Store ↔ Engine ↔ 3D scene wiring
        │ Tests       │  R3F component tests with vitest
        └──────┬─────┘
               │
        ┌──────▼──────┐
        │  E2E Tests  │  Full game flow in real browser
        │  (Playwright)│  Canvas interaction via CDP
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │   Visual    │  Screenshot diffing for 3D scenes
        │  Regression  │  pixelmatch + Playwright
        └─────────────┘
```

### 6.2 Unit Test Plan (Vitest)

**Engine tests** (ported from mobile — adapt Jest → Vitest):

| Module | Test File | Key Scenarios | Test Count |
|--------|----------|---------------|------------|
| `tiles.ts` | `tiles.test.ts` | Tile set creation (136 tiles), shuffle determinism, flower detection | ~10 |
| `game.ts` | `game.test.ts` | initGame, sortHand, revealFlowers, dealing count | ~8 |
| `turns.ts` | `turns.test.ts` | drawTile, discardTile, getLegalClaims, resolveClaims, wall exhaustion | ~15 |
| `winning.ts` | `winning.test.ts` | Standard win, 7 pairs, 13 orphans, canWinWithTile, tileCounts | ~20 |
| `scoring.ts` | `scoring.test.ts` | All faan patterns, payment calculation, flower bonus | ~25 |
| `melds.ts` | `melds.test.ts` | canPong/doPong, canChow/doChow, kong variants, drawReplacement | ~18 |
| `wind-rounds.ts` | `wind-rounds.test.ts` | Round progression, dealer rotation, consecutive dealer, game over | ~10 |
| `hand-sort.ts` | `hand-sort.test.ts` | Sort by suit, groupBySuit, potential meld detection | ~6 |
| `house-rules.ts` | `house-rules.test.ts` | Preset validation, merge defaults, custom rules | ~8 |
| `combo-system` | `combo-system.test.ts` | Combo multiplier, update rules | ~5 |
| `lucky-tiles` | `lucky-tiles.test.ts` | Event triggers, effects | ~5 |
| `payment.ts` | `payment.test.ts` | Calculate payment, breakdown formatting | ~6 |
| `replay.ts` | `replay.test.ts` | Record, playback, state reconstruction | ~8 |
| `undo.ts` | `undo.test.ts` | Undo/redo stack | ~5 |
| AI modules | `ai/*.test.ts` | discard choice, claim decisions, defense, shanten, personalities | ~30 |

**Total engine tests targeted**: ~200+ unit tests (core logic, ported)

**Store tests**:
- `gameStore.test.ts`: newGame, discard flow, claim flow, win detection, round advance
- `settingsStore.test.ts`: persistence, defaults
- `statsStore.test.ts`: record game, streak calculation, achievement unlock

### 6.3 Integration Test Plan

| Scenario | What to Test |
|----------|-------------|
| Game init → first turn | Store calls engine.initGame → R3F renders correct tile count |
| Human discard → AI claim | Click tile → confirm → AI evaluates claim → claim panel appears |
| Claim resolution | Multiple AIs claim simultaneously → priority resolution correct |
| Full round cycle | Play through all 4 hands → wind rotation → game end at 4th hand end |
| Scoring flow | Win detected → score calculated → score screen renders → stats updated |
| Replay record/play | Play game → replay saved → replay loads → deterministic playback |
| Settings persistence | Change theme → reload page → theme persists |
| i18n switch | Change language → all UI text updates instantly |

### 6.4 E2E Test Plan (Playwright)

**Test environment**: Chromium, Firefox, WebKit. Desktop viewport (1920×1080). Tablet viewport (1024×768).

| ID | Scenario | Steps | Assertions |
|----|----------|-------|-----------|
| E2E-1 | **Complete game flow** | Menu → New Game → Standard mode → Play full game (human wins) → Scoring screen → Back to menu | All screens render; no console errors; score correct |
| E2E-2 | **AI wins** | Play game where AI wins → verify loss screen | Loss screen shown; stats update correctly |
| E2E-3 | **Draw game** | Play until wall exhaustion → verify draw screen | "流局" displayed; no winner |
| E2E-4 | **Claim interactions** | AI discards → human pongs → continue play | Pong executes; 3 tiles in meld zone |
| E2E-5 | **Settings change** | Menu → Settings → Toggle sound off → Back → Check sound icon | Setting persists |
| E2E-6 | **Language switch** | Settings → 日本語 → Verify menu Japanese | Menu items in Japanese |
| E2E-7 | **Tutorial completion** | Menu → Tutorial → Step through all pages → Complete | Tutorial ends with "Done" button |
| E2E-8 | **Keyboard playthrough** | Play entire game using only keyboard | No mouse needed; all actions via keys |
| E2E-9 | **Responsive** | Resize to tablet → verify layout not broken → play game | Game playable at 1024×768 |
| E2E-10 | **Replay** | Complete game → Go to match history → Play replay | Replay reproduces game correctly |
| E2E-11 | **PWA install** | Visit URL → Install prompt appears → Install → Open offline → Play | Works offline; assets cached |
| E2E-12 | **Multiple games** | Play 3 games back-to-back → check stats | Stats accumulate correctly; no memory leak |

### 6.5 Visual Regression Testing

For 3D scenes, pixel-perfect equality is unrealistic (GPU variance). Strategy:

1. **Reference screenshots**: Capture on CI (Chromium, fixed viewport) after `newGame()` → stable state.
2. **Threshold**: pixelmatch with 1.0% threshold (allow tiny GPU differences).
3. **Snapshot regions**:
   - Table + wall area (is wall rendered?)
   - Player hand area (correct tile count?)
   - Discard pool (tiles visible?)
   - Claim panel (buttons rendered?)
4. **Approval workflow**: Human reviews diffs on PR. Baselines committed to repo.
5. **When to run**: On PR, on merge to main, nightly.

### 6.6 Performance Testing

| Metric | Target | Test Method |
|--------|--------|------------|
| FPS during game | ≥60 FPS (desktop) | Playwright + `requestAnimationFrame` counter |
| Initial load time | <3s (Vercel edge) | Lighthouse / WebPageTest |
| Memory usage | <200MB after 5 games | `performance.memory` in browser |
| Bundle size (JS) | <500KB gzipped | `vite build --report` |
| 3D draw calls | <200 per frame | Three.js `renderer.info.render.calls` |
| Input latency | <16ms (1 frame) | `performance.now()` on click → visual change |

### 6.7 CI/CD Pipeline

```
PR Opened
  │
  ├──→ ESLint + Prettier check
  ├──→ TypeScript type-check (tsc --noEmit)
  ├──→ Vitest unit tests (engine + store + components)
  ├──→ Playwright E2E (Chromium, Firefox)
  ├──→ Playwright visual regression (compare screenshots)
  └──→ Bundle size check (compare against baseline)
       │
       ▼ all pass
  Merge to main
       │
       ├──→ Vercel preview deploy
       └──→ Vercel production deploy (after approval)
```

---

## Appendix A: Engine Porting Checklist

When porting engine files from `/home/user/hk-mahjong/src/engine/`:

1. ✅ **Copy file** to `hk-mahjong-web/src/engine/`
2. ✅ **Fix imports** — change any `from '../types'` to `from '../types'` (path should be identical)
3. ✅ **Remove React Native deps** — engine should be pure TS; if any RN import found, extract to web equivalent
4. ✅ **Ensure no side-effects** — engine functions should be pure or mutate passed objects
5. ✅ **Copy corresponding test** and adapt `jest` → `vitest` (mostly find-replace)
6. ✅ **Run `tsc --noEmit`** to verify types
7. ✅ **Run `vitest` on the test** — must pass before marking module as ported

## Appendix B: Zustand Store Shape Reference

```typescript
// gameStore — matches mobile's store.ts
interface GameStore {
  game: GameState | null;          // Full game state
  selectedTileId: number | null;   // Human's selected tile
  newTileId: number | null;        // Just-drawn tile highlight
  claimOptions: ClaimOption[];     // Pong/Chow/Kong/Win options
  scoreResult: ScoreResult | null; // After win detection
  winnerId: number | null;         // Winner player index
  isDraw: boolean;                 // Wall exhausted, no winner
  isSelfDrawn: boolean;            // Human self-draw win
  roundState: RoundState;          // Wind/round tracking
  gameStartTime: number | null;    // performance.now() at game start
  replayRecorder: ReplayRecorder;  // Active replay recorder
  currentReplay: GameReplay | null;
  screen: ScreenName;              // Current route
  playerName: string;
  aiDelay: number;                 // ms before AI acts
  aiDifficulty: AiDifficulty;
  aiPersonalities: AIPersonality[];
  adaptiveAI: boolean;
  skillProfile: PlayerSkillProfile;
  soundEnabled: boolean;           // Plus all settings from mobile
  musicEnabled: boolean;
  themeName: ThemeName;
  gameSpeed: GameSpeed;
  minFan: number;
  flowerTiles: boolean;
  autoSort: boolean;
  showHints: boolean;

  // Actions
  newGame: () => void;
  selectTile: (id: number) => void;
  confirmDiscard: () => void;
  claimAction: (type: ActionType) => void;
  passAction: () => void;
  runAITurn: () => Promise<void>;
  setScreen: (s: ScreenName) => void;
  // ... setters for all settings
}
```

## Appendix C: R3F Best Practices

1. **Use `<Canvas>` only once** — put all 3D content inside one Canvas at App level (or GameScreen level)
2. **Separate state from rendering** — Zustand store drives R3F via selectors, not props drilling
3. **Use `useFrame` sparingly** — only for continuous animations; event-driven animations use GSAP
4. **InstancedMesh for tiles** — all 136 tiles share same geometry; use InstancedMesh for performance
5. **Texture atlas** — single texture atlas for all tile faces (34 unique faces × 4 copies = atlas of 34)
6. **Canvas textures** — generate tile face textures via OffscreenCanvas (fallback to regular Canvas)
7. **Frustum culling** — Three.js handles this automatically; don't overthink
8. **Suspense for models** — use React.Suspense with R3F loading fallback
9. **Leva for debug** — during development, use Leva to tweak lighting/positions/camera
10. **DPI-aware** — `devicePixelRatio: Math.min(window.devicePixelRatio, 2)` to avoid retina performance issues

## Appendix D: Files NOT to Port (Mobile-Only)

| File | Reason |
|------|--------|
| `expo-*` dependencies | React Native platform APIs |
| `@react-native-*` deps | React Native platform APIs |
| `react-native` import usage | Use web equivalents |
| `AsyncStorage` | Use `localStorage` |
| `expo-haptics` | No web haptics API |
| `expo-notifications` | No push notifications on web |
| `expo-clipboard` | Use `navigator.clipboard` |
| `expo-linear-gradient` | Use CSS `linear-gradient()` |
| `expo-splash-screen` | Use Vite HTML splash |
| `expo-av` | Use Howler.js |
| `*.android.*` / `*.ios.*` files | Platform-specific (not needed for web) |
| `src/__mocks__/expo-*` | Mobile platform mocks, not applicable |
