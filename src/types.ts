export type Attachment = {
  id: string
  name: string
  mimeType: string
  dataUrl: string
  createdAt: string
}

/**
 * homework = work to submit
 * quiz/test/exam = something you need to prepare for
 */
export type AssessmentType = 'homework' | 'quiz' | 'test' | 'exam'

export type Task = {
  id: string
  title: string
  subject: string
  assessmentType: AssessmentType
  /** Chapters / topics to review (mainly for quiz/test/exam). */
  topics: string
  /** What to turn in / extra notes (mainly for homework). */
  notes: string
  /** Day you plan to work / study (YYYY-MM-DD). */
  plannedDate: string
  /** Real due date or test date (YYYY-MM-DD). */
  deadline: string
  completed: boolean
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

export type UrgencyLevel =
  | 'done'
  | 'calm'
  | 'watch'
  | 'soon'
  | 'urgent'
  | 'overdue'
