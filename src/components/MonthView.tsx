import { getWeek } from 'date-fns'
import type { Task } from '../types'
import {
  formatDayNumber,
  getMonthGridDays,
  isDateToday,
  isInSameMonth,
  toDateKey,
} from '../utils/dates'
import { tasksForDay } from '../utils/taskVisibility'
import {
  formatMonthWeekLabel,
  getTermWeekInfo,
  type TermWeekSettings,
} from '../utils/termWeek'
import { getUrgency } from '../utils/urgency'

type MonthViewProps = {
  monthAnchor: Date
  tasks: Task[]
  termSettings: TermWeekSettings | null
  onSelectDay: (day: Date) => void
  onSelectWeek: (weekAnchor: Date) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAYS_PER_WEEK = 7

function chunkWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = []
  for (let index = 0; index < days.length; index += DAYS_PER_WEEK) {
    weeks.push(days.slice(index, index + DAYS_PER_WEEK))
  }
  return weeks
}

function weekLabelFor(monday: Date, termSettings: TermWeekSettings | null): string {
  const fallback = String(getWeek(monday, { weekStartsOn: 1 }))
  return formatMonthWeekLabel(getTermWeekInfo(monday, termSettings), fallback)
}

export function MonthView({
  monthAnchor,
  tasks,
  termSettings,
  onSelectDay,
  onSelectWeek,
}: MonthViewProps) {
  const weeks = chunkWeeks(getMonthGridDays(monthAnchor))

  return (
    <section className="month-view">
      <div className="month-view__weekdays">
        <p className="month-view__week-label-spacer" aria-hidden="true">
          Wk
        </p>
        {WEEKDAYS.map((label) => (
          <p key={label} className="month-view__weekday">
            {label}
          </p>
        ))}
      </div>

      <div className="month-view__rows">
        {weeks.map((weekDays) => {
          const monday = weekDays[0]
          const weekLabel = weekLabelFor(monday, termSettings)

          return (
            <div key={toDateKey(monday)} className="month-view__row">
              <button
                type="button"
                className="month-week-label"
                title="Open this week"
                onClick={() => onSelectWeek(monday)}
              >
                <span className="month-week-label__text">{weekLabel}</span>
              </button>

              <div className="month-view__days">
                {weekDays.map((day) => {
                  const inMonth = isInSameMonth(day, monthAnchor)
                  const dayTasks = tasksForDay(tasks, day)
                  const openTasks = dayTasks.filter((task) => !task.completed)
                  const topUrgency = openTasks[0] ? getUrgency(openTasks[0]).level : null

                  return (
                    <button
                      key={toDateKey(day)}
                      type="button"
                      className={[
                        'month-cell',
                        inMonth ? '' : 'is-outside',
                        isDateToday(day) ? 'is-today' : '',
                        topUrgency ? `urgency-${topUrgency}` : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => onSelectDay(day)}
                    >
                      <span className="month-cell__date">{formatDayNumber(day)}</span>
                      {dayTasks.length > 0 && (
                        <span className="month-cell__count">
                          {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'}
                        </span>
                      )}
                      <span className="month-cell__dots" aria-hidden="true">
                        {openTasks.slice(0, 3).map((task) => (
                          <span
                            key={task.id}
                            className={`month-dot urgency-${getUrgency(task).level}`}
                          />
                        ))}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
