import type { Task, UrgencyLevel } from '../types'
import { daysUntilDeadline } from './dates'

export type UrgencyInfo = {
  level: UrgencyLevel
  label: string
  daysLeft: number
}

export function getUrgency(task: Task, from: Date = new Date()): UrgencyInfo {
  if (task.completed) {
    return { level: 'done', label: 'Done', daysLeft: daysUntilDeadline(task.deadline, from) }
  }

  const daysLeft = daysUntilDeadline(task.deadline, from)

  if (daysLeft < 0) {
    const overdueBy = Math.abs(daysLeft)
    return {
      level: 'overdue',
      label: overdueBy === 1 ? '1 day overdue' : `${overdueBy} days overdue`,
      daysLeft,
    }
  }

  if (daysLeft === 0) {
    return { level: 'urgent', label: 'Due today', daysLeft }
  }

  if (daysLeft === 1) {
    return { level: 'urgent', label: 'Due tomorrow', daysLeft }
  }

  if (daysLeft <= 3) {
    return { level: 'soon', label: `${daysLeft} days left`, daysLeft }
  }

  if (daysLeft <= 6) {
    return { level: 'watch', label: `${daysLeft} days left`, daysLeft }
  }

  return { level: 'calm', label: `${daysLeft} days left`, daysLeft }
}

export const URGENCY_LEGEND: Array<{ level: UrgencyLevel; label: string }> = [
  { level: 'calm', label: '6+ days' },
  { level: 'watch', label: '4–6 days' },
  { level: 'soon', label: '2–3 days' },
  { level: 'urgent', label: 'Today / tomorrow' },
  { level: 'overdue', label: 'Overdue' },
  { level: 'done', label: 'Completed' },
]
