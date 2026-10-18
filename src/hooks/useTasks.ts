import { useEffect, useState } from 'react'
import type { AssessmentType, Attachment, Task } from '../types'
import { isAssessmentType } from '../utils/assessment'

const STORAGE_KEY = 'cadence-week-tasks-v1'

function createId(): string {
  return crypto.randomUUID()
}

function normalizeTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const item = raw as Partial<Task> & { id?: unknown; title?: unknown }
  if (typeof item.id !== 'string' || typeof item.title !== 'string') {
    return null
  }

  const now = new Date().toISOString()
  let assessmentType: AssessmentType = 'homework'
  if (isAssessmentType(item.assessmentType)) {
    assessmentType = item.assessmentType
  }

  return {
    id: item.id,
    title: item.title,
    subject: typeof item.subject === 'string' ? item.subject : '',
    assessmentType,
    topics: typeof item.topics === 'string' ? item.topics : '',
    notes: typeof item.notes === 'string' ? item.notes : '',
    plannedDate: typeof item.plannedDate === 'string' ? item.plannedDate : now.slice(0, 10),
    deadline: typeof item.deadline === 'string' ? item.deadline : now.slice(0, 10),
    completed: Boolean(item.completed),
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : now,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : now,
  }
}

function readTasks(): Task[] {
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
      .map((item) => normalizeTask(item))
      .filter((task): task is Task => task !== null)
  } catch {
    return []
  }
}

function writeTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export type TaskDraft = {
  title: string
  subject: string
  assessmentType: AssessmentType
  topics: string
  notes: string
  plannedDate: string
  deadline: string
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => readTasks())

  useEffect(() => {
    writeTasks(tasks)
  }, [tasks])

  function addTask(draft: TaskDraft): Task {
    const now = new Date().toISOString()
    const task: Task = {
      id: createId(),
      title: draft.title.trim(),
      subject: draft.subject.trim(),
      assessmentType: draft.assessmentType,
      topics: draft.topics.trim(),
      notes: draft.notes.trim(),
      plannedDate: draft.plannedDate,
      deadline: draft.deadline,
      completed: false,
      attachments: [],
      createdAt: now,
      updatedAt: now,
    }
    setTasks((prev) => [...prev, task])
    return task
  }

  function updateTask(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): void {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              ...patch,
              subject: patch.subject !== undefined ? patch.subject.trim() : task.subject,
              title: patch.title !== undefined ? patch.title.trim() : task.title,
              notes: patch.notes !== undefined ? patch.notes.trim() : task.notes,
              topics: patch.topics !== undefined ? patch.topics.trim() : task.topics,
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  function deleteTask(id: string): void {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  function toggleComplete(id: string): void {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  async function addAttachment(taskId: string, file: File): Promise<void> {
    const dataUrl = await readFileAsDataUrl(file)
    const attachment: Attachment = {
      id: createId(),
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      dataUrl,
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              attachments: [...task.attachments, attachment],
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  function removeAttachment(taskId: string, attachmentId: string): void {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              attachments: task.attachments.filter((item) => item.id !== attachmentId),
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    addAttachment,
    removeAttachment,
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Could not read file'))
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Could not read file'))
    }
    reader.readAsDataURL(file)
  })
}
