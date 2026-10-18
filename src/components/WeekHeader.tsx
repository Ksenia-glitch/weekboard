import type { ThemeId, ThemeOption } from '../themes'
import type { CalendarView } from '../types/view'
import { CALENDAR_VIEWS } from '../types/view'
import { CampusBadge } from './CampusBadge'
import { ThemePicker } from './ThemePicker'

type WeekHeaderProps = {
  view: CalendarView
  rangeLabel: string
  navLabel: string
  termWeekLabel: string
  showTermWeek: boolean
  username: string
  theme: ThemeId
  campusOption?: ThemeOption | null
  campusBadge?: {
    key?: string
    name: string
    shortName: string
    logoUrl: string
    primary: string
    accent: string
  } | null
  onThemeChange: (theme: ThemeId) => void
  onSelectCampus?: () => void
  onViewChange: (view: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onSetTermWeek: () => void
  onAdd: () => void
  onLogout: () => void
}

export function WeekHeader({
  view,
  rangeLabel,
  navLabel,
  termWeekLabel,
  showTermWeek,
  username,
  theme,
  campusOption = null,
  campusBadge = null,
  onThemeChange,
  onSelectCampus,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onSetTermWeek,
  onAdd,
  onLogout,
}: WeekHeaderProps) {
  return (
    <header className="week-header">
      <div className="week-header__top">
        <div className="week-header__brand">
          <div className="brand-mark-row">
            <p className="brand-mark">Weekboard</p>
            {campusBadge && (
              <CampusBadge
                key={campusBadge.key ?? campusBadge.logoUrl}
                name={campusBadge.name}
                shortName={campusBadge.shortName}
                logoUrl={campusBadge.logoUrl}
                primary={campusBadge.primary}
                accent={campusBadge.accent}
              />
            )}
          </div>
          <p className="brand-sub">Homework, quizzes, and due dates — one board.</p>
        </div>
        <div className="week-header__account">
          <span className="account-chip" title={`Signed in as ${username}`}>
            @{username}
          </span>
          <button type="button" className="nav-btn nav-btn--text" onClick={onLogout}>
            Sign out
          </button>
          <ThemePicker
            theme={theme}
            campusOption={campusOption}
            onChange={onThemeChange}
            onSelectCampus={onSelectCampus}
          />
        </div>
      </div>

      <div className="view-switcher" role="tablist" aria-label="Calendar view">
        {CALENDAR_VIEWS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={view === option.id}
            className={`view-switcher__btn ${view === option.id ? 'is-active' : ''}`}
            onClick={() => onViewChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="week-header__controls">
        <div className="week-nav">
          <button type="button" className="nav-btn" onClick={onPrev} aria-label="Previous">
            ←
          </button>
          <button type="button" className="nav-btn nav-btn--text" onClick={onToday}>
            {navLabel}
          </button>
          <button type="button" className="nav-btn" onClick={onNext} aria-label="Next">
            →
          </button>
        </div>

        <div className={`week-meta ${showTermWeek ? '' : 'week-meta--solo'}`}>
          {showTermWeek && (
            <button
              type="button"
              className="term-week-btn"
              onClick={onSetTermWeek}
              title="Set or change your college week number"
            >
              {termWeekLabel}
            </button>
          )}
          <h1 className="week-range">{rangeLabel}</h1>
        </div>

        <button
          type="button"
          className="add-btn"
          onClick={onAdd}
          aria-label="Add homework or quiz"
          title="Add homework or quiz"
        >
          +
        </button>
      </div>
    </header>
  )
}
