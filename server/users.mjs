// Manage accounts from the command line (admins can also do all of this on the Admin page).
// Usage: node server/users.mjs <command> [username] [--name "Full Name"] [--password secret] [--admin]
//   list                    show everyone
//   add <user>              create a user (prompts for a password unless --password is given)
//   admin <user> on|off     grant or remove admin rights
//   passwd <user>           set a new password
//   rename <user> --name X  change the display name
//   reset <user>            wipe their progress
//   remove <user>           delete the user and their progress
import { createInterface } from 'node:readline'
import { deleteProgress, hashPassword, MIN_PASSWORD, normalizeUsername, readProgress, readUsers, writeUsers } from './store.mjs'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args.splice(i, 2)[1]
}
const name = flag('name')
const passwordArg = flag('password')
const asAdmin = args.includes('--admin')
const [command, rawUser, arg] = args.filter((a) => a !== '--admin')

function die(msg) {
  console.error(msg)
  process.exit(1)
}

function ask(question, hidden = false) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  if (hidden) rl._writeToOutput = (s) => rl.output.write(s.startsWith(question) ? s : s.replace(/[^\r\n]/g, ''))
  return new Promise((resolve) => rl.question(question, (a) => (rl.close(), hidden && console.log(), resolve(a))))
}

async function newPassword() {
  if (passwordArg !== undefined) return passwordArg
  const a = await ask('Password: ', true)
  const b = await ask('Again:    ', true)
  if (a !== b) die('Passwords did not match.')
  return a
}

async function checkedPassword() {
  const password = await newPassword()
  if (password.length < MIN_PASSWORD) die(`Passwords need at least ${MIN_PASSWORD} characters.`)
  return password
}

const users = readUsers()
const user = rawUser === undefined ? undefined : normalizeUsername(rawUser)
if (rawUser !== undefined && !user) die('Usernames are 1–32 characters: letters, digits, dot, dash or underscore.')
const needUser = () => (user && users[user] ? user : die(`No such user: ${rawUser ?? '(none given)'}`))

switch (command) {
  case 'list': {
    const rows = Object.entries(users)
    if (!rows.length) console.log('No users yet. Add one with: users.mjs add <username>')
    for (const [u, a] of rows) {
      const done = Object.keys(readProgress(u)?.completed ?? {}).length
      console.log(`${u.padEnd(20)} ${(a.name || '').padEnd(24)} ${a.admin ? 'admin  ' : '       '}${done} lessons done`)
    }
    break
  }
  case 'add': {
    if (!user) die('Usage: users.mjs add <username> [--name "Full Name"]')
    if (users[user]) die(`${user} already exists — use passwd or rename.`)
    const password = await checkedPassword()
    users[user] = { name: name ?? rawUser, hash: await hashPassword(password), created: new Date().toISOString(), admin: asAdmin }
    writeUsers(users)
    console.log(`Added ${user}${asAdmin ? ' (admin)' : ''}.`)
    break
  }
  case 'passwd': {
    const u = needUser()
    const password = await checkedPassword()
    users[u].hash = await hashPassword(password)
    writeUsers(users)
    console.log(`Password changed for ${u}; their other devices are signed out.`)
    break
  }
  case 'admin': {
    const u = needUser()
    if (arg !== 'on' && arg !== 'off') die('Usage: users.mjs admin <username> on|off')
    users[u].admin = arg === 'on'
    writeUsers(users)
    console.log(`${u} is ${arg === 'on' ? 'now' : 'no longer'} an admin.`)
    break
  }
  case 'rename': {
    const u = needUser()
    if (!name) die('Usage: users.mjs rename <username> --name "Full Name"')
    users[u].name = name
    writeUsers(users)
    console.log(`${u} is now "${name}".`)
    break
  }
  case 'reset': {
    const u = needUser()
    deleteProgress(u)
    console.log(`Progress cleared for ${u}.`)
    break
  }
  case 'remove': {
    const u = needUser()
    delete users[u]
    writeUsers(users)
    deleteProgress(u)
    console.log(`Removed ${u}.`)
    break
  }
  default:
    die('Commands: list | add <user> [--admin] | admin <user> on|off | passwd <user> | rename <user> --name X | reset <user> | remove <user>')
}
