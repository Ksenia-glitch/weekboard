type WikiImageHit = {
  title?: string
  imageinfo?: Array<{
    url?: string
    mime?: string
    width?: number
    height?: number
    thumburl?: string
  }>
}

const NAME_STOP_WORDS = new Set([
  'university',
  'college',
  'institute',
  'school',
  'state',
  'community',
  'the',
  'and',
  'of',
  'at',
  'for',
  'in',
  'logo',
  'seal',
  'emblem',
  'wordmark',
  'file',
])

/** Build a clean initials badge when no remote logo is available. */
export function makeInitialsLogo(
  shortName: string,
  primary: string,
  accent: string,
): string {
  const label = shortName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'U'
  const fontSize = label.length > 2 ? 18 : 22
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="${primary}"/>
  <circle cx="32" cy="32" r="26" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.85"/>
  <text x="32" y="39" text-anchor="middle" fill="#ffffff" font-size="${fontSize}"
    font-family="Figtree, Segoe UI, sans-serif" font-weight="750" letter-spacing="-0.04em">${label}</text>
</svg>`.trim()
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function significantTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !NAME_STOP_WORDS.has(token))
}

/** Image title / page title must clearly belong to this school. */
function matchesSchool(text: string, schoolName: string): boolean {
  const hay = text.toLowerCase()
  const tokens = significantTokens(schoolName)
  if (tokens.length === 0) {
    const compact = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '')
    return compact.length >= 4 && hay.includes(compact.slice(0, Math.min(8, compact.length)))
  }
  const hits = tokens.filter((token) => hay.includes(token))
  // Need most of the meaningful words, or at least 2 strong hits.
  return hits.length >= Math.min(2, tokens.length) || hits.length >= Math.ceil(tokens.length * 0.6)
}

/** Google-hosted favicon / brand mark endpoints for a school domain. */
export function googleLogoCandidatesForDomain(domain: string): string[] {
  const host = domain.trim().toLowerCase()
  const httpsSite = `https://${host}`
  const wwwSite = `https://www.${host.replace(/^www\./, '')}`
  return [
    `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(httpsSite)}&size=128`,
    `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(wwwSite)}&size=128`,
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(httpsSite)}&size=256`,
    `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(httpsSite)}`,
    `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(host)}`,
  ]
}

export function canLoadImage(src: string, timeoutMs = 4000): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image()
    const timer = window.setTimeout(() => {
      image.src = ''
      resolve(false)
    }, timeoutMs)

    image.onload = () => {
      window.clearTimeout(timer)
      if (image.naturalWidth < 12 || image.naturalHeight < 12) {
        resolve(false)
        return
      }
      resolve(true)
    }
    image.onerror = () => {
      window.clearTimeout(timer)
      resolve(false)
    }
    image.referrerPolicy = 'no-referrer'
    image.crossOrigin = 'anonymous'
    image.src = src
  })
}

async function firstLoadable(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    if (await canLoadImage(url)) {
      return url
    }
  }
  return null
}

/** Optional Google Programmable Search (Image). */
async function searchLogoWithGoogleCse(name: string): Promise<string | null> {
  const key = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined
  const cx = import.meta.env.VITE_GOOGLE_CSE_ID as string | undefined
  if (!key || !cx) {
    return null
  }

  try {
    const query = `"${name}" logo`
    const endpoint =
      `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}` +
      `&cx=${encodeURIComponent(cx)}` +
      `&q=${encodeURIComponent(query)}` +
      `&searchType=image&num=6&safe=active`
    const response = await fetch(endpoint)
    if (!response.ok) {
      return null
    }
    const payload = (await response.json()) as {
      items?: Array<{ link?: string; title?: string }>
    }
    const links = (payload.items ?? [])
      .filter((item) => typeof item.link === 'string' && matchesSchool(item.title ?? item.link!, name))
      .map((item) => item.link!)
    return firstLoadable(links)
  } catch {
    return null
  }
}

/** Search Wikimedia Commons — only keep files whose title matches the school. */
async function searchLogoOnCommons(name: string): Promise<string | null> {
  try {
    const query = `"${name}" (logo OR wordmark OR athletics) filetype:svg|png`
    const endpoint =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
      '&generator=search&gsrnamespace=6&gsrlimit=12' +
      `&gsrsearch=${encodeURIComponent(query)}` +
      '&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=256'
    const response = await fetch(endpoint)
    if (!response.ok) {
      return null
    }
    const payload = (await response.json()) as {
      query?: { pages?: Record<string, WikiImageHit> }
    }
    const pages = Object.values(payload.query?.pages ?? {})
    const ranked = pages
      .map((page) => {
        const info = page.imageinfo?.[0]
        const title = page.title ?? ''
        const url = info?.thumburl || info?.url
        if (!url || !info) {
          return null
        }
        if (!matchesSchool(title, name)) {
          return null
        }
        // Drop unrelated state seals (e.g. Seal_of_Missouri for a different school).
        if (/seal_of_|seal of /i.test(title) && !/university|college|institute/i.test(title)) {
          if (!matchesSchool(title, name)) {
            return null
          }
        }
        const mime = info.mime ?? ''
        if (!mime.includes('png') && !mime.includes('svg') && !mime.includes('jpeg')) {
          return null
        }
        let score = 0
        const lower = title.toLowerCase()
        if (lower.includes('logo')) score += 6
        if (lower.includes('wordmark')) score += 5
        if (lower.includes('athletics')) score += 3
        if (lower.includes('seal') && lower.includes('university')) score += 2
        if (mime.includes('svg')) score += 2
        score += significantTokens(name).filter((token) => lower.includes(token)).length
        return { url, score }
      })
      .filter((item): item is { url: string; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)

    return firstLoadable(ranked.map((item) => item.url))
  } catch {
    return null
  }
}

/** Wikipedia page image — only if the page title matches the school. */
async function searchLogoOnWikipedia(name: string): Promise<string | null> {
  try {
    const searchUrl =
      'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*' +
      `&search=${encodeURIComponent(name)}&limit=5&namespace=0`
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      return null
    }
    const searchPayload = (await searchResponse.json()) as [string, string[], string[], string[]]
    const titles = searchPayload[1] ?? []
    for (const title of titles) {
      if (!matchesSchool(title, name)) {
        continue
      }
      const summaryResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      )
      if (!summaryResponse.ok) {
        continue
      }
      const summary = (await summaryResponse.json()) as {
        title?: string
        thumbnail?: { source?: string }
        originalimage?: { source?: string }
      }
      if (summary.title && !matchesSchool(summary.title, name)) {
        continue
      }
      const candidates = [summary.originalimage?.source, summary.thumbnail?.source].filter(
        (item): item is string => typeof item === 'string',
      )
      const hit = await firstLoadable(candidates)
      if (hit) {
        return hit
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Find a campus logo tied to THIS school:
 * 1) Google domain favicon for the email domain (most accurate)
 * 2) Google CSE image search (optional keys)
 * 3) Commons / Wikipedia only if the file/page name matches the school
 * 4) Initials badge
 */
export async function resolveCampusLogoUrl(
  domain: string,
  schoolName: string,
  shortName: string,
  primary: string,
  accent: string,
): Promise<string> {
  // Domain-bound Google marks first — follows the email, not a fuzzy name hit.
  const fromGoogleDomain = await firstLoadable(googleLogoCandidatesForDomain(domain))
  if (fromGoogleDomain) {
    return fromGoogleDomain
  }

  const fromGoogleCse = await searchLogoWithGoogleCse(schoolName)
  if (fromGoogleCse) {
    return fromGoogleCse
  }

  const fromCommons = await searchLogoOnCommons(schoolName)
  if (fromCommons) {
    return fromCommons
  }

  const fromWikipedia = await searchLogoOnWikipedia(schoolName)
  if (fromWikipedia) {
    return fromWikipedia
  }

  return makeInitialsLogo(shortName, primary, accent)
}
