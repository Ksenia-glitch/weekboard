import { useState } from 'react'
import {
  getMondayKey,
  readTermWeekSettings,
  writeTermWeekSettings,
  type TermWeekSettings,
} from '../utils/termWeek'

export type TermWeekDraft = {
  weekNumber: number
  finalWeekNumber: number
}

export function useTermWeek(userId: string) {
  const [settings, setSettings] = useState<TermWeekSettings | null>(() =>
    readTermWeekSettings(userId),
  )
  const [askOpen, setAskOpen] = useState(() => readTermWeekSettings(userId) === null)

  function saveTermWeeks(draft: TermWeekDraft, forDate: Date = new Date()) {
    const next: TermWeekSettings = {
      anchorMondayKey: getMondayKey(forDate),
      weekNumber: draft.weekNumber,
      finalWeekNumber: draft.finalWeekNumber,
    }
    writeTermWeekSettings(userId, next)
    setSettings(next)
    setAskOpen(false)
  }

  function openWeekSetup() {
    setAskOpen(true)
  }

  function closeWeekSetup() {
    setAskOpen(false)
  }

  return {
    settings,
    askOpen,
    saveTermWeeks,
    openWeekSetup,
    closeWeekSetup,
  }
}
