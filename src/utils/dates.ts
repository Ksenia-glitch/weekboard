import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns'
import type { CalendarView } from '../types/view'

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function parseDateKey(dateKey: string): Date {
  return parseISO(dateKey)
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  const end = endOfWeek(anchor, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

/** Full month grid including leading/trailing days from adjacent months (Mon–Sun rows). */
export function getMonthGridDays(anchor: Date): Date[] {
  const monthStart = startOfMonth(anchor)
  const monthEnd = endOfMonth(anchor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  return eachDayOfInterval({ start: gridStart, end: gridEnd })
}

export function getYearMonths(anchor: Date): Date[] {
  const year = startOfYear(anchor)
  return Array.from({ length: 12 }, (_, index) => addMonths(year, index))
}

export function shiftAnchor(anchor: Date, view: CalendarView, direction: -1 | 1): Date {
  if (view === 'day') {
    return direction === 1 ? addDays(anchor, 1) : subDays(anchor, 1)
  }
  if (view === 'week') {
    return direction === 1 ? addWeeks(anchor, 1) : subWeeks(anchor, 1)
  }
  if (view === 'month') {
    return direction === 1 ? addMonths(anchor, 1) : subMonths(anchor, 1)
  }
  return direction === 1 ? addYears(anchor, 1) : subYears(anchor, 1)
}

export function formatRangeLabel(anchor: Date, view: CalendarView): string {
  if (view === 'day') {
    return format(anchor, 'EEEE, MMM d, yyyy')
  }
  if (view === 'week') {
    return formatWeekRange(getWeekDays(anchor))
  }
  if (view === 'month') {
    return format(anchor, 'MMMM yyyy')
  }
  return format(anchor, 'yyyy')
}

export function formatWeekRange(days: Date[]): string {
  if (days.length === 0) {
    return ''
  }
  const first = days[0]
  const last = days[days.length - 1]
  const sameMonth = format(first, 'MMM') === format(last, 'MMM')
  if (sameMonth) {
    return `${format(first, 'MMM d')} – ${format(last, 'd, yyyy')}`
  }
  return `${format(first, 'MMM d')} – ${format(last, 'MMM d, yyyy')}`
}

export function formatDayLabel(date: Date): string {
  return format(date, 'EEE')
}

export function formatDayNumber(date: Date): string {
  return format(date, 'd')
}

export function formatShortDate(dateKey: string): string {
  return format(parseDateKey(dateKey), 'EEE, MMM d')
}

export function daysUntilDeadline(deadlineKey: string, from: Date = new Date()): number {
  const deadline = parseDateKey(deadlineKey)
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((end.getTime() - start.getTime()) / msPerDay)
}

export function isDateToday(date: Date): boolean {
  return isToday(date)
}

export function isSameDate(a: Date, b: Date): boolean {
  return isSameDay(a, b)
}

export function isInSameMonth(day: Date, monthAnchor: Date): boolean {
  return isSameMonth(day, monthAnchor)
}

export function nextDayKey(dateKey: string): string {
  return toDateKey(addDays(parseDateKey(dateKey), 1))
}
