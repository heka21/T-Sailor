// File-backed storage for users and their progress. Everything lives under DATA_DIR:
//   users.json            { [username]: { name, hash, created, admin? } }
//   progress/<user>.json  whatever the client saves (completed lessons, checklists, theme…)
//   secret                HMAC key for session cookies (generated on first run)
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb)

export const DATA_DIR = process.env.DATA_DIR ?? join(import.meta.dirname, '..', 'data')
const USERS = join(DATA_DIR, 'users.json')
const PROGRESS = join(DATA_DIR, 'progress')
mkdirSync(PROGRESS, { recursive: true })

function writeAtomic(path, text) {
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, text)
  renameSync(tmp, path)
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    if (e.code === 'ENOENT') return fallback
    throw e
  }
}

export function normalizeUsername(raw) {
  const u = String(raw ?? '').trim().toLowerCase()
  return /^[a-z0-9][a-z0-9._-]{0,31}$/.test(u) ? u : null
}

export const MIN_PASSWORD = 10

export const readUsers = () => readJson(USERS, {})
export const writeUsers = (users) => writeAtomic(USERS, JSON.stringify(users, null, 2) + '\n')

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, 32)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password, stored) {
  const [, salt, key] = String(stored).split('$')
  if (!salt || !key) return false
  const expected = Buffer.from(key, 'base64')
  const actual = await scrypt(String(password), Buffer.from(salt, 'base64'), expected.length)
  return timingSafeEqual(actual, expected)
}

export const readProgress = (user) => readJson(join(PROGRESS, `${user}.json`), null)
export const writeProgress = (user, data) => writeAtomic(join(PROGRESS, `${user}.json`), JSON.stringify(data))
export const deleteProgress = (user) => rmSync(join(PROGRESS, `${user}.json`), { force: true })

export function readSecret() {
  const path = join(DATA_DIR, 'secret')
  try {
    return readFileSync(path)
  } catch {
    const secret = randomBytes(32)
    writeFileSync(path, secret, { mode: 0o600 })
    return secret
  }
}
