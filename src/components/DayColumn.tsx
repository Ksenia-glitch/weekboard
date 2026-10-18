import type { Task } from '../types'
import {
  formatDayLabel,
  formatDayNumber,
  isDateToday,
  toDateKey,
} from '../utils/dates'
import { tasksForDay } from '../utils/taskVisibility'
import { TaskCard } from './TaskCard'

type DayColumnProps = {
  day: Date
  tasks: Task[]
  onOpen: (task: Task) => void
  onToggle: (taskId: string) => void
  onSelectDay?: (day: Date) => void
}

export function DayColumn({ day, tasks, onOpen, onToggle, onSelectDay }: DayColumnProps) {
  const dayTasks = tasksForDay(tasks, day)
  const today = isDateToday(day)

  return (
    <section className={`day-column ${today ? 'is-today' : ''}`}>
      <header className="day-column__header">
        {onSelectDay ? (
          <button
            type="button"
            className="day-column__title-btn"
            onClick={() => onSelectDay(day)}
          >
            <p className="day-column__weekday">{formatDayLabel(day)}</p>
            <p className="day-column__date">{formatDayNumber(day)}</p>
          </button>
        ) : (
          <div>
            <p className="day-column__weekday">{formatDayLabel(day)}</p>
            <p className="day-column__date">{formatDayNumber(day)}</p>
          </div>
        )}
      </header>
      <div className="day-column__tasks">
        {dayTasks.length === 0 ? (
          <p className="day-column__empty">No tasks</p>
        ) : (
          dayTasks.map((task) => (
            <TaskCard
              key={`${task.id}-${toDateKey(day)}`}
              task={task}
              day={day}
              onOpen={onOpen}
              onToggle={onToggle}
            />
          ))
        )}
      </div>
    </section>
  )
}
