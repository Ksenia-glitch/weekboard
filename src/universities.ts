import type { ThemeId } from './themes'
import { resolveCampusLogoUrl } from './utils/campusLogo'
import { colorsFromLogoUrl, fallbackColorsFromDomain } from './utils/logoColors'

export type UniversityId =
  | 'osu'
  | 'uo'
  | 'pdx'
  | 'uw'
  | 'ucla'
  | 'berkeley'
  | 'stanford'
  | 'asu'
  | string

export type UniversityProfile = {
  id: UniversityId
  name: string
  shortName: string
  domains: string[]
  themeId: ThemeId
  preview: [string, string, string]
  logoUrl: string
  brandNotes: string
}

type CatalogEntry = {
  name: string
  domains: string[]
}

type CuratedUniversity = Omit<UniversityProfile, 'logoUrl'> & {
  logoFile: string
}

const CURATED: CuratedUniversity[] = [
  {
    id: 'osu',
    name: 'Oregon State University',
    shortName: 'OSU',
    domains: ['oregonstate.edu', 'orst.edu'],
    themeId: 'osu',
    preview: ['#D73F09', '#000000', '#FFF7F2'],
    logoFile: 'osu.png',
    brandNotes: 'OSU brand: Beaver Orange #D73F09 + black (logo head)',
  },
  {
    id: 'uo',
    name: 'University of Oregon',
    shortName: 'UO',
    domains: ['uoregon.edu'],
    themeId: 'uo',
    preview: ['#007030', '#FEE11A', '#F4FBF6'],
    logoFile: 'uo.jpg',
    brandNotes: 'UO brand: Green #007030 + Yellow #FEE11A (duck mark)',
  },
  {
    id: 'pdx',
    name: 'Portland State University',
    shortName: 'PSU',
    domains: ['pdx.edu'],
    themeId: 'pdx',
    preview: ['#154734', '#FFFFFF', '#F3F7F4'],
    logoFile: 'pdx.png',
    brandNotes: 'PSU athletics green #154734 from PS shield logo',
  },
  {
    id: 'uw',
    name: 'University of Washington',
    shortName: 'UW',
    domains: ['uw.edu', 'washington.edu'],
    themeId: 'uw',
    preview: ['#4B2E83', '#B7A57A', '#F7F4FC'],
    logoFile: 'uw.png',
    brandNotes: 'UW Purple #4B2E83 + Gold #B7A57A (W mark)',
  },
  {
    id: 'ucla',
    name: 'UCLA',
    shortName: 'UCLA',
    domains: ['ucla.edu'],
    themeId: 'ucla',
    preview: ['#2774AE', '#FFD100', '#F3F9FD'],
    logoFile: 'ucla.png',
    brandNotes: 'UCLA Blue #2774AE + Gold #FFD100 (script logo)',
  },
  {
    id: 'berkeley',
    name: 'UC Berkeley',
    shortName: 'Cal',
    domains: ['berkeley.edu'],
    themeId: 'berkeley',
    preview: ['#003262', '#FDB515', '#F4F8FC'],
    logoFile: 'berkeley.png',
    brandNotes: 'Berkeley Blue #003262 + Gold #FDB515 (Cal mark)',
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    shortName: 'Stanford',
    domains: ['stanford.edu'],
    themeId: 'stanford',
    preview: ['#8C1515', '#FFFFFF', '#FDF7F7'],
    logoFile: 'stanford.png',
    brandNotes: 'Stanford Cardinal #8C1515 (S + tree logo)',
  },
  {
    id: 'asu',
    name: 'Arizona State University',
    shortName: 'ASU',
    domains: ['asu.edu'],
    themeId: 'asu',
    preview: ['#8C1D40', '#FFC627', '#FFF8F2'],
    logoFile: 'asu.png',
    brandNotes: 'ASU Maroon #8C1D40 + Gold #FFC627 (pitchfork)',
  },
]

export const UNIVERSITIES: UniversityProfile[] = CURATED.map((item) => ({
  ...item,
  logoUrl: localLogoUrl(item.logoFile),
}))

let catalogPromise: Promise<CatalogEntry[]> | null = null

function assetBase(): string {
  return import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
}

function localLogoUrl(logoFile: string): string {
  return `${assetBase()}campuses/${logoFile}`
}

export function campusLogoUrl(university: UniversityProfile): string {
  return university.logoUrl
}

function emailDomain(email: string): string | null {
  const at = email.trim().toLowerCase().lastIndexOf('@')
  if (at < 0) {
    return null
  }
  const domain = email.trim().toLowerCase().slice(at + 1)
  return domain.length > 0 ? domain : null
}

function domainMatches(emailDomainValue: string, universityDomain: string): boolean {
  return (
    emailDomainValue === universityDomain ||
    emailDomainValue.endsWith(`.${universityDomain}`)
  )
}

function shortNameFrom(name: string, domain: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9 &\-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const skip = new Set([
    'university',
    'college',
    'of',
    'the',
    'and',
    'at',
    'state',
    'community',
    'institute',
    'school',
  ])
  const meaningful = words.filter((word) => !skip.has(word.toLowerCase()))
  if (meaningful.length === 1) {
    return meaningful[0]!.slice(0, 12)
  }
  if (meaningful.length >= 2) {
    const initials = meaningful
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('')
    if (initials.length >= 2) {
      return initials
    }
  }
  const host = domain.split('.')[0] ?? 'Campus'
  return host.slice(0, 12)
}

function slugFromDomain(domain: string): string {
  return domain.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function loadCatalog(): Promise<CatalogEntry[]> {
  if (!catalogPromise) {
    catalogPromise = fetch(`${assetBase()}data/universities.json`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('catalog missing')
        }
        const parsed: unknown = await response.json()
        if (!Array.isArray(parsed)) {
          return []
        }
        return parsed.filter((item): item is CatalogEntry => {
          return (
            !!item &&
            typeof item === 'object' &&
            typeof (item as CatalogEntry).name === 'string' &&
            Array.isArray((item as CatalogEntry).domains)
          )
        })
      })
      .catch(() => [])
  }
  return catalogPromise
}

function findInCatalog(catalog: CatalogEntry[], domain: string): CatalogEntry | null {
  let best: CatalogEntry | null = null
  let bestLength = -1
  for (const entry of catalog) {
    for (const item of entry.domains) {
      if (domainMatches(domain, item) && item.length > bestLength) {
        best = entry
        bestLength = item.length
      }
    }
  }
  return best
}

async function enrichDynamicProfile(
  name: string,
  domain: string,
  domains: string[],
): Promise<UniversityProfile> {
  const shortName = shortNameFrom(name, domain)
  const previewGuess = fallbackColorsFromDomain(domain)
  const logoUrl = await resolveCampusLogoUrl(
    domain,
    name,
    shortName,
    previewGuess[0],
    previewGuess[1],
  )
  const sampled = logoUrl.startsWith('data:')
    ? null
    : await colorsFromLogoUrl(logoUrl)
  const preview = sampled ?? previewGuess
  return {
    id: slugFromDomain(domain),
    name,
    shortName,
    domains,
    themeId: 'campus',
    preview,
    logoUrl,
    brandNotes: sampled
      ? `Colors sampled from ${domain} logo`
      : `Theme colors for ${name}`,
  }
}

/** Sync lookup for curated campuses only. */
export function detectUniversity(email: string): UniversityProfile | null {
  const domain = emailDomain(email)
  if (!domain) {
    return null
  }
  for (const university of UNIVERSITIES) {
    if (university.domains.some((item) => domainMatches(domain, item))) {
      return university
    }
  }
  return null
}

/**
 * Resolve any school from email domain:
 * curated logos first, then university catalog + Clearbit logo/colors.
 */
export async function resolveUniversity(email: string): Promise<UniversityProfile | null> {
  const curated = detectUniversity(email)
  if (curated) {
    return curated
  }

  const domain = emailDomain(email)
  if (!domain) {
    return null
  }

  const catalog = await loadCatalog()
  const match = findInCatalog(catalog, domain)
  if (match) {
    const primaryDomain =
      match.domains.find((item) => domainMatches(domain, item)) ?? match.domains[0] ?? domain
    return enrichDynamicProfile(match.name, primaryDomain, match.domains)
  }

  // Unknown .edu / school-like domain: still try logo + colors.
  if (domain.endsWith('.edu') || domain.endsWith('.ac.uk') || domain.includes('.edu.')) {
    const label = domain.split('.')[0] ?? domain
    const pretty = label.charAt(0).toUpperCase() + label.slice(1)
    return enrichDynamicProfile(pretty, domain, [domain])
  }

  return null
}

export function isCampusThemeId(themeId: ThemeId): boolean {
  return themeId === 'campus' || UNIVERSITIES.some((university) => university.themeId === themeId)
}

export function universityToThemeOption(university: UniversityProfile) {
  return {
    id: university.themeId,
    label: university.shortName,
    description: university.name,
    preview: university.preview,
    group: 'campus' as const,
  }
}
