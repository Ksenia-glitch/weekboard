/** Pull a simple brand palette from a logo image URL. */
export async function colorsFromLogoUrl(
  logoUrl: string,
): Promise<[string, string, string] | null> {
  try {
    const image = await loadImage(logoUrl)
    const canvas = document.createElement('canvas')
    const size = 48
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      return null
    }
    context.drawImage(image, 0, 0, size, size)
    const { data } = context.getImageData(0, 0, size, size)

    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>()
    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3] ?? 0
      if (alpha < 200) {
        continue
      }
      const r = data[index] ?? 0
      const g = data[index + 1] ?? 0
      const b = data[index + 2] ?? 0
      const brightness = r + g + b
      // Skip near-white / near-black (logo backgrounds).
      if (brightness < 45 || brightness > 720) {
        continue
      }
      const key = `${Math.round(r / 24)}:${Math.round(g / 24)}:${Math.round(b / 24)}`
      const existing = buckets.get(key)
      if (existing) {
        existing.count += 1
        existing.r += r
        existing.g += g
        existing.b += b
      } else {
        buckets.set(key, { count: 1, r, g, b })
      }
    }

    const ranked = [...buckets.values()]
      .map((item) => {
        const r = Math.round(item.r / item.count)
        const g = Math.round(item.g / item.count)
        const b = Math.round(item.b / item.count)
        const luminance = relativeLuminanceRgb(r, g, b)
        // Prefer frequent mid/dark brand colors over pale yellows/whites.
        const readableBoost = luminance < 0.45 ? 1.35 : luminance < 0.65 ? 1 : 0.45
        return {
          count: item.count,
          r,
          g,
          b,
          luminance,
          score: item.count * readableBoost,
        }
      })
      .sort((a, b) => b.score - a.score)

    if (ranked.length === 0) {
      return null
    }

    const primary = ranked[0]!
    const accent =
      ranked.find(
        (item) => colorDistance(item, primary) > 80 && item.luminance < 0.72,
      ) ??
      ranked.find((item) => colorDistance(item, primary) > 80) ??
      ({
        r: Math.min(255, primary.r + 40),
        g: Math.min(255, primary.g + 30),
        b: Math.min(255, primary.b + 20),
        count: 0,
        luminance: primary.luminance,
        score: 0,
      } as const)

    const surface = mixWithWhite(primary, 0.92)
    return [toHex(primary), toHex(accent), toHex(surface)]
  } catch {
    return null
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('logo load failed'))
    image.src = src
  })
}

function toHex(color: { r: number; g: number; b: number }): string {
  return `#${[color.r, color.g, color.b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b)
}

function srgbChannel(value: number): number {
  const channel = value / 255
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function relativeLuminanceRgb(r: number, g: number, b: number): number {
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b)
}

function mixWithWhite(
  color: { r: number; g: number; b: number },
  amount: number,
): { r: number; g: number; b: number } {
  return {
    r: Math.round(color.r * (1 - amount) + 255 * amount),
    g: Math.round(color.g * (1 - amount) + 255 * amount),
    b: Math.round(color.b * (1 - amount) + 255 * amount),
  }
}

export function fallbackColorsFromDomain(domain: string): [string, string, string] {
  let hash = 0
  for (let index = 0; index < domain.length; index += 1) {
    hash = (hash * 31 + domain.charCodeAt(index)) >>> 0
  }
  const hue = hash % 360
  const primary = hslToHex(hue, 62, 32)
  const accent = hslToHex((hue + 40) % 360, 70, 48)
  const surface = hslToHex(hue, 30, 96)
  return [primary, accent, surface]
}

function hslToHex(h: number, s: number, l: number): string {
  const saturation = s / 100
  const lightness = l / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lightness - chroma / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) {
    r = chroma
    g = x
  } else if (h < 120) {
    r = x
    g = chroma
  } else if (h < 180) {
    g = chroma
    b = x
  } else if (h < 240) {
    g = x
    b = chroma
  } else if (h < 300) {
    r = x
    b = chroma
  } else {
    r = chroma
    b = x
  }
  return toHex({
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  })
}
