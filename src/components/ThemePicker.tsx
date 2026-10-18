import { useEffect, useId, useRef, useState } from 'react'
import { THEME_OPTIONS, type ThemeId } from '../themes'

type ThemePickerProps = {
  theme: ThemeId
  onChange: (theme: ThemeId) => void
}

export function ThemePicker({ theme, onChange }: ThemePickerProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const current = THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0]!

  useEffect(() => {
    if (!open) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    // Defer so the opening click does not immediately close the menu.
    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown)
    }, 0)

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function selectTheme(next: ThemeId) {
    onChange(next)
    document.documentElement.setAttribute('data-theme', next)
    setOpen(false)
  }

  return (
    <div className={`theme-picker ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="theme-picker__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        title="Change site colors"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((prev) => !prev)
        }}
      >
        <span className="theme-picker__dots" aria-hidden="true">
          {current.preview.map((color) => (
            <span key={color} style={{ background: color }} />
          ))}
        </span>
        <span className="theme-picker__label">Colors</span>
      </button>

      {open && (
        <div
          className="theme-picker__menu"
          id={menuId}
          role="listbox"
          aria-label="Site theme"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <p className="theme-picker__heading">Pick a theme</p>
          <ul className="theme-picker__list">
            {THEME_OPTIONS.map((option) => {
              const selected = option.id === theme
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`theme-picker__option ${selected ? 'is-selected' : ''}`}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      selectTheme(option.id)
                    }}
                  >
                    <span className="theme-picker__dots" aria-hidden="true">
                      {option.preview.map((color) => (
                        <span key={`${option.id}-${color}`} style={{ background: color }} />
                      ))}
                    </span>
                    <span className="theme-picker__copy">
                      <strong>{option.label}</strong>
                      <em>{option.description}</em>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
