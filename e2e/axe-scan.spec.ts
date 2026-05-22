import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ─── Helpers ────────────────────────────────────────────────────

/** Bypass onboarding so we land on the menu screen */
async function bypassOnboarding(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/** Run WCAG 2.1 AA axe-core scan, optionally excluding elements */
async function runAxeScan(page: Page, opts: { exclude?: string[] } = {}) {
  let builder = new AxeBuilder({ page } as never)
    .options({
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    });

  if (opts.exclude && opts.exclude.length > 0) {
    builder = builder.exclude(opts.exclude);
  }

  return builder.analyze();
}

/**
 * Filter out violations where every affected node is a <canvas> element.
 * (3D scene rendered by @react-three/fiber — expected, not fixable)
 */
function filterCanvasOnlyViolations(violations: Record<string, unknown>[]) {
  return violations.filter((v) => {
    const nodes = (v as { nodes?: { target?: unknown[] }[] }).nodes ?? [];
    const allCanvas = nodes.every((node) => {
      const target = node.target ?? [];
      return target.every((t) => {
        const s = String(t);
        return s === 'canvas' || s.startsWith('canvas');
      });
    });
    return !allCanvas;
  });
}

/** Log violations in a structured way for debugging */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logViolations(label: string, violations: any[]) {
  if (violations.length === 0) return;
  console.log(`\n── ${label} (${violations.length}) ──`);
  for (const v of violations) {
    console.log(`  [${v.impact || 'unknown'}] ${v.id}: ${v.help}`);
    console.log(`    ${v.helpUrl}`);
    console.log(`    Nodes: ${v.nodes.length}`);
    for (const n of v.nodes.slice(0, 3)) {
      console.log(`      - ${(n as { target?: string[] }).target?.join(' > ') || '?'}`);
      console.log(`        ${((n as { failureSummary?: string }).failureSummary || '').split('\n')[0]}`);
    }
    if (v.nodes.length > 3) console.log(`      … +${v.nodes.length - 3} more`);
  }
}

// ─── Tests ──────────────────────────────────────────────────────

test.describe('WCAG 2.1 AA — axe-core Accessibility Audit', () => {

  // 1. Menu screen (/)
  test('Menu (/) — no critical or serious violations', async ({ page }) => {
    await bypassOnboarding(page);
    await page.waitForTimeout(1000);

    const results = await runAxeScan(page);
    logViolations('Menu /', results.violations);

    const critical = results.violations.filter((v: Record<string, unknown>) => v.impact === 'critical');
    expect(critical).toHaveLength(0);

    const serious = results.violations.filter((v: Record<string, unknown>) => v.impact === 'serious');
    expect(serious).toHaveLength(0);
  });

  // 2. Settings (/settings)
  test('Settings (/settings) — no critical or serious violations', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const results = await runAxeScan(page);
    logViolations('Settings /settings', results.violations);

    const critical = results.violations.filter((v: Record<string, unknown>) => v.impact === 'critical');
    expect(critical).toHaveLength(0);

    const serious = results.violations.filter((v: Record<string, unknown>) => v.impact === 'serious');
    expect(serious).toHaveLength(0);
  });

  // 3. Lobby (/lobby)
  test('Lobby (/lobby) — no critical or serious violations', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/lobby');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const results = await runAxeScan(page);
    logViolations('Lobby /lobby', results.violations);

    const critical = results.violations.filter((v: Record<string, unknown>) => v.impact === 'critical');
    expect(critical).toHaveLength(0);

    const serious = results.violations.filter((v: Record<string, unknown>) => v.impact === 'serious');
    expect(serious).toHaveLength(0);
  });

  // 4. Game screen (/game) — HUD overlay + 3D table
  test('Game (/game) — no critical or serious violations (excl. canvas)', async ({ page }) => {
    await page.goto('/game');
    // Allow 3D scene + WebGL to fully initialize
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    // Exclude <canvas> — 3D scene rendered by @react-three/fiber
    const results = await runAxeScan(page, { exclude: ['canvas'] });
    const violations = filterCanvasOnlyViolations(results.violations);
    logViolations('Game /game (excl. canvas)', violations);

    const critical = violations.filter((v: Record<string, unknown>) => v.impact === 'critical');
    expect(critical).toHaveLength(0);

    const serious = violations.filter((v: Record<string, unknown>) => v.impact === 'serious');
    expect(serious).toHaveLength(0);
  });

  // 5. Stats (/stats)
  test('Stats (/stats) — no critical or serious violations', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const results = await runAxeScan(page);
    logViolations('Stats /stats', results.violations);

    const critical = results.violations.filter((v: Record<string, unknown>) => v.impact === 'critical');
    expect(critical).toHaveLength(0);

    const serious = results.violations.filter((v: Record<string, unknown>) => v.impact === 'serious');
    expect(serious).toHaveLength(0);
  });

  // 6. Tutorial (/tutorial)
  test('Tutorial (/tutorial) — no critical or serious violations', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/tutorial');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const results = await runAxeScan(page);
    logViolations('Tutorial /tutorial', results.violations);

    const critical = results.violations.filter((v: Record<string, unknown>) => v.impact === 'critical');
    expect(critical).toHaveLength(0);

    const serious = results.violations.filter((v: Record<string, unknown>) => v.impact === 'serious');
    expect(serious).toHaveLength(0);
  });
});
