import { format } from 'date-fns'
import type { Task } from '../types'
import { getYearMonths, parseDateKey, toDateKey } from '../utils/dates'

type YearViewProps = {
  yearAnchor: Date
  tasks: Task[]
  onSelectMonth: (month: Date) => void
}

function tasksInMonth(tasks: Task[], month: Date): number {
  const monthKey = format(month, 'yyyy-MM')
  return tasks.filter((task) => {
    const planned = format(parseDateKey(task.plannedDate), 'yyyy-MM')
    const deadline = format(parseDateKey(task.deadline), 'yyyy-MM')
    return planned === monthKey || deadline === monthKey
  }).length
}

export function YearView({ yearAnchor, tasks, onSelectMonth }: YearViewProps) {
  const months = getYearMonths(yearAnchor)
  const now = new Date()

  return (
    <section className="year-view">
      <div className="year-view__grid">
        {months.map((month) => {
          const count = tasksInMonth(tasks, month)
          const isCurrent =
            month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth()

          return (
            <button
              key={toDateKey(month)}
              type="button"
              className={`year-cell ${isCurrent ? 'is-current' : ''}`}
              onClick={() => onSelectMonth(month)}
            >
              <span className="year-cell__name">{format(month, 'MMM')}</span>
              <span className="year-cell__count">
                {count === 0 ? 'No tasks' : `${count} task${count === 1 ? '' : 's'}`}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
