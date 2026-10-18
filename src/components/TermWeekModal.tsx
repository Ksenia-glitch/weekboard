import { useId, useState } from 'react'
import { MAX_TERM_WEEK, MIN_TERM_WEEK } from '../utils/termWeek'
import type { TermWeekDraft } from '../hooks/useTermWeek'

type TermWeekModalProps = {
  currentWeekGuess?: number | null
  finalWeekGuess?: number | null
  canSkip: boolean
  onSave: (draft: TermWeekDraft) => void
  onSkip: () => void
}

export function TermWeekModal({
  currentWeekGuess,
  finalWeekGuess,
  canSkip,
  onSave,
  onSkip,
}: TermWeekModalProps) {
  const titleId = useId()
  const [currentWeek, setCurrentWeek] = useState(
    String(
      currentWeekGuess !== null &&
        currentWeekGuess !== undefined &&
        currentWeekGuess >= MIN_TERM_WEEK
        ? currentWeekGuess
        : 0,
    ),
  )
  const [finalWeek, setFinalWeek] = useState(
    String(
      finalWeekGuess !== null &&
        finalWeekGuess !== undefined &&
        finalWeekGuess >= MIN_TERM_WEEK
        ? finalWeekGuess
        : 11,
    ),
  )
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const weekNumber = Number.parseInt(currentWeek, 10)
    const finalWeekNumber = Number.parseInt(finalWeek, 10)

    if (
      !Number.isInteger(weekNumber) ||
      weekNumber < MIN_TERM_WEEK ||
      weekNumber > MAX_TERM_WEEK
    ) {
      setError(`Current week must be from ${MIN_TERM_WEEK} to ${MAX_TERM_WEEK}.`)
      return
    }
    if (
      !Number.isInteger(finalWeekNumber) ||
      finalWeekNumber < MIN_TERM_WEEK ||
      finalWeekNumber > MAX_TERM_WEEK
    ) {
      setError(`Final week must be from ${MIN_TERM_WEEK} to ${MAX_TERM_WEEK}.`)
      return
    }
    if (finalWeekNumber < weekNumber) {
      setError('Final week cannot be earlier than this week.')
      return
    }

    onSave({ weekNumber, finalWeekNumber })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal modal--compact modal--themed"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <p className="modal__eyebrow">College calendar</p>
        <h2 id={titleId} className="modal__title">
          Set your term weeks
        </h2>
        <p className="modal__lead">
          Terms run from Week 0 to Final week. Before the term starts you’ll see “Before term”;
          after finals, week numbers stop.
        </p>

        <form className="modal__form" onSubmit={handleSubmit}>
          <label className="field">
            <span>This week is #</span>
            <input
              type="number"
              min={MIN_TERM_WEEK}
              max={MAX_TERM_WEEK}
              value={currentWeek}
              onChange={(event) => setCurrentWeek(event.target.value)}
              autoFocus
            />
            <em>What week of the term is it right now? (starts at 0)</em>
          </label>

          <label className="field">
            <span>Final week is #</span>
            <input
              type="number"
              min={MIN_TERM_WEEK}
              max={MAX_TERM_WEEK}
              value={finalWeek}
              onChange={(event) => setFinalWeek(event.target.value)}
            />
            <em>Last week of the term (finals week)</em>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal__actions">
            {canSkip && (
              <button type="button" className="text-btn" onClick={onSkip}>
                Ask me later
              </button>
            )}
            <div className="modal__actions-right">
              <button type="submit" className="primary-btn">
                Save term weeks
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
