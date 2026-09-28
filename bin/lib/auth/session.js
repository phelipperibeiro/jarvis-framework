import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { homedir, userInfo } from 'node:os'

const SESSION_FILE = join(homedir(), '.jarvis', 'auth.json')

export function readSession() {
  if (!existsSync(SESSION_FILE)) return null
  try {
    return JSON.parse(readFileSync(SESSION_FILE, 'utf-8'))
  } catch {
    return null
  }
}

export function clearSession() {
  if (existsSync(SESSION_FILE)) {
    unlinkSync(SESSION_FILE)
  }
}

/**
 * Resolve local identity without OAuth.
 * Order: ENV.md USER → git user.email → OS username → "local"
 */
export function resolveUser(env = {}) {
  const envUser = typeof env.USER === 'string' ? env.USER.trim() : ''
  if (envUser) return { id: envUser, source: 'ENV.md' }

  try {
    const email = execSync('git config --get user.email', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (email) return { id: email, source: 'git' }
  } catch {
    // ignore
  }

  try {
    const username = userInfo().username
    if (username) return { id: username, source: 'os' }
  } catch {
    // ignore
  }

  return { id: 'local', source: 'fallback' }
}

/**
 * Identity used as dev_id. Never requires jarvis login.
 */
export function getAuthUser(env = {}) {
  return resolveUser(env).id
}
