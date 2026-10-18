import { useEffect, useState } from 'react'
import type { AssessmentType, Attachment, Task, TaskLink } from '../types'
import { isAssessmentType } from '../utils/assessment'
import { isValidHttpUrl, linkLabelFromUrl, normalizeUrl } from '../utils/links'
import { userScopedKey } from '../utils/userStorage'

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
    assignmentFiles: Array.isArray(item.assignmentFiles) ? item.assignmentFiles : [],
    links: Array.isArray(item.links) ? item.links : [],
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : now,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : now,
  }
}

function readTasks(userId: string): Task[] {
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
      .map((item) => normalizeTask(item))
      .filter((task): task is Task => task !== null)
  } catch {
    return []
  }
}

function writeTasks(userId: string, tasks: Task[]): void {
  localStorage.setItem(userScopedKey(STORAGE_KEY, userId), JSON.stringify(tasks))
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

async function readFileAsDataUrl(file: File): Promise<string> {
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

async function fileToAttachment(file: File): Promise<Attachment> {
  const dataUrl = await readFileAsDataUrl(file)
  return {
    id: createId(),
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    dataUrl,
    createdAt: new Date().toISOString(),
  }
}

export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>(() => readTasks(userId))

  useEffect(() => {
    writeTasks(userId, tasks)
  }, [tasks, userId])

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
      assignmentFiles: [],
      links: [],
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
    const attachment = await fileToAttachment(file)
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

  async function addAssignmentFile(taskId: string, file: File): Promise<void> {
    const attachment = await fileToAttachment(file)
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              assignmentFiles: [...task.assignmentFiles, attachment],
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  function removeAssignmentFile(taskId: string, fileId: string): void {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              assignmentFiles: task.assignmentFiles.filter((item) => item.id !== fileId),
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  function addLink(taskId: string, rawUrl: string, label?: string): void {
    if (!isValidHttpUrl(rawUrl)) {
      throw new Error('Enter a valid website link.')
    }
    const url = normalizeUrl(rawUrl)
    const link: TaskLink = {
      id: createId(),
      url,
      label: label?.trim() || linkLabelFromUrl(url),
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              links: [...task.links, link],
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    )
  }

  function removeLink(taskId: string, linkId: string): void {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              links: task.links.filter((item) => item.id !== linkId),
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
    addAssignmentFile,
    removeAssignmentFile,
    addLink,
    removeLink,
  }
}
