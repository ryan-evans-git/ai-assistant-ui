import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sceneIds } from '../demo/scenes'

// `__dirname` doesn't exist under ESM (this repo is type:module);
// derive it from import.meta.url so the screenshot path stays
// independent of the playwright invocation cwd.
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../docs/screenshots')
mkdirSync(OUT_DIR, { recursive: true })

for (const scene of sceneIds) {
  test(`screenshot: ${scene}`, async ({ page }) => {
    await page.goto(`/?scene=${scene}`)
    // Animations would otherwise capture mid-frame. Disabling
    // them globally also stops the streaming-cursor blink, which
    // reads as visual flicker in screenshots.
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    })
    // Header always renders; wait on it so we don't snap before
    // first paint on slower runners.
    await expect(page.locator('.demo-shell__header')).toBeVisible()
    // Belt-and-suspenders: brief idle wait to let any async
    // useEffect (autofocus, etc.) settle before the snapshot.
    await page.waitForTimeout(150)
    await page.screenshot({
      path: resolve(OUT_DIR, `${scene}.png`),
      fullPage: true,
    })
  })
}
