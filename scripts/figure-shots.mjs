// Screenshots each diagram/simulator block on the given pages (dev aid for visual review).
// Usage: node scripts/figure-shots.mjs <baseUrl> <outDir> /path [/path ...]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { login } from './login.mjs'

const [base, outDir, ...paths] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await login(page, base)
for (const p of paths) {
  await page.goto(base + p)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
  const blocks = await page.$$('main .not-prose')
  let n = 0
  for (const b of blocks) {
    n++
    await b.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await b.screenshot({ path: join(outDir, `${p.split('/').pop()}-${n}.png`) })
  }
}
await browser.close()
console.log('done')
