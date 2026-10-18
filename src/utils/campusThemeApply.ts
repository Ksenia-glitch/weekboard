export type CampusThemeColors = {
  primary: string
  accent: string
  surface: string
}

/** Relative luminance threshold: above this, a color is "light" for on-color ink. */
const LIGHT_LUMINANCE = 0.55
/**
 * Max luminance for brand chrome used as text on light paper.
 * ~0.15 ≈ WCAG AA (4.5:1) against near-white backgrounds.
 */
const MAX_BRAND_LUMINANCE = 0.15
const MAX_BRAND_DEEP_LUMINANCE = 0.1
const MAX_ACCENT_LUMINANCE = 0.22
const MAX_INK_SOFT_LUMINANCE = 0.28
const MAX_MUTED_LUMINANCE = 0.38

/** Apply / clear CSS variables for the dynamic `campus` theme. */
export function applyCampusThemeColors(colors: CampusThemeColors | null): void {
  const root = document.documentElement
  if (!colors) {
    root.style.removeProperty('--campus-brand')
    root.style.removeProperty('--campus-brand-deep')
    root.style.removeProperty('--campus-accent')
    root.style.removeProperty('--campus-surface')
    root.style.removeProperty('--campus-sky-1')
    root.style.removeProperty('--campus-sky-2')
    root.style.removeProperty('--campus-sky-3')
    root.style.removeProperty('--campus-body')
    root.style.removeProperty('--campus-on-brand')
    root.style.removeProperty('--campus-on-accent')
    root.style.removeProperty('--campus-ink')
    root.style.removeProperty('--campus-ink-soft')
    root.style.removeProperty('--campus-muted')
    return
  }

  const brand = ensureDarkEnough(normalizeHex(colors.primary), MAX_BRAND_LUMINANCE)
  const accent = ensureDarkEnough(normalizeHex(colors.accent), MAX_ACCENT_LUMINANCE)
  const brandDeep = ensureDarkEnough(darkenHex(brand, 0.22), MAX_BRAND_DEEP_LUMINANCE)
  const surface = normalizeHex(colors.surface)
  const onBrand = contrastingInk(brand)
  const onAccent = contrastingInk(accent)
  const ink = ensureDarkEnough(mixHex(brandDeep, '#121212', 0.4), MAX_BRAND_DEEP_LUMINANCE)
  const inkSoft = ensureDarkEnough(mixHex(brand, '#2a2a2a', 0.55), MAX_INK_SOFT_LUMINANCE)
  const muted = ensureDarkEnough(mixHex(brand, '#4a4a4a', 0.65), MAX_MUTED_LUMINANCE)

  root.style.setProperty('--campus-brand', brand)
  root.style.setProperty('--campus-brand-deep', brandDeep)
  root.style.setProperty('--campus-accent', accent)
  root.style.setProperty('--campus-surface', surface)
  root.style.setProperty('--campus-sky-1', mixHex(brand, '#ffffff', 0.9))
  root.style.setProperty('--campus-sky-2', mixHex(brand, '#ffffff', 0.82))
  root.style.setProperty('--campus-sky-3', mixHex(brand, '#ffffff', 0.72))
  root.style.setProperty('--campus-body', mixHex(brand, '#d8d8d8', 0.55))
  root.style.setProperty('--campus-on-brand', onBrand)
  root.style.setProperty('--campus-on-accent', onAccent)
  root.style.setProperty('--campus-ink', ink)
  root.style.setProperty('--campus-ink-soft', inkSoft)
  root.style.setProperty('--campus-muted', muted)
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

/** Accept #RGB / #RRGGBB (any case). */
function normalizeHex(hex: string): string {
  const cleaned = hex.replace('#', '').trim()
  if (cleaned.length === 3) {
    const expanded = cleaned
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
    return `#${expanded.toLowerCase()}`
  }
  if (cleaned.length === 6) {
    return `#${cleaned.toLowerCase()}`
  }
  return hex
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex)
  const cleaned = normalized.replace('#', '').trim()
  if (cleaned.length !== 6) {
    return null
  }
  const r = Number.parseInt(cleaned.slice(0, 2), 16)
  const g = Number.parseInt(cleaned.slice(2, 4), 16)
  const b = Number.parseInt(cleaned.slice(4, 6), 16)
  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return null
  }
  return { r, g, b }
}

function toHex(color: { r: number; g: number; b: number }): string {
  return `#${[color.r, color.g, color.b]
    .map((value) => clampByte(value).toString(16).padStart(2, '0'))
    .join('')}`
}

function srgbChannel(value: number): number {
  const channel = value / 255
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance (0 = black, 1 = white). */
function relativeLuminance(hex: string): number {
  const color = parseHex(hex)
  if (!color) {
    return 0
  }
  return (
    0.2126 * srgbChannel(color.r) +
    0.7152 * srgbChannel(color.g) +
    0.0722 * srgbChannel(color.b)
  )
}

function contrastingInk(backgroundHex: string): string {
  return relativeLuminance(backgroundHex) > LIGHT_LUMINANCE ? '#141414' : '#ffffff'
}

/**
 * Darken a color until it is readable as text / brand chrome on light paper.
 * Preserves hue; only pulls lightness down.
 */
function ensureDarkEnough(hex: string, maxLuminance: number): string {
  const color = parseHex(hex)
  if (!color) {
    return hex
  }
  let current = { ...color }
  let currentHex = toHex(current)
  let guard = 0
  while (relativeLuminance(currentHex) > maxLuminance && guard < 32) {
    current = {
      r: current.r * 0.86,
      g: current.g * 0.86,
      b: current.b * 0.86,
    }
    currentHex = toHex(current)
    guard += 1
  }
  return currentHex
}

function darkenHex(hex: string, amount: number): string {
  const color = parseHex(hex)
  if (!color) {
    return hex
  }
  return toHex({
    r: color.r * (1 - amount),
    g: color.g * (1 - amount),
    b: color.b * (1 - amount),
  })
}

function mixHex(a: string, b: string, amountB: number): string {
  const left = parseHex(a)
  const right = parseHex(b)
  if (!left || !right) {
    return a
  }
  const amountA = 1 - amountB
  return toHex({
    r: left.r * amountA + right.r * amountB,
    g: left.g * amountA + right.g * amountB,
    b: left.b * amountA + right.b * amountB,
  })
}
