# FIX STORIES: hk-mahjong-web — QA Bug Triage

**Author:** BA
**Date:** 2026-05-21
**Source:** QA report (task t_e895cbc0) — 212/212 tests passing, 6 bugs found
**Target:** DEV assignment for remediation

---

## Execution Order & Dependency Graph

```
STORY-001 (CRITICAL: GameScreen wiring)
    │
    ├── STORY-002 (MAJOR: TS build errors) → parallel
    ├── STORY-003 (MAJOR: tsconfig exclude) → parallel
    │
    ├── STORY-004 (MINOR: SettingsStore persistence)
    │
    └── STORY-005 (MINOR: Game flow E2E tests) ← depends on STORY-001 RESOLVED
        (DO NOT START until STORY-001 is done & verified by QA)

STORY-006 (MINOR: axe-core scan) → independent, can be done anytime
```

**Recommended sprint order:**
1. STORY-001 → deploy → verify
2. STORY-002 + STORY-003 (parallel, both quick) → verify `npm run build` passes
3. STORY-004 → verify settings survive refresh
4. STORY-005 → handoff to QA for game flow E2E test authoring + execution
5. STORY-006 → anytime after STORY-001

---

## STORY-001: Wire GameScreen to Zustand gameStore

**Severity:** 🔴 CRITICAL
**Effort:** 🟡 Medium (4-6 hours)
**File(s):** `src/components/screens/GameScreen.tsx`
**Story Points:** 5

### Summary

`GameScreen.tsx` currently uses a static `MOCK_STATE` constant for visual development. The Zustand `gameStore` (`@/store/gameStore.ts`) is fully implemented with `newGame()`, `selectTile()`, `confirmDiscard()`, `claimAction()`, `passAction()`, and `runAITurn()`. The wiring plan is already documented in comments at lines 9-36 of GameScreen.tsx. This story implements that wiring plan, making the game actually playable.

### Acceptance Criteria

1. **AC-001: Store Integration**
   - `GameScreen` imports and uses `useGameStore` from `@/store/gameStore`
   - All `useState<TableSceneState>(MOCK_STATE)` stubs are removed
   - `gameState` is derived reactively from `useGameStore(s => s.game)`

2. **AC-002: TableSceneState Derivation**
   - `wall` → `game.wall`
   - `players[i].hand` → `game.players[i].hand`
   - `players[i].melds` → `game.players[i].melds`
   - `players[i].discards` → game's merged discards (derive from all players or use `allDiscards` if store provides it)
   - `currentTurn` → `game.currentTurn`
   - `allDiscards` → merged from all 4 players' discards

3. **AC-003: Action Wiring**
   - Clicking a tile calls `useGameStore.getState().selectTile(tile.id)`
   - Clicking an already-selected tile triggers discard (double-click behavior per store's selectTile)
   - "Discard" button calls `useGameStore.getState().confirmDiscard()`
   - "Draw" button calls `useGameStore.getState().runAITurn()` (when `phase === 'draw'`)
   - Claim buttons (Pong/Chow/Kong/Win) call `useGameStore.getState().claimAction(type)`
   - "Pass" button calls `useGameStore.getState().passAction()`

4. **AC-004: HUD Props**
   - `wind` → derived from `game.prevailingWind` or round state
   - `round` → derived from round state
   - `dealer` → `game.dealer`
   - `isHumanTurn` → `game.currentTurn === 0` (player 0 is human)
   - `phase` → `useGameStore(s => s.phase)`
   - `claims` → `useGameStore(s => s.claimOptions)`
   - `claimTimeoutMs` → 5000 (keep constant for now)
   - `canDraw` → `phase === 'draw'`
   - `timerRunning` → `isHumanTurn && (phase === 'draw' || phase === 'discard')`
   - `canUndo` → check gameStore's undo state or `false` initially

5. **AC-005: New Game Initialization**
   - on mount, if `game === null`, call `useGameStore.getState().newGame()` (or wire to lobby's new game flow)

6. **AC-006: MOCK_STATE Removal**
   - The entire `MOCK_STATE` constant (lines 40-67) and wiring plan comments (lines 9-36) are removed
   - No unused imports remain (`useState` should still be present if needed for other local state)

7. **AC-007: Build & Type Check**
   - `npm run build` passes with no new type errors
   - `tsc --noEmit` passes

### Implementation Notes

- The `gameStore.selectTile()` already handles the double-click-to-discard UX pattern (if same tile clicked twice, it calls `confirmDiscard()` internally). The GameScreen click handler should just call `useGameStore.getState().selectTile(tileId)`.
- `selectedTileId` is available from `useGameStore(s => s.selectedTileId)` — replace the local `useState` for selectedTileId.
- The `allDiscards` field in TableSceneState must be derived. The store's `game.players[i].discards` arrays can be merged. Note: in the mobile engine, discards may be stored as a flat array on game level — check the `GameState` type.
- The `newGame()` call should be triggered from the lobby screen, not GameScreen mount. If mounted at `/game` without an active game, redirect to `/lobby` or auto-start.
- Keep the `useNavigate` for back navigation (`handleBack`).
- Camera controls and 3D scene (R3F Canvas + TableScene) are already wired to `gameState` prop — the wiring is purely about the data source.

### Risk

- If `TableSceneState` type doesn't match `GameState` shape exactly, a mapping layer may be needed. Current MOCK_STATE uses `{ suit, rank, id }` objects for tiles, which matches the engine's `Tile` type — good.
- The `allDiscards` derivation needs careful merging logic. Ask dev to verify whether engine stores a flat `game.discards` or only per-player.

### Test Plan

- Unit: Verify GameScreen renders without crash (basic smoke)
- E2E: Start a game from lobby → see tiles on 3D table → click a tile → tile highlights → click again → tile discarded → AI responds (visible via HUD turn indicator)
- Manual: Navigate `/game` directly → should redirect to lobby or auto-start game

---

## STORY-002: Fix TypeScript build errors (WinCelebration + engine/undo)

**Severity:** 🟠 MAJOR
**Effort:** 🟢 Small (1-2 hours)
**File(s):** `src/components/effects/WinCelebration.tsx`, `src/engine/index.ts`, `src/engine/undo.ts`
**Story Points:** 2

### Summary

Two TypeScript errors block `npm run build`:
1. **WinCelebration.tsx lines 111, 117**: `bufferAttribute` JSX elements use `count`/`array`/`itemSize` props, but @react-three/fiber expects `args` prop (a THREE.BufferAttribute constructor tuple).
2. **engine/index.ts line 38**: Exports `createUndoManager` from `./undo`, but `undo.ts` only exports `UndoManager` class — no factory function exists.

### Acceptance Criteria

**Part A — WinCelebration.tsx**

1. **AC-002A-001**: Replace `count`/`array`/`itemSize` pattern with `args` prop
   ```tsx
   // BEFORE (broken)
   <bufferAttribute
     attach="attributes-position"
     count={particleCount}
     array={positions}
     itemSize={3}
   />
   // AFTER
   <bufferAttribute
     attach="attributes-position"
     args={[positions, 3]}
   />
   ```
2. **AC-002A-002**: Both `attributes-position` (line 111) and `attributes-color` (line 117) are fixed
3. **AC-002A-003**: Particle count is derived: `count = positions.length / 3` — verify this is correct (positions is `Float32Array` of length `particleCount * 3`, so count = particleCount)

**Part B — engine/undo.ts + engine/index.ts**

**Option A (recommended):** Add factory function to `undo.ts`
   ```ts
   export function createUndoManager(maxHistory = 10): UndoManager {
     return new UndoManager(maxHistory);
   }
   ```
   Keep engine/index.ts line 38 unchanged.

**Option B (simpler, if no consumers use `createUndoManager`):** Change engine/index.ts line 38 to:
   ```ts
   export { UndoManager } from './undo';
   ```
   But note line 39 already exports `UndoManager` as a type — both can coexist.

Recommend **Option A** for consistency with other engine modules (e.g., `createReplayRecorder` from replay).

4. **AC-002B-001**: `UndoManager` is exportable from `./undo` in a way that satisfies engine/index.ts line 38
5. **AC-002B-002**: `npm run build` + `tsc --noEmit` both pass with zero errors

### Implementation Notes

- The `bufferAttribute` in R3F v8+ uses `args` as the constructor arguments tuple. `attach` pins it to the correct geometry attribute slot.
- Verify the `count` calculation: `args={[positions, 3]}` where `positions` is `Float32Array(particleCount * 3)`. Three.js calculates `count = array.length / itemSize` automatically.
- If Option A is chosen for engine/undo, add JSDoc to the factory function.
- If Option B is chosen, remove or update line 39's `export type { UndoManager }` since `export { UndoManager }` from line 38 already exports both value and type (TypeScript 3.8+).

### Risk

- **Low**. Both changes are mechanical. The WinCelebration fix might need to verify particle behavior still works (the `count` prop was passed to the JSX element before; now it's derived from args). Test that confetti still renders.

### Test Plan

- Build: `npm run build` passes
- Type check: `tsc --noEmit` passes
- Visual: Start game → win → confetti particles render correctly
- Unit: Verify `createUndoManager()` factory returns valid UndoManager instance (if writing unit test)

---

## STORY-003: Exclude E2E test files from tsc build scope

**Severity:** 🟠 MAJOR
**Effort:** 🟢 Trivial (15 min)
**File(s):** `tsconfig.app.json`
**Story Points:** 1

### Summary

`tsconfig.app.json` includes `"e2e"` in its `include` array, causing Playwright test files to be type-checked during `tsc --noEmit`. Playwright tests have `page` parameter implicitly typed `any`, causing 4 build errors. Fix by excluding `e2e` or removing from include.

### Acceptance Criteria

1. **AC-003-001**: `e2e` directory is excluded from tsc type checking
2. **AC-003-002**: `npm run build` and `tsc --noEmit` pass with zero errors from e2e files
3. **AC-003-003**: Playwright tests still run correctly (`npx playwright test`) — Playwright uses its own tsconfig

### Fix Options

**Option A (recommended):** Add explicit exclude
```json
{
  "include": ["src", "__tests__", "e2e"],
  "exclude": ["e2e"]   // ← add this
}
```

**Option B:** Remove `"e2e"` from include array
```json
{
  "include": ["src", "__tests__"]
}
```

Recommend **Option A** — explicit exclude is self-documenting.

### Test Plan

- `tsc --noEmit` → 0 errors
- `npx playwright test` → still runs all e2e tests

---

## STORY-004: Wire SettingsScreen to Zustand settingsStore with persistence

**Severity:** 🟡 MINOR
**Effort:** 🟡 Medium (2-3 hours)
**File(s):** `src/components/screens/SettingsScreen.tsx`, `src/store/settingsStore.ts` (may need minor field addition)
**Story Points:** 3

### Summary

`SettingsScreen.tsx` manages all settings via local `useState` hooks (8 separate states: soundEnabled, musicEnabled, autoSort, showHints, aiDifficulty, gameSpeed, language, theme). These settings are lost on page refresh despite the screen saying "設定會自動儲存到本機" (auto-saved locally). Meanwhile, `settingsStore.ts` already exists with Zustand `persist` middleware (localStorage key: `hk-mahjong-settings`), offering `updateSetting()` and `resetDefaults()`.

### Acceptance Criteria

1. **AC-004-001: Store Integration**
   - All 8 `useState` calls are replaced with `useSettingsStore` selectors
   - `updateSetting(key, value)` is used for all mutations
   - No local `useState` for settings remains in the component

2. **AC-004-002: Field Mapping** (mismatches between SettingsScreen and settingsStore)
   - `showHints` → **Add to settingsStore** if not present (currently not in store). Add `showHints: boolean` to `SettingsData` interface and `DEFAULTS` with default `true`.
   - `theme` → Map to `themeName` in store. SettingsScreen shows options: dark/light/teahouse. Store has: classic/dark/teahouse/garden/night.
     - **Option A**: Add `light` to store's `ThemeName` union
     - **Option B**: Add `classic`, `garden`, `night` options to SettingsScreen UI
     - **Recommendation: Option B** — expand SettingsScreen to show all 5 themes; `light` maps to `classic` (which is the light theme in the spec).

3. **AC-004-003: Persistence Verification**
   - Change settings → refresh page → settings retained
   - Open new tab → settings propagate from localStorage
   - `resetDefaults()` resets all to factory default

4. **AC-004-004: UI State**
   - The settings toggles/selects should reflect the store values on mount, not hardcoded defaults
   - The "設定會自動儲存到本機" text at the bottom stays (it's now accurate!)

5. **AC-004-005: Build**
   - `npm run build` passes
   - No TypeScript errors

### Implementation Notes

- The store uses `updateSetting(key, value)` where key is a string union of all settings keys. The component can call:
  ```tsx
  const { soundEnabled, updateSetting } = useSettingsStore(
    s => ({ soundEnabled: s.soundEnabled, updateSetting: s.updateSetting })
  );
  // ...
  <SettingToggle onChange={(v) => updateSetting('soundEnabled', v)} />
  ```
- Add `showHints` to the store:
  ```ts
  // In settingsStore.ts
  showHints: boolean;  // add to SettingsData
  // In DEFAULTS
  showHints: true,
  ```
- Theme mapping strategy: keep store's `ThemeName` (classic/dark/teahouse/garden/night), update SettingsScreen select options to match.
- The `light` option currently in SettingsScreen maps to `classic` in the store.

### Risk

- **Medium**. The field mismatch (`theme` vs `themeName`, `showHints` missing) requires schema reconciliation. Needs dev judgment on whether to expand SettingsScreen UI or contract the store.
- Settings screen E2E tests (`e2e/settings.spec.ts`, 6 tests) may need updating if field keys change.

### Test Plan

- E2E: `e2e/settings.spec.ts` — update selectors if field keys change, verify persistence
- Manual: Change settings → Cmd+R → verify values retained
- Unit: settingsStore persists to localStorage

---

## STORY-005: Author game flow E2E tests (blocked by STORY-001)

**Severity:** 🟡 MINOR (escalates to MAJOR if STORY-001 resolved without these)
**Effort:** 🔴 Large (8-12 hours)
**Blocked by:** STORY-001 (GameScreen wiring) — **DO NOT START until STORY-001 is verified by QA**
**Assignee:** qa (QA specialist — not dev)
**File(s):** `e2e/game-flow.spec.ts` (new file)
**Story Points:** 8

### Summary

Once GameScreen is wired to gameStore (STORY-001 complete), 8 categories of game flow E2E tests can be authored and executed. QA found the app shell, navigation, settings, and visual regression all pass — but the core game loop (draw→discard→claim→win→score→round) has zero E2E coverage because the game wasn't playable at test time.

### Test Categories (8 scenarios)

| # | Category | What to Test |
|---|----------|-------------|
| 1 | **Game Setup** | Start new game from lobby → tiles dealt → player hand visible (13 tiles face-up, others face-down) |
| 2 | **Draw & Discard** | Draw a tile from wall → hand size becomes 14 → select a tile → discard → hand back to 13 → wall count decreases |
| 3 | **AI Response** | After human discards → AI players draw/discard → turn indicator changes → HUD shows "AI thinking..." |
| 4 | **Pong Claim** | AI discards a tile that forms a triple → claim panel shows Pong option → click Pong → meld zone shows 3 tiles |
| 5 | **Chow Claim** | Preceding player discards sequential tile → claim panel shows Chow → click Chow → meld zone updated |
| 6 | **Kong Claim** | Discarded tile matches 3 held → claim Kong → draw replacement → wall count decreases by 1 extra |
| 7 | **Win Detection** | Arrange winning hand → self-draw win detected → EndGameScreen shown with scoring breakdown |
| 8 | **Round Flow** | Complete a round → dealer rotates → wind advances → next round starts → verify scoring carries over |

### Acceptance Criteria

1. **AC-005-001**: `e2e/game-flow.spec.ts` created with minimum 12 tests covering all 8 categories above
2. **AC-005-002**: All tests pass in headless Chromium (`npx playwright test --project=chromium-desktop`)
3. **AC-005-003**: Tests work in CI (no reliance on `/mnt/` paths, no hardcoded timeouts > 30s)
4. **AC-005-004**: Test fixtures: use `page.evaluate()` or Playwright's `locator` API to interact with the 3D canvas (R3F renders to `<canvas>`, so interaction via coordinates or keyboard shortcuts)
5. **AC-005-005**: Tests include assertions for:
   - Hand tile count (13/14)
   - Wall tile count (decreases on draws)
   - Phase transitions (draw → discard → claim → draw)
   - Turn indicator (shows "你的回合" / "AI 思考中...")
   - Score display after win
   - New round starts after round end

### Implementation Notes

- Use keyboard shortcuts if available (D=draw, number keys=discard slot, Space=confirm, P=pass) for more reliable E2E interaction than canvas coordinates.
- The game store has deterministic initial state from `initGame()` — can use `page.evaluate(() => window.__gameStore.getState().newGame())` to set up test state if direct UI flow is flaky.
- Consider adding `data-testid` attributes to HUD elements during STORY-001 for testability.
- Playwright's `page.waitForSelector()` with text content matchers works for HUD overlays (HTML, not canvas).

### Risk

- Canvas interaction in Playwright is inherently fragile. Keyboard shortcuts are much more reliable. Ensure STORY-001 verifies keyboard shortcuts work before handing off.
- If game flow is still buggy after STORY-001, some tests may need to be skipped or annotated with `test.fixme()`.

### Test Plan (for this story itself)

- Run all 12+ tests → must pass
- Run in CI → must pass
- Check test duration < 60s for full suite

---

## STORY-006: Run axe-core accessibility scan on all screens

**Severity:** 🟡 MINOR
**Effort:** 🟢 Small (1-2 hours)
**Assignee:** qa (or dev if QA unavailable)
**File(s):** `e2e/accessibility.spec.ts` (extend), possibly `e2e/axe-scan.spec.ts` (new)
**Story Points:** 2

### Summary

`@axe-core/playwright` is installed but no axe scan has been run. Run automated accessibility audits on all screens to detect WCAG 2.1 AA violations. The QA report notes dark theme color contrast is the most likely area needing attention.

### Acceptance Criteria

1. **AC-006-001**: axe-core scan runs on every navigable screen route:
   - `/` (Menu)
   - `/settings`
   - `/lobby`
   - `/game` (HUD overlay only — canvas is not scannable by axe)
   - `/stats`
   - `/tutorial`
   - Any other implemented P0 screen

2. **AC-006-002**: All critical and serious violations are documented in a comment or separate report
3. **AC-006-003**: WCAG violations that are easy to fix (color contrast, ARIA labels, heading hierarchy) have fix suggestions
4. **AC-006-004**: Test file committed: `e2e/axe-scan.spec.ts`

### Implementation Notes

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('accessibility — axe scan', () => {
  test('menu screen has no critical a11y violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });
  // ... repeat for each screen
});
```

- Skip violations that are inherently unfixable (canvas has no DOM, color contrast on decorative elements).
- The game screen's 3D canvas cannot be audited by axe — that's expected. Focus on the HUD overlay HTML elements.
- Flag results as informational — do not block build on axe failures unless they are critical contrast issues.

### Risk

- **Low**. axe scans are additive (won't break existing tests). Common violations (contrast, labels) are quick CSS fixes.

### Test Plan

- Run `npx playwright test e2e/axe-scan.spec.ts` → verify no critical failures
- Review results → file follow-up bugs if serious violations found

---

## Summary Table

| Story | Bug IDs | Severity | Effort | SP | Blocks | Blocked By |
|-------|---------|----------|--------|----|--------|-----------|
| STORY-001 | BUG-001 | CRITICAL | Medium (4-6h) | 5 | STORY-005 | — |
| STORY-002 | BUG-002 | MAJOR | Small (1-2h) | 2 | — | — |
| STORY-003 | BUG-003 | MAJOR | Trivial (15m) | 1 | — | — |
| STORY-004 | BUG-004 | MINOR | Medium (2-3h) | 3 | — | — |
| STORY-005 | BUG-005 | MINOR | Large (8-12h) | 8 | — | STORY-001 |
| STORY-006 | BUG-006 | MINOR | Small (1-2h) | 2 | — | — |

**Total estimated effort:** 16-26 hours across 6 stories
**Critical path:** STORY-001 → STORY-005 (12-18 hours)
**Parallel track:** STORY-002 + STORY-003 + STORY-004 (3-6 hours, can run in parallel with STORY-001)

---

## Recommended Sprint Plan

### Sprint Day 1 (STORY-001 only)
- Dev picks up STORY-001 (GameScreen wiring)
- This is the pipeline blocker — everything hinges on it
- QA should NOT start STORY-005 until STORY-001 is deployed and smoke-tested

### Sprint Day 2 (parallel work)
- Dev A: STORY-001 continued (if not done) or STORY-004 (SettingsStore)
- Dev B: STORY-002 + STORY-003 (quick fixes, both)

### Sprint Day 3
- QA picks up STORY-005 (game flow E2E) once STORY-001 verified
- Dev B picks up STORY-006 (axe scan) or helps with STORY-005 test harness

### Verification Checklist (before marking project done)
- [ ] `npm run build` passes (STORY-002 + STORY-003)
- [ ] `tsc --noEmit` passes (STORY-002 + STORY-003)
- [ ] Game is playable: start → draw → discard → AI responds → claim → win → score (STORY-001)
- [ ] Settings survive page refresh (STORY-004)
- [ ] All E2E game flow tests pass (STORY-005)
- [ ] All prior E2E tests (navigation, settings, responsive, etc.) still pass (regression)
- [ ] axe scan runs with no critical violations (STORY-006)

---

## SPEC.md Impact Assessment

No scope changes needed to SPEC.md. The SPEC already defines:
- GameScreen wired to gameStore (section 3.2 + 4.2)
- SettingsStore with Zustand persist (section 4.1)
- E2E testing with Playwright (section 1.1)

These bugs are implementation gaps, not spec changes. The SPEC.md at `/home/user/hk-mahjong-web/SPEC.md` remains accurate.

**One minor note:** SettingsScreen currently includes `showHints` as a toggle, which is not in SPEC.md's settingsStore design. This is a natural UI evolution and doesn't conflict with the spec. Recommend adding it to the store as recommended in STORY-004.
