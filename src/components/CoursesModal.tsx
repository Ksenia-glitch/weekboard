import { useId, useState } from 'react'

type CoursesModalProps = {
  courses: string[]
  canSkip: boolean
  onSave: (courses: string[]) => void
  onSkip: () => void
}

export function CoursesModal({ courses, canSkip, onSave, onSkip }: CoursesModalProps) {
  const titleId = useId()
  const [draft, setDraft] = useState<string[]>(
    courses.length > 0 ? courses : ['', '', ''],
  )
  const [error, setError] = useState<string | null>(null)

  function updateCourse(index: number, value: string) {
    setDraft((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function addRow() {
    setDraft((prev) => [...prev, ''])
  }

  function removeRow(index: number) {
    setDraft((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const cleaned = draft.map((item) => item.trim()).filter((item) => item.length > 0)
    if (cleaned.length === 0) {
      setError('Add at least one class you are taking.')
      return
    }
    onSave(cleaned)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal modal--themed"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <p className="modal__eyebrow">Your classes</p>
        <h2 id={titleId} className="modal__title">
          Which classes are you taking?
        </h2>
        <p className="modal__lead">
          Add your real courses once. We’ll only suggest these when you create homework or a
          quiz/test — no random subjects.
        </p>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="course-list">
            {draft.map((course, index) => (
              <div key={`course-row-${index}`} className="course-list__row">
                <label className="field course-list__field">
                  <span>Class {index + 1}</span>
                  <input
                    value={course}
                    onChange={(event) => updateCourse(index, event.target.value)}
                    placeholder="e.g. CHEM 101, Writing 2…"
                    autoFocus={index === 0}
                  />
                </label>
                <button
                  type="button"
                  className="course-list__remove"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove class ${index + 1}`}
                  disabled={draft.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="text-btn" onClick={addRow}>
            + Add another class
          </button>

          {error && <p className="form-error">{error}</p>}

          <div className="modal__actions">
            {canSkip && (
              <button type="button" className="text-btn" onClick={onSkip}>
                Ask me later
              </button>
            )}
            <div className="modal__actions-right">
              <button type="submit" className="primary-btn">
                Save classes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
