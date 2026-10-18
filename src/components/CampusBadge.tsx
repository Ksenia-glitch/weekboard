import { useEffect, useMemo, useState } from 'react'
import { makeInitialsLogo } from '../utils/campusLogo'

type CampusBadgeProps = {
  name: string
  shortName?: string
  logoUrl: string
  primary?: string
  accent?: string
}

export function CampusBadge({
  name,
  shortName,
  logoUrl,
  primary = '#1f4d45',
  accent = '#c9783a',
}: CampusBadgeProps) {
  const initialsSrc = useMemo(
    () => makeInitialsLogo(shortName || name, primary, accent),
    [shortName, name, primary, accent],
  )
  const [src, setSrc] = useState(logoUrl || initialsSrc)

  useEffect(() => {
    setSrc(logoUrl || initialsSrc)
  }, [logoUrl, initialsSrc])

  return (
    <span className="campus-badge" title={name} aria-label={name}>
      <img
        className="campus-badge__img"
        src={src}
        alt=""
        width={64}
        height={64}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          if (src !== initialsSrc) {
            setSrc(initialsSrc)
          }
        }}
      />
    </span>
  )
}
