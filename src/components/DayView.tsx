import type { Task } from '../types'
import { formatDayLabel, formatDayNumber, isDateToday, toDateKey } from '../utils/dates'
import { tasksForDay } from '../utils/taskVisibility'
import { TaskCard } from './TaskCard'

type DayViewProps = {
  day: Date
  tasks: Task[]
  onOpen: (task: Task) => void
  onToggle: (taskId: string) => void
}

export function DayView({ day, tasks, onOpen, onToggle }: DayViewProps) {
  const dayTasks = tasksForDay(tasks, day)
  const today = isDateToday(day)

  return (
    <section className={`day-view ${today ? 'is-today' : ''}`}>
      <header className="day-view__header">
        <p className="day-view__weekday">{formatDayLabel(day)}</p>
        <p className="day-view__date">{formatDayNumber(day)}</p>
      </header>
      <div className="day-view__tasks">
        {dayTasks.length === 0 ? (
          <p className="day-view__empty">Nothing planned for this day. Tap + to add something.</p>
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
