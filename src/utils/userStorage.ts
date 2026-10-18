const LEGACY_MIGRATED_KEY = 'weekboard-legacy-migrated-v1'

const LEGACY_KEYS = {
  tasks: 'cadence-week-tasks-v1',
  courses: 'weekboard-courses-v1',
  termWeek: 'weekboard-term-week-v3',
} as const

export function userScopedKey(baseKey: string, userId: string): string {
  return `${baseKey}:${userId}`
}

/** Move anonymous data into the first account that signs in / registers. */
export function migrateLegacyDataIfNeeded(userId: string): void {
  try {
    if (localStorage.getItem(LEGACY_MIGRATED_KEY)) {
      return
    }

    for (const baseKey of Object.values(LEGACY_KEYS)) {
      const legacy = localStorage.getItem(baseKey)
      const scoped = userScopedKey(baseKey, userId)
      if (legacy && !localStorage.getItem(scoped)) {
        localStorage.setItem(scoped, legacy)
      }
    }

    localStorage.setItem(LEGACY_MIGRATED_KEY, userId)
  } catch {
    // Ignore storage errors.
  }
}
