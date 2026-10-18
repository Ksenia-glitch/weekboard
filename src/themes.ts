export type ThemeId = 'moss' | 'ocean' | 'ink' | 'sunset' | 'blossom' | 'dusk'

export type ThemeOption = {
  id: ThemeId
  label: string
  description: string
  preview: [string, string, string]
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'moss',
    label: 'Moss',
    description: 'Forest green',
    preview: ['#1f4d45', '#c9783a', '#d5e4dd'],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Deep blue',
    preview: ['#1e4a6e', '#2a9d8f', '#d4e4f0'],
  },
  {
    id: 'ink',
    label: 'Ink',
    description: 'Cool slate',
    preview: ['#2c3e50', '#5b7c99', '#e2e6ea'],
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm amber',
    preview: ['#8b3a2a', '#e09f3e', '#f3e0d0'],
  },
  {
    id: 'blossom',
    label: 'Blossom',
    description: 'Soft rose',
    preview: ['#7a3e55', '#d4788c', '#f2e4e8'],
  },
  {
    id: 'dusk',
    label: 'Dusk',
    description: 'Dark night',
    preview: ['#9fd0c0', '#e0a15c', '#1b2422'],
  },
]

export const DEFAULT_THEME: ThemeId = 'moss'

export function isThemeId(value: string): value is ThemeId {
  return THEME_OPTIONS.some((theme) => theme.id === value)
}
