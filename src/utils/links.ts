export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    return ''
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

export function isValidHttpUrl(raw: string): boolean {
  try {
    const url = new URL(normalizeUrl(raw))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function linkLabelFromUrl(raw: string): string {
  try {
    const url = new URL(normalizeUrl(raw))
    return url.hostname.replace(/^www\./, '')
  } catch {
    return 'Open link'
  }
}
