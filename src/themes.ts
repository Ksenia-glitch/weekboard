import { UNIVERSITIES } from './universities'

export type ThemeId =
  | 'moss'
  | 'ocean'
  | 'ink'
  | 'sunset'
  | 'blossom'
  | 'dusk'
  | 'osu'
  | 'uo'
  | 'pdx'
  | 'uw'
  | 'ucla'
  | 'berkeley'
  | 'stanford'
  | 'asu'
  /** Dynamic theme built from any looked-up school logo/colors. */
  | 'campus'

export type ThemeOption = {
  id: ThemeId
  label: string
  description: string
  preview: [string, string, string]
  group: 'base' | 'campus'
}

export const BASE_THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'moss',
    label: 'Moss',
    description: 'Forest green',
    preview: ['#1f4d45', '#c9783a', '#d5e4dd'],
    group: 'base',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Deep blue',
    preview: ['#1e4a6e', '#2a9d8f', '#d4e4f0'],
    group: 'base',
  },
  {
    id: 'ink',
    label: 'Ink',
    description: 'Cool slate',
    preview: ['#2c3e50', '#5b7c99', '#e2e6ea'],
    group: 'base',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm amber',
    preview: ['#8b3a2a', '#e09f3e', '#f3e0d0'],
    group: 'base',
  },
  {
    id: 'blossom',
    label: 'Blossom',
    description: 'Soft rose',
    preview: ['#7a3e55', '#d4788c', '#f2e4e8'],
    group: 'base',
  },
  {
    id: 'dusk',
    label: 'Dusk',
    description: 'Dark night',
    preview: ['#9fd0c0', '#e0a15c', '#1b2422'],
    group: 'base',
  },
]

export const CAMPUS_THEME_OPTIONS: ThemeOption[] = UNIVERSITIES.map((university) => ({
  id: university.themeId,
  label: university.shortName,
  description: university.name,
  preview: university.preview,
  group: 'campus' as const,
}))

export const THEME_OPTIONS: ThemeOption[] = [
  ...BASE_THEME_OPTIONS,
  ...CAMPUS_THEME_OPTIONS,
  {
    id: 'campus',
    label: 'Campus',
    description: 'Your school colors',
    preview: ['#1f4d45', '#c9783a', '#d5e4dd'],
    group: 'campus',
  },
]

export const ALL_THEME_IDS: ThemeId[] = THEME_OPTIONS.map((theme) => theme.id)

export const DEFAULT_THEME: ThemeId = 'moss'

export function isThemeId(value: string): value is ThemeId {
  return THEME_OPTIONS.some((theme) => theme.id === value)
}
