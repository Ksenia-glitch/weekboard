import {
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import type { CalendarView } from '../types/view'
import { parseDateKey, toDateKey } from './dates'
import { userScopedKey } from './userStorage'

/** Terms start at week 0. */
export const MIN_TERM_WEEK = 0
export const MAX_TERM_WEEK = 20

export type TermWeekSettings = {
  /** Monday (YYYY-MM-DD) of the week the user labeled. */
  anchorMondayKey: string
  /** College week number for that Monday's week (0 … final). */
  weekNumber: number
  /** Last week of the term (final week). */
  finalWeekNumber: number
}

export type TermWeekPhase = 'before' | 'term' | 'after'

export type TermWeekInfo = {
  /** Computed week index from the anchor. */
  raw: number
  /** Week number in term (0 … final). Null before/after term. */
  displayNumber: number | null
  phase: TermWeekPhase
  isFinal: boolean
}

const STORAGE_KEY = 'weekboard-term-week-v3'

export function getMondayKey(date: Date = new Date()): string {
  return toDateKey(startOfWeek(date, { weekStartsOn: 1 }))
}

export function isSameCalendarWeek(a: Date, b: Date): boolean {
  return getMondayKey(a) === getMondayKey(b)
}

export function readTermWeekSettings(userId: string): TermWeekSettings | null {
  try {
    const raw = localStorage.getItem(userScopedKey(STORAGE_KEY, userId))
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    const data = parsed as Partial<TermWeekSettings>
    if (
      typeof data.anchorMondayKey !== 'string' ||
      typeof data.weekNumber !== 'number' ||
      typeof data.finalWeekNumber !== 'number'
    ) {
      return null
    }
    if (
      !Number.isInteger(data.weekNumber) ||
      !Number.isInteger(data.finalWeekNumber) ||
      data.weekNumber < MIN_TERM_WEEK ||
      data.weekNumber > MAX_TERM_WEEK ||
      data.finalWeekNumber < MIN_TERM_WEEK ||
      data.finalWeekNumber > MAX_TERM_WEEK ||
      data.finalWeekNumber < data.weekNumber
    ) {
      return null
    }
    return {
      anchorMondayKey: data.anchorMondayKey,
      weekNumber: data.weekNumber,
      finalWeekNumber: data.finalWeekNumber,
    }
  } catch {
    return null
  }
}

export function writeTermWeekSettings(userId: string, settings: TermWeekSettings): void {
  localStorage.setItem(userScopedKey(STORAGE_KEY, userId), JSON.stringify(settings))
}

export function getTermWeekInfo(
  viewDate: Date,
  settings: TermWeekSettings | null,
): TermWeekInfo | null {
  if (!settings) {
    return null
  }

  const viewMonday = startOfWeek(viewDate, { weekStartsOn: 1 })
  const anchorMonday = parseDateKey(settings.anchorMondayKey)
  const delta = differenceInCalendarWeeks(viewMonday, anchorMonday, { weekStartsOn: 1 })
  const raw = settings.weekNumber + delta

  if (raw > settings.finalWeekNumber) {
    return {
      raw,
      displayNumber: null,
      phase: 'after',
      isFinal: false,
    }
  }

  if (raw < MIN_TERM_WEEK) {
    return {
      raw,
      displayNumber: null,
      phase: 'before',
      isFinal: false,
    }
  }

  return {
    raw,
    displayNumber: raw,
    phase: 'term',
    isFinal: raw === settings.finalWeekNumber,
  }
}

export function getTermWeekNumber(
  viewDate: Date,
  settings: TermWeekSettings | null,
): number | null {
  const info = getTermWeekInfo(viewDate, settings)
  return info?.displayNumber ?? null
}

export function formatTermWeekLabel(info: TermWeekInfo | null): string {
  if (!info) {
    return 'Set week #'
  }
  if (info.phase === 'before') {
    return 'Before term'
  }
  if (info.phase === 'after' || info.displayNumber === null) {
    return 'After term'
  }
  if (info.isFinal) {
    return 'Final week'
  }
  return `Week ${info.displayNumber}`
}

export function formatMonthWeekLabel(info: TermWeekInfo | null, fallback: string): string {
  if (!info) {
    return fallback
  }
  if (info.phase === 'before') {
    return 'Pre'
  }
  if (info.phase === 'after' || info.displayNumber === null) {
    return '—'
  }
  if (info.isFinal) {
    return 'Final'
  }
  return String(info.displayNumber)
}

export function getNavLabel(
  viewDate: Date,
  view: CalendarView,
  today: Date = new Date(),
): string {
  const now = startOfDay(today)

  if (view === 'day') {
    const dayOffset =
      (startOfDay(viewDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    if (dayOffset === 0) {
      return 'Today'
    }
    if (dayOffset === 1) {
      return 'Tomorrow'
    }
    if (dayOffset === -1) {
      return 'Yesterday'
    }
    return 'Jump to today'
  }

  if (view === 'week') {
    const weekOffset = differenceInCalendarWeeks(
      startOfWeek(viewDate, { weekStartsOn: 1 }),
      startOfWeek(now, { weekStartsOn: 1 }),
      { weekStartsOn: 1 },
    )
    if (weekOffset === 0) {
      return 'This week'
    }
    if (weekOffset === 1) {
      return 'Next week'
    }
    if (weekOffset === -1) {
      return 'Last week'
    }
    if (weekOffset > 1) {
      return `In ${weekOffset} weeks`
    }
    return `${Math.abs(weekOffset)} weeks ago`
  }

  if (view === 'month') {
    const monthOffset = differenceInCalendarMonths(viewDate, now)
    if (monthOffset === 0) {
      return 'This month'
    }
    if (monthOffset === 1) {
      return 'Next month'
    }
    if (monthOffset === -1) {
      return 'Last month'
    }
    return 'Jump to today'
  }

  const yearOffset = differenceInCalendarYears(viewDate, now)
  if (yearOffset === 0) {
    return 'This year'
  }
  if (yearOffset === 1) {
    return 'Next year'
  }
  if (yearOffset === -1) {
    return 'Last year'
  }
  return 'Jump to today'
}
