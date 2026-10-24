// Visits every route, fails on console errors, and optionally saves screenshots.
// Needs T_SAILOR_USER / T_SAILOR_PASS (see login.mjs).
// Usage: node scripts/smoke.mjs <baseUrl> [screenshotDir] [--mobile] [--dark] [--only=/path,/path]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { login } from './login.mjs'

const [base = 'http://localhost:8090', outDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const mobile = process.argv.includes('--mobile')
const dark = process.argv.includes('--dark')
const onlyArg = process.argv.find((a) => a.startsWith('--only='))

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  deviceScaleFactor: mobile ? 2 : 1,
  colorScheme: dark ? 'dark' : 'light',
})
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(`[${page.url()}] ${m.text()}`))
page.on('pageerror', (e) => errors.push(`[${page.url()}] ${e.message}`))

await login(page, base)
await page.goto(base)
const lessonLinks = await page.evaluate(async () => {
  const res = await fetch('/courses')
  return res.ok
})
if (!lessonLinks) errors.push('/courses did not return 200 (SPA fallback broken?)')

// Collect routes from the rendered app.
const routes = new Set(['/', '/courses', '/lab', '/toolbox', '/weather', '/profile'])
for (const p of ['/courses', '/lab', '/toolbox']) {
  await page.goto(base + p)
  await page.waitForLoadState('networkidle')
  const hrefs = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')))
  hrefs.forEach((h) => routes.add(h))
}
for (const c of [...routes].filter((r) => /^\/courses\/[^/]+$/.test(r))) {
  await page.goto(base + c)
  await page.waitForLoadState('networkidle')
  const hrefs = await page.$$eval('a[href^="/courses/"]', (as) => as.map((a) => a.getAttribute('href')))
  hrefs.forEach((h) => routes.add(h))
}

const list = onlyArg ? onlyArg.slice(7).split(',') : [...routes].sort()
if (outDir) mkdirSync(outDir, { recursive: true })
for (const r of list) {
  await page.goto(base + r)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(700)
  const text = await page.textContent('main')
  if (!text || text.length < 40) errors.push(`[${r}] main content looks empty`)
  if (outDir) {
    const name = (r === '/' ? 'home' : r.slice(1).replaceAll('/', '__')) + (mobile ? '.m' : '') + (dark ? '.d' : '') + '.png'
    await page.screenshot({ path: join(outDir, name), fullPage: true })
  }
}
await browser.close()
console.log(`Checked ${list.length} routes.`)
if (errors.length) {
  console.log(errors.join('\n'))
  process.exit(1)
}
console.log('No console errors.')
