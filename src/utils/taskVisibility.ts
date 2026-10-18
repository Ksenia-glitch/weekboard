import type { Task } from '../types'
import { parseDateKey, toDateKey } from './dates'

/**
 * A task shows on its planned day.
 * If unfinished and the planned day is before this day (within the week),
 * it also carries forward onto later days so you still see it.
 */
export function tasksForDay(tasks: Task[], day: Date, today: Date = new Date()): Task[] {
  const dayKey = toDateKey(day)
  const todayKey = toDateKey(today)

  return tasks
    .filter((task) => {
      if (task.plannedDate === dayKey) {
        return true
      }

      if (task.completed) {
        return false
      }

      const planned = parseDateKey(task.plannedDate)
      const isCarryForward = planned < day && dayKey <= todayKey
      return isCarryForward
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return a.deadline.localeCompare(b.deadline) || a.title.localeCompare(b.title)
    })
}

export function isCarriedForward(task: Task, day: Date): boolean {
  return task.plannedDate !== toDateKey(day) && !task.completed
}
