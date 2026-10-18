import type { Task } from '../types'
import { getAssessmentOption, needsPrep } from '../utils/assessment'
import { formatShortDate } from '../utils/dates'
import { isCarriedForward } from '../utils/taskVisibility'
import { getUrgency } from '../utils/urgency'

type TaskCardProps = {
  task: Task
  day: Date
  onOpen: (task: Task) => void
  onToggle: (taskId: string) => void
}

export function TaskCard({ task, day, onOpen, onToggle }: TaskCardProps) {
  const urgency = getUrgency(task)
  const carried = isCarriedForward(task, day)
  const attachmentCount = task.attachments.length
  const assessment = getAssessmentOption(task.assessmentType)
  const prep = needsPrep(task.assessmentType)

  return (
    <article className={`task-card urgency-${urgency.level}`}>
      <div className="task-card__top">
        <button
          type="button"
          className={`task-check ${task.completed ? 'is-done' : ''}`}
          aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
          onClick={(event) => {
            event.stopPropagation()
            onToggle(task.id)
          }}
        >
          {task.completed ? <span className="task-check__mark">✓</span> : null}
        </button>
        <button type="button" className="task-card__body" onClick={() => onOpen(task)}>
          {task.subject && <p className="task-card__subject">{task.subject}</p>}
          <h3 className="task-card__title">{task.title}</h3>
          <p className="task-card__meta">
            <span className={`task-card__type type-${task.assessmentType}`}>
              {assessment.shortLabel}
            </span>
            <span className="task-card__urgency">{urgency.label}</span>
            <span className="task-card__deadline">
              {prep ? 'On' : 'Due'} {formatShortDate(task.deadline)}
            </span>
          </p>
          {prep && task.topics && !task.completed && (
            <p className="task-card__topics">{task.topics}</p>
          )}
          {(prep || carried || attachmentCount > 0) && (
            <p className="task-card__flags">
              {prep && !task.completed && <span className="flag flag-prep">Prep needed</span>}
              {carried && <span className="flag flag-carry">Carried from plan day</span>}
              {attachmentCount > 0 && (
                <span className="flag flag-files">
                  {attachmentCount} file{attachmentCount === 1 ? '' : 's'}
                </span>
              )}
            </p>
          )}
        </button>
      </div>
    </article>
  )
}
