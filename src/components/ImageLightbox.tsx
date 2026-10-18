import { useEffect } from 'react'

type ImageLightboxProps = {
  src: string
  alt: string
  onClose: () => void
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  return (
    <div
      className="lightbox-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label={alt || 'Image preview'}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="lightbox__close"
          onClick={onClose}
          aria-label="Close image"
        >
          ✕
        </button>
        <img className="lightbox__image" src={src} alt={alt} />
        {alt && <p className="lightbox__caption">{alt}</p>}
      </div>
    </div>
  )
}
