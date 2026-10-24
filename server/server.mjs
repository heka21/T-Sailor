// Tiny JSON API for accounts and per-user progress. No sign-up: users are added with `users.mjs`.
// nginx proxies /api/* here in Docker; Vite proxies it in dev.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { deleteProgress, hashPassword, MIN_PASSWORD, normalizeUsername, readProgress, readSecret, readUsers, verifyPassword, writeProgress, writeUsers } from './store.mjs'

const PORT = Number(process.env.PORT ?? 8091)
const COOKIE = 'ts_session'
const SESSION_DAYS = 180
const MAX_BODY = 256 * 1024
const SECRET = readSecret()

// --- sessions: "<user>.<expiry>.<hmac>" — the hmac also covers the password hash, so changing
// a password (or removing the user) signs out every other device.
function sign(user, exp, hash) {
  return createHmac('sha256', SECRET).update(`${user}.${exp}.${hash}`).digest('base64url')
}

function issue(user, hash) {
  const exp = Date.now() + SESSION_DAYS * 864e5
  return `${user}.${exp}.${sign(user, exp, hash)}`
}

function sessionUser(req) {
  const raw = (req.headers.cookie ?? '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))
  if (!raw) return null
  const [user, exp, sig] = raw.slice(COOKIE.length + 1).split('.')
  const account = readUsers()[user]
  if (!account || !(Number(exp) > Date.now())) return null
  const expected = Buffer.from(sign(user, exp, account.hash))
  const actual = Buffer.from(sig ?? '')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  return { username: user, ...account }
}

function cookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
}

// --- naive brute-force brake: 5 failures per username → locked for a minute.
const failures = new Map()
function locked(user) {
  const f = failures.get(user)
  return f && f.count >= 5 && Date.now() - f.at < 60_000
}
function fail(user) {
  const f = failures.get(user)
  failures.set(user, { count: f && Date.now() - f.at < 60_000 ? f.count + 1 : 1, at: Date.now() })
}

// --- http helpers
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

async function readBody(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw Object.assign(new Error('Body too large'), { status: 413 })
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 })
  }
}

const profile = (u) => ({ username: u.username, name: u.name || u.username, admin: !!u.admin })

function httpError(status, message) {
  return Object.assign(new Error(message), { status })
}

function checkPassword(p) {
  if (typeof p !== 'string' || p.length < MIN_PASSWORD) throw httpError(400, `Passwords need at least ${MIN_PASSWORD} characters.`)
}

function target(users, raw) {
  const user = normalizeUsername(decodeURIComponent(raw))
  if (!user || !users[user]) throw httpError(404, 'No such user.')
  return user
}

const routes = [
  ['POST', '/api/login', async (req, res) => {
    const { username, password } = await readBody(req)
    const user = normalizeUsername(username)
    if (user && locked(user)) return send(res, 429, { error: 'Too many attempts — try again in a minute.' })
    const account = user ? readUsers()[user] : undefined
    if (!account || !(await verifyPassword(password ?? '', account.hash))) {
      if (user) fail(user)
      await new Promise((r) => setTimeout(r, 400))
      return send(res, 401, { error: 'Wrong username or password.' })
    }
    failures.delete(user)
    send(res, 200, profile({ username: user, ...account }), {
      'Set-Cookie': cookie(issue(user, account.hash), SESSION_DAYS * 86400),
    })
  }, { public: true }],

  ['POST', '/api/logout', async (_req, res) => {
    send(res, 204, undefined, { 'Set-Cookie': cookie('', 0) })
  }, { public: true }],

  ['GET', '/api/me', async (_req, res, me) => {
    send(res, 200, profile(me))
  }],

  ['GET', '/api/progress', async (_req, res, me) => {
    send(res, 200, readProgress(me.username))
  }],

  ['PUT', '/api/progress', async (req, res, me) => {
    const data = await readBody(req)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return send(res, 400, { error: 'Expected an object' })
    writeProgress(me.username, data)
    send(res, 204)
  }],

  ['POST', '/api/password', async (req, res, me) => {
    const { current, next } = await readBody(req)
    if (!(await verifyPassword(current ?? '', me.hash))) return send(res, 400, { error: 'Current password is wrong.' })
    checkPassword(next)
    const users = readUsers()
    users[me.username].hash = await hashPassword(next)
    writeUsers(users)
    // Re-issue this device's cookie; other devices are signed out by the new hash.
    send(res, 204, undefined, { 'Set-Cookie': cookie(issue(me.username, users[me.username].hash), SESSION_DAYS * 86400) })
  }],

  // --- admin: manage accounts from the UI
  ['GET', '/api/users', async (_req, res) => {
    const users = readUsers()
    send(res, 200, Object.entries(users).map(([u, a]) => ({
      ...profile({ username: u, ...a }),
      created: a.created,
      completed: Object.keys(readProgress(u)?.completed ?? {}).length,
    })))
  }, { admin: true }],

  ['POST', '/api/users', async (req, res) => {
    const { username, name, password, admin } = await readBody(req)
    const user = normalizeUsername(username)
    if (!user) throw httpError(400, 'Usernames are 1–32 characters: letters, digits, dot, dash or underscore.')
    const users = readUsers()
    if (users[user]) throw httpError(409, `${user} already exists.`)
    checkPassword(password)
    users[user] = { name: String(name ?? '').trim() || user, hash: await hashPassword(password), created: new Date().toISOString(), admin: !!admin }
    writeUsers(users)
    send(res, 201, profile({ username: user, ...users[user] }))
  }, { admin: true }],

  ['PATCH', '/api/users/:user', async (req, res, me, params) => {
    const { name, password, admin } = await readBody(req)
    const users = readUsers()
    const user = target(users, params.user)
    if (user === me.username && admin === false) throw httpError(400, 'You can’t remove your own admin rights.')
    if (name !== undefined) users[user].name = String(name).trim() || user
    if (admin !== undefined) users[user].admin = !!admin
    if (password !== undefined) {
      checkPassword(password)
      users[user].hash = await hashPassword(password)
    }
    writeUsers(users)
    // A new password signs that user out everywhere — keep the admin signed in if it was their own.
    const headers = password !== undefined && user === me.username ? { 'Set-Cookie': cookie(issue(user, users[user].hash), SESSION_DAYS * 86400) } : {}
    send(res, 200, profile({ username: user, ...users[user] }), headers)
  }, { admin: true }],

  ['DELETE', '/api/users/:user', async (_req, res, me, params) => {
    const users = readUsers()
    const user = target(users, params.user)
    if (user === me.username) throw httpError(400, 'You can’t remove yourself.')
    delete users[user]
    writeUsers(users)
    deleteProgress(user)
    send(res, 204)
  }, { admin: true }],

  ['DELETE', '/api/users/:user/progress', async (_req, res, _me, params) => {
    deleteProgress(target(readUsers(), params.user))
    send(res, 204)
  }, { admin: true }],
].map(([method, path, handler, opts = {}]) => ({
  method,
  handler,
  ...opts,
  pattern: new RegExp(`^${path.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`),
}))

createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://x').pathname
  let match
  const route = routes.find((r) => r.method === req.method && (match = r.pattern.exec(path)))
  if (!route) return send(res, 404, { error: 'Not found' })
  try {
    const me = sessionUser(req)
    if (!me && !route.public) return send(res, 401, { error: 'Not signed in' })
    if (route.admin && !me.admin) return send(res, 403, { error: 'Admins only' })
    await route.handler(req, res, me, match.groups ?? {})
  } catch (e) {
    if (!e.status) console.error(e)
    send(res, e.status ?? 500, { error: e.status ? e.message : 'Server error' })
  }
}).listen(PORT, () => console.log(`t-sailor api on :${PORT}`))
