import { useState } from 'react'

const STORAGE_KEY = 'weekboard-courses-v1'

function readCourses(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  } catch {
    return []
  }
}

function writeCourses(courses: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses))
}

export function useCourses() {
  const [courses, setCoursesState] = useState<string[]>(() => readCourses())
  const [askOpen, setAskOpen] = useState(() => readCourses().length === 0)

  function saveCourses(next: string[]) {
    const cleaned = next
      .map((item) => item.trim())
      .filter((item, index, list) => item.length > 0 && list.indexOf(item) === index)
    writeCourses(cleaned)
    setCoursesState(cleaned)
    setAskOpen(cleaned.length === 0)
  }

  function openCoursesSetup() {
    setAskOpen(true)
  }

  function closeCoursesSetup() {
    setAskOpen(false)
  }

  return {
    courses,
    askOpen,
    saveCourses,
    openCoursesSetup,
    closeCoursesSetup,
  }
}
