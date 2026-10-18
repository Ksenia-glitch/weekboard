import type { ThemeId } from '../themes'
import type { CalendarView } from '../types/view'
import { CALENDAR_VIEWS } from '../types/view'
import { ThemePicker } from './ThemePicker'

type WeekHeaderProps = {
  view: CalendarView
  rangeLabel: string
  navLabel: string
  termWeekLabel: string
  showTermWeek: boolean
  theme: ThemeId
  onThemeChange: (theme: ThemeId) => void
  onViewChange: (view: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onSetTermWeek: () => void
  onAdd: () => void
}

export function WeekHeader({
  view,
  rangeLabel,
  navLabel,
  termWeekLabel,
  showTermWeek,
  theme,
  onThemeChange,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onSetTermWeek,
  onAdd,
}: WeekHeaderProps) {
  return (
    <header className="week-header">
      <div className="week-header__top">
        <div className="week-header__brand">
          <p className="brand-mark">Weekboard</p>
          <p className="brand-sub">Homework, quizzes, and due dates — one board.</p>
        </div>
        <ThemePicker theme={theme} onChange={onThemeChange} />
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
