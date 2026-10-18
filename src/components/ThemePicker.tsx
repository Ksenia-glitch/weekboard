import { useEffect, useId, useRef, useState } from 'react'
import {
  BASE_THEME_OPTIONS,
  THEME_OPTIONS,
  type ThemeId,
  type ThemeOption,
} from '../themes'

type ThemePickerProps = {
  theme: ThemeId
  onChange: (theme: ThemeId) => void
  /** Student's school theme option (curated or looked-up). */
  campusOption?: ThemeOption | null
  onSelectCampus?: () => void
}

function ThemeOptionButton({
  option,
  selected,
  onSelect,
}: {
  option: ThemeOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={`theme-picker__option ${selected ? 'is-selected' : ''}`}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onSelect()
      }}
    >
      <span className="theme-picker__dots" aria-hidden="true">
        {option.preview.map((color) => (
          <span key={`${option.id}-${option.label}-${color}`} style={{ background: color }} />
        ))}
      </span>
      <span className="theme-picker__copy">
        <strong>{option.label}</strong>
        <em>{option.description}</em>
      </span>
    </button>
  )
}

export function ThemePicker({
  theme,
  onChange,
  campusOption = null,
  onSelectCampus,
}: ThemePickerProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const current =
    (campusOption && (theme === campusOption.id || theme === 'campus')
      ? campusOption
      : null) ??
    THEME_OPTIONS.find((option) => option.id === theme) ??
    BASE_THEME_OPTIONS[0]!

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
            {BASE_THEME_OPTIONS.map((option) => (
              <li key={option.id}>
                <ThemeOptionButton
                  option={option}
                  selected={option.id === theme}
                  onSelect={() => selectTheme(option.id)}
                />
              </li>
            ))}
          </ul>

          {campusOption && (
            <>
              <p className="theme-picker__heading theme-picker__heading--campus">
                Your college
              </p>
              <ul className="theme-picker__list">
                <li>
                  <ThemeOptionButton
                    option={campusOption}
                    selected={theme === campusOption.id || theme === 'campus'}
                    onSelect={() => {
                      if (onSelectCampus) {
                        onSelectCampus()
                      } else {
                        selectTheme(campusOption.id)
                      }
                      setOpen(false)
                    }}
                  />
                </li>
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
