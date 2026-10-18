import { useEffect, useState } from 'react'
import { DEFAULT_THEME, isThemeId, type ThemeId } from '../themes'

const STORAGE_KEY = 'cadence-week-theme-v1'

function readTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isThemeId(stored)) {
      return stored
    }
  } catch {
    // Ignore storage errors and fall back to default.
  }
  return DEFAULT_THEME
}

function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const initial = readTheme()
    applyTheme(initial)
    return initial
  })

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Ignore storage errors.
    }
  }, [theme])

  function setTheme(next: ThemeId) {
    setThemeState(next)
  }

  return { theme, setTheme }
}
