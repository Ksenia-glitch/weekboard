import type { AssessmentType } from '../types'

export type TaskFamily = 'homework' | 'assessment'

export type AssessmentOption = {
  value: AssessmentType
  family: TaskFamily
  label: string
  shortLabel: string
  hint: string
}

export const ASSESSMENT_OPTIONS: AssessmentOption[] = [
  {
    value: 'homework',
    family: 'homework',
    label: 'Homework',
    shortLabel: 'Homework',
    hint: 'Assignment to complete and submit',
  },
  {
    value: 'quiz',
    family: 'assessment',
    label: 'Quiz',
    shortLabel: 'Quiz',
    hint: 'Short check — review notes before it',
  },
  {
    value: 'test',
    family: 'assessment',
    label: 'Test',
    shortLabel: 'Test',
    hint: 'Bigger than a quiz — plan study time',
  },
  {
    value: 'exam',
    family: 'assessment',
    label: 'Exam',
    shortLabel: 'Exam',
    hint: 'Major exam — start preparing early',
  },
]

export const PREP_OPTIONS = ASSESSMENT_OPTIONS.filter(
  (option) => option.family === 'assessment',
)

const ASSESSMENT_VALUES = new Set<AssessmentType>(
  ASSESSMENT_OPTIONS.map((option) => option.value),
)

export function isAssessmentType(value: unknown): value is AssessmentType {
  return typeof value === 'string' && ASSESSMENT_VALUES.has(value as AssessmentType)
}

export function getAssessmentOption(type: AssessmentType): AssessmentOption {
  const found = ASSESSMENT_OPTIONS.find((option) => option.value === type)
  if (found) {
    return found
  }
  return ASSESSMENT_OPTIONS[0]!
}

export function getTaskFamily(type: AssessmentType): TaskFamily {
  return getAssessmentOption(type).family
}

export function needsPrep(type: AssessmentType): boolean {
  return getTaskFamily(type) === 'assessment'
}

export function defaultTypeForFamily(family: TaskFamily): AssessmentType {
  return family === 'homework' ? 'homework' : 'test'
}
