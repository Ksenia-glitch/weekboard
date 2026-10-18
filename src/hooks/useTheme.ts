import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_THEME, isThemeId, type ThemeId } from '../themes'
import type { UniversityProfile } from '../universities'
import { applyCampusThemeColors } from '../utils/campusThemeApply'

const STORAGE_KEY = 'cadence-week-theme-v1'
const CAMPUS_STORAGE_KEY = 'weekboard-active-campus-v1'

export type ActiveCampusTheme = {
  id: string
  name: string
  shortName: string
  logoUrl: string
  preview: [string, string, string]
  brandNotes: string
}

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

function readActiveCampus(): ActiveCampusTheme | null {
  try {
    const raw = localStorage.getItem(CAMPUS_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    const data = parsed as Partial<ActiveCampusTheme>
    if (
      typeof data.id !== 'string' ||
      typeof data.name !== 'string' ||
      typeof data.shortName !== 'string' ||
      typeof data.logoUrl !== 'string' ||
      !Array.isArray(data.preview) ||
      data.preview.length !== 3
    ) {
      return null
    }
    return {
      id: data.id,
      name: data.name,
      shortName: data.shortName,
      logoUrl: data.logoUrl,
      preview: data.preview as [string, string, string],
      brandNotes: typeof data.brandNotes === 'string' ? data.brandNotes : '',
    }
  } catch {
    return null
  }
}

function writeActiveCampus(campus: ActiveCampusTheme | null): void {
  if (!campus) {
    localStorage.removeItem(CAMPUS_STORAGE_KEY)
    return
  }
  localStorage.setItem(CAMPUS_STORAGE_KEY, JSON.stringify(campus))
}

function applyTheme(theme: ThemeId, campus: ActiveCampusTheme | null): void {
  document.documentElement.setAttribute('data-theme', theme)
  if (theme === 'campus' && campus) {
    applyCampusThemeColors({
      primary: campus.preview[0],
      accent: campus.preview[1],
      surface: campus.preview[2],
    })
  } else {
    applyCampusThemeColors(null)
  }
}

export function universityToActiveCampus(university: UniversityProfile): ActiveCampusTheme {
  return {
    id: university.id,
    name: university.name,
    shortName: university.shortName,
    logoUrl: university.logoUrl,
    preview: university.preview,
    brandNotes: university.brandNotes,
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const initial = readTheme()
    const campus = readActiveCampus()
    applyTheme(initial, campus)
    return initial
  })
  const [activeCampus, setActiveCampusState] = useState<ActiveCampusTheme | null>(() =>
    readActiveCampus(),
  )

  useEffect(() => {
    applyTheme(theme, activeCampus)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
      writeActiveCampus(activeCampus)
    } catch {
      // Ignore storage errors.
    }
  }, [theme, activeCampus])

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next)
    if (next !== 'campus') {
      // Keep stored campus for the Colors list, but clear dynamic CSS overrides.
    }
  }, [])

  const setCampusTheme = useCallback((university: UniversityProfile) => {
    const campus = universityToActiveCampus(university)
    setActiveCampusState(campus)
    setThemeState(university.themeId === 'campus' ? 'campus' : university.themeId)
  }, [])

  const rememberCampus = useCallback((university: UniversityProfile) => {
    setActiveCampusState((prev) => {
      const next = universityToActiveCampus(university)
      if (
        prev &&
        prev.id === next.id &&
        prev.logoUrl === next.logoUrl &&
        prev.preview[0] === next.preview[0]
      ) {
        return prev
      }
      return next
    })
  }, [])

  const clearCampus = useCallback(() => {
    setActiveCampusState(null)
  }, [])

  return { theme, setTheme, activeCampus, setCampusTheme, rememberCampus, clearCampus }
}
