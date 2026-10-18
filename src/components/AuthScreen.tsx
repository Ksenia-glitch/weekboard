import { useEffect, useId, useState } from 'react'
import { useCampusFromEmail } from '../hooks/useCampusFromEmail'
import type { ThemeId } from '../themes'
import type { UniversityProfile } from '../universities'
import { universityToThemeOption } from '../universities'
import { ThemePicker } from './ThemePicker'

type AuthMode = 'login' | 'register' | 'forgot' | 'reset'

type AuthScreenProps = {
  modeHint: 'login' | 'register'
  busy: boolean
  theme: ThemeId
  onThemeChange: (theme: ThemeId) => void
  onCampusResolved?: (campus: UniversityProfile) => void
  onCampusCleared?: () => void
  onSelectCampusTheme?: (campus: UniversityProfile) => void
  onLogin: (loginId: string, password: string) => Promise<void>
  onRegister: (username: string, email: string, password: string) => Promise<void>
  onRequestReset: (email: string) => Promise<string>
  onResetPassword: (email: string, code: string, newPassword: string) => Promise<void>
}

export function AuthScreen({
  modeHint,
  busy,
  theme,
  onThemeChange,
  onCampusResolved,
  onCampusCleared,
  onSelectCampusTheme,
  onLogin,
  onRegister,
  onRequestReset,
  onResetPassword,
}: AuthScreenProps) {
  const titleId = useId()
  const [mode, setMode] = useState<AuthMode>(modeHint)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const campusEmail =
    mode === 'register' ? email : mode === 'login' && loginId.includes('@') ? loginId : ''
  const campus = useCampusFromEmail(campusEmail)
  const campusOption = campus ? universityToThemeOption(campus) : null

  useEffect(() => {
    if (campus) {
      onCampusResolved?.(campus)
      return
    }
    onCampusCleared?.()
  }, [campus, onCampusResolved, onCampusCleared])

  function switchMode(next: AuthMode) {
    setMode(next)
    setError(null)
    setInfo(null)
    setPassword('')
    setConfirm('')
    setResetCode('')
    if (next === 'login' || next === 'register') {
      setEmail('')
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)

    try {
      if (mode === 'login') {
        await onLogin(loginId, password)
        return
      }

      if (mode === 'register') {
        if (password !== confirm) {
          setError('Passwords do not match.')
          return
        }
        await onRegister(username, email, password)
        return
      }

      if (mode === 'forgot') {
        const message = await onRequestReset(email)
        setInfo(message)
        setMode('reset')
        return
      }

      if (password !== confirm) {
        setError('Passwords do not match.')
        return
      }
      await onResetPassword(email, resetCode, password)
      setInfo('Password updated. Sign in with your new password.')
      setPassword('')
      setConfirm('')
      setResetCode('')
      setMode('login')
      setLoginId(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const title =
    mode === 'login'
      ? 'Welcome back'
      : mode === 'register'
        ? 'Create your account'
        : mode === 'forgot'
          ? 'Reset your password'
          : 'Enter the email code'

  const subtitle =
    mode === 'login'
      ? 'Sign in with your username or email.'
      : mode === 'register'
        ? 'Username, email, and password are all required.'
        : mode === 'forgot'
          ? 'We will email a 6-digit code to the address on your account.'
          : 'Paste the code from your inbox, then choose a new password.'

  return (
    <div className="auth-screen">
      <div className="atmosphere" aria-hidden="true" />
      <div className="auth-screen__top">
        <ThemePicker
          theme={theme}
          campusOption={campusOption}
          onChange={onThemeChange}
          onSelectCampus={() => {
            if (campus) {
              onSelectCampusTheme?.(campus)
            }
          }}
        />
      </div>

      <div className="auth-card modal--themed" role="dialog" aria-labelledby={titleId}>
        <p className="brand-mark">Weekboard</p>
        <h1 id={titleId} className="auth-card__title">
          {title}
        </h1>
        <p className="auth-card__sub">{subtitle}</p>

        {(mode === 'login' || mode === 'register') && (
          <div className="auth-tabs" role="tablist" aria-label="Account">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tabs__btn ${mode === 'login' ? 'is-active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`auth-tabs__btn ${mode === 'register' ? 'is-active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Create account
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          {mode === 'login' && (
            <label className="field">
              <span>Username or email</span>
              <input
                autoComplete="username"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                placeholder="ksenia or you@school.edu"
                disabled={busy}
                required
              />
            </label>
          )}

          {mode === 'register' && (
            <>
              <label className="field">
                <span>Username</span>
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="e.g. ksenia"
                  disabled={busy}
                  required
                />
              </label>

              <label className="field field--email">
                <span>
                  Email <em className="field-required">required</em>
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@oregonstate.edu"
                  disabled={busy}
                  required
                />
              </label>
            </>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <label className="field field--email">
              <span>
                Email <em className="field-required">required</em>
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@school.edu"
                disabled={busy || mode === 'reset'}
                required
              />
            </label>
          )}

          {mode === 'reset' && (
            <label className="field">
              <span>6-digit code</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={resetCode}
                onChange={(event) => setResetCode(event.target.value)}
                placeholder="123456"
                disabled={busy}
                required
              />
            </label>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <label className="field">
              <span>{mode === 'reset' ? 'New password' : 'Password'}</span>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                disabled={busy}
                required
              />
            </label>
          )}

          {(mode === 'register' || mode === 'reset') && (
            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                disabled={busy}
                required
              />
            </label>
          )}

          {error && <p className="form-error">{error}</p>}
          {info && <p className="form-info">{info}</p>}

          <button type="submit" className="primary-btn auth-form__submit" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : mode === 'register'
                  ? 'Create account'
                  : mode === 'forgot'
                    ? 'Email me a code'
                    : 'Save new password'}
          </button>
        </form>

        {mode === 'login' && (
          <button
            type="button"
            className="text-btn auth-card__link"
            onClick={() => switchMode('forgot')}
          >
            Forgot password?
          </button>
        )}

        {(mode === 'forgot' || mode === 'reset') && (
          <button
            type="button"
            className="text-btn auth-card__link"
            onClick={() => switchMode('login')}
          >
            Back to sign in
          </button>
        )}

        {mode === 'reset' && (
          <button
            type="button"
            className="text-btn auth-card__link"
            onClick={() => switchMode('forgot')}
          >
            Resend code
          </button>
        )}

        <p className="auth-card__note">
          Accounts stay on this browser. Reset codes are emailed to the address you registered.
        </p>
      </div>
    </div>
  )
}
