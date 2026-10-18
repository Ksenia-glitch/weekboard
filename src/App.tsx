import { useMemo, useState } from 'react'
import { CoursesModal } from './components/CoursesModal'
import { DayColumn } from './components/DayColumn'
import { DayView } from './components/DayView'
import { MonthView } from './components/MonthView'
import { TaskModal } from './components/TaskModal'
import { TermWeekModal } from './components/TermWeekModal'
import { UrgencyLegend } from './components/UrgencyLegend'
import { WeekHeader } from './components/WeekHeader'
import { YearView } from './components/YearView'
import { useCourses } from './hooks/useCourses'
import { useTasks, type TaskDraft } from './hooks/useTasks'
import { useTermWeek } from './hooks/useTermWeek'
import { useTheme } from './hooks/useTheme'
import type { Task } from './types'
import type { TaskFamily } from './utils/assessment'
import type { CalendarView } from './types/view'
import {
  formatRangeLabel,
  getWeekDays,
  shiftAnchor,
  toDateKey,
} from './utils/dates'
import {
  formatTermWeekLabel,
  getNavLabel,
  getTermWeekInfo,
} from './utils/termWeek'
import './App.css'

type ModalState =
  | { open: false }
  | {
      open: true
      mode: 'create'
      initialDate: string
      initialFamily: TaskFamily | null
      task: null
    }
  | { open: true; mode: 'edit'; initialDate: string; task: Task }

function App() {
  const [view, setView] = useState<CalendarView>('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [modal, setModal] = useState<ModalState>({ open: false })
  const { theme, setTheme } = useTheme()
  const { settings, askOpen, saveTermWeeks, openWeekSetup, closeWeekSetup } = useTermWeek()
  const {
    courses,
    askOpen: askCoursesOpen,
    saveCourses,
    openCoursesSetup,
    closeCoursesSetup,
  } = useCourses()
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    addAttachment,
    removeAttachment,
  } = useTasks()

  const weekDays = useMemo(() => getWeekDays(anchor), [anchor])
  const rangeLabel = formatRangeLabel(anchor, view)
  const navLabel = getNavLabel(anchor, view, new Date())
  const termWeekInfo = getTermWeekInfo(anchor, settings)
  const termWeekLabel = formatTermWeekLabel(termWeekInfo)

  const editingTask = useMemo(() => {
    if (!modal.open || modal.mode !== 'edit' || !modal.task) {
      return null
    }
    return tasks.find((task) => task.id === modal.task.id) ?? modal.task
  }, [modal, tasks])

  function openCreate(dateKey?: string, family: TaskFamily | null = null) {
    setModal({
      open: true,
      mode: 'create',
      initialDate: dateKey ?? toDateKey(anchor),
      initialFamily: family,
      task: null,
    })
  }

  function openEdit(task: Task) {
    setModal({
      open: true,
      mode: 'edit',
      initialDate: task.plannedDate,
      task,
    })
  }

  function handleSaveCreate(draft: TaskDraft) {
    const created = addTask(draft)
    setModal({
      open: true,
      mode: 'edit',
      initialDate: created.plannedDate,
      task: created,
    })
  }

  function handleSaveEdit(id: string, draft: TaskDraft) {
    updateTask(id, draft)
  }

  function goToDay(day: Date) {
    setAnchor(day)
    setView('day')
  }

  function goToMonth(month: Date) {
    setAnchor(month)
    setView('month')
  }

  function goToWeek(weekAnchor: Date) {
    setAnchor(weekAnchor)
    setView('week')
  }

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden="true" />
      <WeekHeader
        view={view}
        rangeLabel={rangeLabel}
        navLabel={navLabel}
        termWeekLabel={termWeekLabel}
        showTermWeek={view === 'week'}
        theme={theme}
        onThemeChange={setTheme}
        onViewChange={setView}
        onPrev={() => setAnchor((prev) => shiftAnchor(prev, view, -1))}
        onNext={() => setAnchor((prev) => shiftAnchor(prev, view, 1))}
        onToday={() => setAnchor(new Date())}
        onSetTermWeek={openWeekSetup}
        onAdd={() => openCreate(toDateKey(anchor), null)}
      />

      <main className="week-board">
        {view === 'day' && (
          <DayView day={anchor} tasks={tasks} onOpen={openEdit} onToggle={toggleComplete} />
        )}

        {view === 'week' && (
          <div className="week-grid">
            {weekDays.map((day) => (
              <DayColumn
                key={toDateKey(day)}
                day={day}
                tasks={tasks}
                onOpen={openEdit}
                onToggle={toggleComplete}
                onSelectDay={goToDay}
              />
            ))}
          </div>
        )}

        {view === 'month' && (
          <MonthView
            monthAnchor={anchor}
            tasks={tasks}
            termSettings={settings}
            onSelectDay={goToDay}
            onSelectWeek={goToWeek}
          />
        )}

        {view === 'year' && (
          <YearView yearAnchor={anchor} tasks={tasks} onSelectMonth={goToMonth} />
        )}

        {(view === 'day' || view === 'week') && <UrgencyLegend />}
      </main>

      {askCoursesOpen && (
        <CoursesModal
          courses={courses}
          canSkip={courses.length > 0}
          onSave={saveCourses}
          onSkip={closeCoursesSetup}
        />
      )}

      {!askCoursesOpen && askOpen && (
        <TermWeekModal
          currentWeekGuess={settings?.weekNumber ?? termWeekInfo?.displayNumber}
          finalWeekGuess={settings?.finalWeekNumber ?? 11}
          canSkip
          onSave={(draft) => saveTermWeeks(draft, new Date())}
          onSkip={closeWeekSetup}
        />
      )}

      {modal.open && (
        <TaskModal
          key={
            modal.mode === 'edit'
              ? modal.task.id
              : `create-${modal.initialDate}-${modal.initialFamily ?? 'pick'}`
          }
          mode={modal.mode}
          initialDate={modal.initialDate}
          initialFamily={modal.mode === 'create' ? modal.initialFamily : null}
          courses={courses}
          task={editingTask}
          onClose={() => setModal({ open: false })}
          onSaveCreate={handleSaveCreate}
          onSaveEdit={handleSaveEdit}
          onDelete={deleteTask}
          onToggle={toggleComplete}
          onManageCourses={() => {
            setModal({ open: false })
            openCoursesSetup()
          }}
          onAddAttachment={addAttachment}
          onRemoveAttachment={removeAttachment}
        />
      )}
    </div>
  )
}

export default App
