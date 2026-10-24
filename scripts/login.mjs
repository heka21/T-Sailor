// Signs the Playwright page in so scripts can reach the app behind the login screen.
// Credentials come from T_SAILOR_USER / T_SAILOR_PASS (add one with `pnpm user add <name>`).
export async function login(page, base) {
  const username = process.env.T_SAILOR_USER
  const password = process.env.T_SAILOR_PASS
  if (!username || !password) throw new Error('Set T_SAILOR_USER and T_SAILOR_PASS to sign in.')
  const res = await page.request.post(`${base}/api/login`, { data: { username, password } })
  if (!res.ok()) throw new Error(`Sign-in failed: ${res.status()} ${await res.text()}`)
}
