import { useEffect, useState } from 'react'
import { userScopedKey } from '../utils/userStorage'

const STORAGE_KEY = 'weekboard-courses-v1'

function readCourses(userId: string): string[] {
  try {
    const raw = localStorage.getItem(userScopedKey(STORAGE_KEY, userId))
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

function writeCourses(userId: string, courses: string[]): void {
  localStorage.setItem(userScopedKey(STORAGE_KEY, userId), JSON.stringify(courses))
}

export function useCourses(userId: string) {
  const [courses, setCoursesState] = useState<string[]>(() => readCourses(userId))
  const [askOpen, setAskOpen] = useState(() => readCourses(userId).length === 0)

  useEffect(() => {
    writeCourses(userId, courses)
  }, [courses, userId])

  function saveCourses(next: string[]) {
    const cleaned = next
      .map((item) => item.trim())
      .filter((item, index, list) => item.length > 0 && list.indexOf(item) === index)
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
