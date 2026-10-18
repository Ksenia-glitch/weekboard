import { useCallback, useState } from 'react'
import { createSalt, hashPassword, verifyPassword } from '../utils/authCrypto'
import { sendPasswordResetEmail } from '../utils/resetEmail'
import { migrateLegacyDataIfNeeded } from '../utils/userStorage'

const ACCOUNTS_KEY = 'weekboard-accounts-v1'
const SESSION_KEY = 'weekboard-session-v1'

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6
const RESET_CODE_TTL_MS = 15 * 60 * 1000
const RESET_COOLDOWN_MS = 60 * 1000

export type AuthUser = {
  id: string
  username: string
  email: string
  createdAt: string
}

type AccountRecord = AuthUser & {
  salt: string
  passwordHash: string
  resetCodeHash?: string
  resetExpiresAt?: string
  resetRequestedAt?: string
}

type AccountsStore = {
  users: AccountRecord[]
}

type SessionStore = {
  userId: string
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readAccounts(): AccountsStore {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) {
      return { users: [] }
    }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return { users: [] }
    }
    const data = parsed as Partial<AccountsStore>
    if (!Array.isArray(data.users)) {
      return { users: [] }
    }
    const users = data.users
      .map((user) => normalizeAccount(user))
      .filter((user): user is AccountRecord => user !== null)
    return { users }
  } catch {
    return { users: [] }
  }
}

function normalizeAccount(raw: unknown): AccountRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const user = raw as Partial<AccountRecord>
  if (
    typeof user.id !== 'string' ||
    typeof user.username !== 'string' ||
    typeof user.salt !== 'string' ||
    typeof user.passwordHash !== 'string' ||
    typeof user.createdAt !== 'string'
  ) {
    return null
  }
  return {
    id: user.id,
    username: user.username,
    email: typeof user.email === 'string' ? normalizeEmail(user.email) : '',
    salt: user.salt,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
    resetCodeHash: typeof user.resetCodeHash === 'string' ? user.resetCodeHash : undefined,
    resetExpiresAt: typeof user.resetExpiresAt === 'string' ? user.resetExpiresAt : undefined,
    resetRequestedAt:
      typeof user.resetRequestedAt === 'string' ? user.resetRequestedAt : undefined,
  }
}

function writeAccounts(store: AccountsStore): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(store))
}

function updateAccount(userId: string, patch: Partial<AccountRecord>): AccountRecord | null {
  const store = readAccounts()
  const index = store.users.findIndex((user) => user.id === userId)
  if (index < 0) {
    return null
  }
  const next = { ...store.users[index], ...patch }
  const users = [...store.users]
  users[index] = next
  writeAccounts({ users })
  return next
}

function readSessionUserId(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    const data = parsed as Partial<SessionStore>
    return typeof data.userId === 'string' ? data.userId : null
  } catch {
    return null
  }
}

function writeSession(userId: string): void {
  const session: SessionStore = { userId }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

function toPublicUser(account: AccountRecord): AuthUser {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    createdAt: account.createdAt,
  }
}

function resolveSessionUser(): AuthUser | null {
  const userId = readSessionUserId()
  if (!userId) {
    return null
  }
  const account = readAccounts().users.find((user) => user.id === userId)
  if (!account) {
    clearSession()
    return null
  }
  return toPublicUser(account)
}

function findAccountByLogin(loginId: string): AccountRecord | undefined {
  const normalized = loginId.trim().toLowerCase()
  return readAccounts().users.find(
    (account) => account.username === normalized || account.email === normalized,
  )
}

function findAccountByEmail(email: string): AccountRecord | undefined {
  const normalized = normalizeEmail(email)
  if (!normalized) {
    return undefined
  }
  return readAccounts().users.find((account) => account.email === normalized)
}

function generateResetCode(): string {
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return String(value).padStart(6, '0')
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim()
  if (!trimmed) {
    return 'Enter a username.'
  }
  if (!USERNAME_PATTERN.test(trimmed)) {
    return 'Username: 3–24 letters, numbers, or underscore.'
  }
  return null
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email)
  if (!normalized) {
    return 'Enter your email.'
  }
  if (!EMAIL_PATTERN.test(normalized)) {
    return 'Enter a valid email address.'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  return null
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => resolveSessionUser())
  const [busy, setBusy] = useState(false)
  const [accountCount, setAccountCount] = useState(() => readAccounts().users.length)
  const hasAccounts = accountCount > 0

  const register = useCallback(
    async (username: string, email: string, password: string): Promise<AuthUser> => {
      const usernameError = validateUsername(username)
      if (usernameError) {
        throw new Error(usernameError)
      }
      const emailError = validateEmail(email)
      if (emailError) {
        throw new Error(emailError)
      }
      const passwordError = validatePassword(password)
      if (passwordError) {
        throw new Error(passwordError)
      }

      setBusy(true)
      try {
        const store = readAccounts()
        const normalizedUsername = normalizeUsername(username)
        const normalizedEmail = normalizeEmail(email)
        if (store.users.some((account) => account.username === normalizedUsername)) {
          throw new Error('That username is already taken.')
        }
        if (store.users.some((account) => account.email === normalizedEmail)) {
          throw new Error('That email is already registered.')
        }

        const salt = createSalt()
        const passwordHash = await hashPassword(password, salt)
        const account: AccountRecord = {
          id: crypto.randomUUID(),
          username: normalizedUsername,
          email: normalizedEmail,
          salt,
          passwordHash,
          createdAt: new Date().toISOString(),
        }

        const nextUsers = [...store.users, account]
        writeAccounts({ users: nextUsers })
        setAccountCount(nextUsers.length)
        migrateLegacyDataIfNeeded(account.id)
        writeSession(account.id)
        const publicUser = toPublicUser(account)
        setUser(publicUser)
        return publicUser
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  const login = useCallback(async (loginId: string, password: string): Promise<AuthUser> => {
    if (!loginId.trim() || !password) {
      throw new Error('Enter your username/email and password.')
    }

    setBusy(true)
    try {
      const account = findAccountByLogin(loginId)
      if (!account) {
        throw new Error('No account with that username or email.')
      }

      const ok = await verifyPassword(password, account.salt, account.passwordHash)
      if (!ok) {
        throw new Error('Wrong password.')
      }

      migrateLegacyDataIfNeeded(account.id)
      writeSession(account.id)
      const publicUser = toPublicUser(account)
      setUser(publicUser)
      return publicUser
    } finally {
      setBusy(false)
    }
  }, [])

  const requestPasswordReset = useCallback(async (email: string): Promise<string> => {
    const emailError = validateEmail(email)
    if (emailError) {
      throw new Error(emailError)
    }

    setBusy(true)
    try {
      const account = findAccountByEmail(email)
      const genericMessage =
        'If that email is registered on this device, we sent a reset code. Check your inbox.'

      if (!account || !account.email) {
        return genericMessage
      }

      if (account.resetRequestedAt) {
        const elapsed = Date.now() - new Date(account.resetRequestedAt).getTime()
        if (elapsed >= 0 && elapsed < RESET_COOLDOWN_MS) {
          const waitSec = Math.ceil((RESET_COOLDOWN_MS - elapsed) / 1000)
          throw new Error(`Wait ${waitSec}s before requesting another code.`)
        }
      }

      const code = generateResetCode()
      const resetCodeHash = await hashPassword(code, account.salt)
      const now = new Date()
      updateAccount(account.id, {
        resetCodeHash,
        resetExpiresAt: new Date(now.getTime() + RESET_CODE_TTL_MS).toISOString(),
        resetRequestedAt: now.toISOString(),
      })

      try {
        await sendPasswordResetEmail(account.email, code, account.username)
      } catch (err) {
        updateAccount(account.id, {
          resetCodeHash: undefined,
          resetExpiresAt: undefined,
        })
        throw err instanceof Error
          ? err
          : new Error('Could not send the reset email. Try again later.')
      }

      return genericMessage
    } finally {
      setBusy(false)
    }
  }, [])

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string): Promise<void> => {
      const emailError = validateEmail(email)
      if (emailError) {
        throw new Error(emailError)
      }
      const trimmedCode = code.trim()
      if (!/^\d{6}$/.test(trimmedCode)) {
        throw new Error('Enter the 6-digit code from your email.')
      }
      const passwordError = validatePassword(newPassword)
      if (passwordError) {
        throw new Error(passwordError)
      }

      setBusy(true)
      try {
        const account = findAccountByEmail(email)
        if (
          !account ||
          !account.resetCodeHash ||
          !account.resetExpiresAt ||
          new Date(account.resetExpiresAt).getTime() < Date.now()
        ) {
          throw new Error('Reset code is invalid or expired. Request a new one.')
        }

        const codeOk = await verifyPassword(trimmedCode, account.salt, account.resetCodeHash)
        if (!codeOk) {
          throw new Error('Reset code is invalid or expired. Request a new one.')
        }

        const salt = createSalt()
        const passwordHash = await hashPassword(newPassword, salt)
        updateAccount(account.id, {
          salt,
          passwordHash,
          resetCodeHash: undefined,
          resetExpiresAt: undefined,
          resetRequestedAt: undefined,
        })
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  return {
    user,
    busy,
    hasAccounts,
    register,
    login,
    requestPasswordReset,
    resetPassword,
    logout,
  }
}
