import { useEffect, useState } from 'react'
import { resolveUniversity, type UniversityProfile } from '../universities'

/** Resolve university (logo + theme) from a typed email address. */
export function useCampusFromEmail(email: string): UniversityProfile | null {
  const [campus, setCampus] = useState<UniversityProfile | null>(null)

  useEffect(() => {
    const trimmed = email.trim()
    // Drop the previous school immediately so the old logo cannot linger.
    setCampus(null)

    if (!trimmed.includes('@')) {
      return
    }

    let cancelled = false
    const requestId = trimmed.toLowerCase()
    const timer = window.setTimeout(() => {
      void resolveUniversity(trimmed).then((result) => {
        if (cancelled) {
          return
        }
        // Ignore stale responses if the email changed mid-flight.
        if (email.trim().toLowerCase() !== requestId) {
          return
        }
        setCampus(result)
      })
    }, 200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [email])

  return campus
}
