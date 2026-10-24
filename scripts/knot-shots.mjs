// Screenshots every step of every knot into one contact sheet per knot (dev aid for checking crossings).
// Usage: node scripts/knot-shots.mjs <baseUrl> <outDir>
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { login } from './login.mjs'

const [base, outDir] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } })
await login(page, base)
await page.goto(`${base}/toolbox/knots`)
const names = await page.$$eval('main button.shrink-0', (bs) => bs.map((b) => b.textContent))
for (const name of names) {
  await page.getByRole('button', { name, exact: true }).click()
  const steps = await page.$$('main ol li button')
  for (let i = 0; i < steps.length; i++) {
    await steps[i].click()
    await page.waitForTimeout(1300)
    const svg = await page.$('main svg[role="img"]')
    await svg.screenshot({ path: join(outDir, `${name.replace(/\W+/g, '-')}-${i + 1}.png`) })
  }
}
await browser.close()
console.log('done')
