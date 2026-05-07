import { defineConfig, devices } from '@playwright/test'

/**
 * Screenshot-only Playwright config.
 *
 * The demo Vite server hosts the panel at every scene URL. The
 * test in `e2e/screenshots.spec.ts` walks each scene id from
 * `demo/scenes.ts`, navigates, waits for layout, and writes a PNG
 * to `docs/screenshots/`. The PNGs are committed alongside the
 * code so reviewers see UI changes on every PR.
 */

export default defineConfig({
  testDir: './e2e',
  // Single browser is enough — these are presentational screenshots,
  // not behavior tests. Add Firefox/WebKit later if cross-browser
  // pixel parity becomes a concern.
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 1280×1400: wide enough for a real-app header, tall enough
        // to keep the chat panel from clipping a 280px-tall chart
        // visual + its accompanying message bubbles in one frame.
        viewport: { width: 1280, height: 1400 },
        deviceScaleFactor: 2, // 2x for crisp screenshots on retina displays.
      },
    },
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
  },
  webServer: {
    // `vite serve` accepts a positional root + falls back to the
    // workspace's `vite.config.ts` for plugins (we want react()
    // available for the demo). The lib-mode `build` config is
    // ignored under `serve`.
    command: 'npx vite serve demo --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
