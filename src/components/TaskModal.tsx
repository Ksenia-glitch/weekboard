import { useEffect, useId, useState } from 'react'
import type { AssessmentType, Task } from '../types'
import type { TaskDraft } from '../hooks/useTasks'
import {
  PREP_OPTIONS,
  defaultTypeForFamily,
  getAssessmentOption,
  getTaskFamily,
  type TaskFamily,
} from '../utils/assessment'
import { formatShortDate } from '../utils/dates'
import { getUrgency } from '../utils/urgency'
import { ImageLightbox } from './ImageLightbox'

type TaskModalProps = {
  mode: 'create' | 'edit'
  initialDate: string
  /** Pre-select homework vs quiz/test when creating. */
  initialFamily?: TaskFamily | null
  courses: string[]
  task: Task | null
  onClose: () => void
  onSaveCreate: (draft: TaskDraft) => void
  onSaveEdit: (id: string, draft: TaskDraft) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onManageCourses: () => void
  onAddAttachment: (taskId: string, file: File) => Promise<void>
  onRemoveAttachment: (taskId: string, attachmentId: string) => void
}

const MAX_FILE_BYTES = 4 * 1024 * 1024

export function TaskModal({
  mode,
  initialDate,
  initialFamily = null,
  courses,
  task,
  onClose,
  onSaveCreate,
  onSaveEdit,
  onDelete,
  onToggle,
  onManageCourses,
  onAddAttachment,
  onRemoveAttachment,
}: TaskModalProps) {
  const titleId = useId()
  const startingFamily: TaskFamily | null = task
    ? getTaskFamily(task.assessmentType)
    : initialFamily
  const [family, setFamily] = useState<TaskFamily | null>(startingFamily)
  const [title, setTitle] = useState(task?.title ?? '')
  const [subject, setSubject] = useState(task?.subject ?? '')
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(
    task?.assessmentType ?? defaultTypeForFamily(startingFamily ?? 'homework'),
  )
  const [topics, setTopics] = useState(task?.topics ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [plannedDate, setPlannedDate] = useState(task?.plannedDate ?? initialDate)
  const [deadline, setDeadline] = useState(task?.deadline ?? initialDate)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !preview) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, preview])

  const urgency = task ? getUrgency(task) : null
  const isHomework = family === 'homework'
  const isAssessment = family === 'assessment'
  const showForm = family !== null

  function chooseFamily(next: TaskFamily) {
    setFamily(next)
    setAssessmentType(defaultTypeForFamily(next))
    setError(null)
  }

  async function handleFiles(fileList: FileList | null) {
    if (!task || !fileList || fileList.length === 0) {
      return
    }

    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        if (file.size > MAX_FILE_BYTES) {
          setError(`"${file.name}" is larger than 4 MB.`)
          continue
        }
        await onAddAttachment(task.id, file)
      }
    } catch {
      setError('Could not attach that file. Try a smaller photo or PDF.')
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!family) {
      setError('Choose homework or quiz/test first.')
      return
    }

    const trimmedTitle = title.trim()
    const trimmedSubject = subject.trim()
    if (!trimmedSubject) {
      setError('Add the subject / course name.')
      return
    }
    if (!trimmedTitle) {
      setError(isHomework ? 'Give the assignment a name.' : 'Give the quiz/test a name.')
      return
    }
    if (!plannedDate || !deadline) {
      setError(
        isHomework
          ? 'Choose both a plan day and a due date.'
          : 'Choose both a study day and the quiz/test date.',
      )
      return
    }

    const draft: TaskDraft = {
      title: trimmedTitle,
      subject: trimmedSubject,
      assessmentType: isHomework ? 'homework' : assessmentType,
      topics: isAssessment ? topics : '',
      notes,
      plannedDate,
      deadline,
    }

    if (mode === 'create') {
      onSaveCreate(draft)
      return
    }
    if (task) {
      onSaveEdit(task.id, draft)
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal modal--themed"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <p className="modal__eyebrow">{mode === 'create' ? 'New task' : 'Edit task'}</p>
            <h2 id={titleId} className="modal__title">
              {!showForm
                ? 'What are you adding?'
                : mode === 'create'
                  ? isHomework
                    ? 'Homework details'
                    : 'Quiz / test details'
                  : task?.title}
            </h2>
          </div>
          <button type="button" className="nav-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {task && urgency && (
          <p className={`modal__urgency urgency-${urgency.level}`}>
            {urgency.label}
            {task.completed
              ? ''
              : ` · ${isAssessment ? 'On' : 'Due'} ${formatShortDate(task.deadline)}`}
          </p>
        )}

        <div className="type-chooser" role="group" aria-label="Task type">
          <button
            type="button"
            className={`type-chooser__card ${family === 'homework' ? 'is-selected' : ''}`}
            onClick={() => chooseFamily('homework')}
          >
            <strong>Homework</strong>
            <span>Assignment to finish and turn in</span>
          </button>
          <button
            type="button"
            className={`type-chooser__card ${family === 'assessment' ? 'is-selected' : ''}`}
            onClick={() => chooseFamily('assessment')}
          >
            <strong>Quiz / Test</strong>
            <span>Something you need to study for</span>
          </button>
        </div>

        {showForm && (
          <form className="modal__form" onSubmit={handleSubmit}>
            <div className="field">
              <span>Class</span>
              {courses.length > 0 ? (
                <>
                  <div className="course-picker" role="group" aria-label="Your classes">
                    {courses.map((course) => (
                      <button
                        key={course}
                        type="button"
                        className={`course-picker__chip ${
                          subject === course ? 'is-selected' : ''
                        }`}
                        onClick={() => setSubject(course)}
                      >
                        {course}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="text-btn" onClick={onManageCourses}>
                    Edit my classes
                  </button>
                </>
              ) : (
                <>
                  <p className="field-note">
                    You haven’t added your classes yet — add them so we can suggest the right ones.
                  </p>
                  <button type="button" className="secondary-btn" onClick={onManageCourses}>
                    Add my classes
                  </button>
                </>
              )}
            </div>

            {isAssessment && (
              <fieldset className="prep-kind">
                <legend>Which one is it?</legend>
                <div className="prep-kind__options">
                  {PREP_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`prep-kind__option ${
                        assessmentType === option.value ? 'is-selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="prep-kind"
                        value={option.value}
                        checked={assessmentType === option.value}
                        onChange={() => setAssessmentType(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <label className="field">
              <span>{isHomework ? 'Assignment name' : `${getAssessmentOption(assessmentType).label} name`}</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  isHomework
                    ? 'Lab report, essay draft, worksheet…'
                    : 'Unit 3 test, Chapter quiz, Midterm…'
                }
                autoFocus
              />
            </label>

            {isHomework ? (
              <label className="field">
                <span>What do you need to do?</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Pages to complete, rubric notes, link to Canvas…"
                />
              </label>
            ) : (
              <>
                <label className="field">
                  <span>Topics to study</span>
                  <textarea
                    value={topics}
                    onChange={(event) => setTopics(event.target.value)}
                    rows={3}
                    placeholder="Chapters, formulas, vocabulary, slides to review…"
                  />
                  <em>Write what you need to prepare so it is obvious later</em>
                </label>
                <label className="field">
                  <span>Study notes (optional)</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={2}
                    placeholder="Practice problems, office hours, what you already reviewed…"
                  />
                </label>
              </>
            )}

            <div className="field-row">
              <label className="field">
                <span>{isHomework ? 'Plan day' : 'Study day'}</span>
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(event) => setPlannedDate(event.target.value)}
                />
                <em>
                  {isHomework
                    ? 'When you want to work on it'
                    : 'When you want to prepare for it'}
                </em>
              </label>
              <label className="field">
                <span>{isHomework ? 'Due date' : 'Quiz / test date'}</span>
                <input
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
                <em>
                  {isHomework
                    ? 'Canvas / true due date'
                    : 'The day of the quiz, test, or exam'}
                </em>
              </label>
            </div>

            {task && (
              <section className="attachments">
                <div className="attachments__header">
                  <h3>{isHomework ? 'Progress files' : 'Study materials'}</h3>
                  <label className="file-btn">
                    {uploading ? 'Adding…' : 'Attach photo / file'}
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.heic"
                      multiple
                      hidden
                      disabled={uploading}
                      onChange={(event) => {
                        void handleFiles(event.target.files)
                        event.target.value = ''
                      }}
                    />
                  </label>
                </div>
                <p className="attachments__hint">
                  {isHomework
                    ? 'Attach drafts or photos of what you already finished.'
                    : 'Attach notes, practice quizzes, or screenshots while you study.'}
                </p>
                {task.attachments.length === 0 ? (
                  <p className="attachments__empty">No files yet.</p>
                ) : (
                  <ul className="attachments__list">
                    {task.attachments.map((file) => (
                      <li key={file.id} className="attachment-item">
                        {file.mimeType.startsWith('image/') ? (
                          <button
                            type="button"
                            className="attachment-thumb"
                            onClick={() =>
                              setPreview({ src: file.dataUrl, alt: file.name })
                            }
                          >
                            <img src={file.dataUrl} alt={file.name} />
                          </button>
                        ) : (
                          <a href={file.dataUrl} download={file.name} className="attachment-file">
                            {file.name}
                          </a>
                        )}
                        <div className="attachment-item__meta">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            className="text-btn"
                            onClick={() => onRemoveAttachment(task.id, file.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {error && <p className="form-error">{error}</p>}

            <div className="modal__actions">
              {task && (
                <>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      onToggle(task.id)
                    }}
                  >
                    {task.completed ? 'Mark incomplete' : 'Mark done'}
                  </button>
                  <button
                    type="button"
                    className="text-btn danger"
                    onClick={() => {
                      onDelete(task.id)
                      onClose()
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
              <div className="modal__actions-right">
                <button type="button" className="nav-btn nav-btn--text" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {mode === 'create' ? 'Add to week' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>
        )}

        {!showForm && (
          <p className="modal__tip">Pick a type first — the form changes for homework vs quiz/test.</p>
        )}
      </div>

      {preview && (
        <ImageLightbox
          src={preview.src}
          alt={preview.alt}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}
