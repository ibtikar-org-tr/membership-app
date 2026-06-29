import { useRef, useState, type DragEvent } from 'react'
import { FiCalendar, FiMove, FiTarget, FiUser } from 'react-icons/fi'
import type { VmsTask } from '../../../types/vms'
import { formatDueDate, laneStyle, priorityBadgeClass, priorityTone, statusBadgeClass, taskPriorityLabel, taskStatusLabel } from './helpers'

const TASK_DRAG_MIME = 'application/x-vms-task-id'

type TaskBoardStatus = 'open' | 'in_progress' | 'completed' | 'archived'

interface BoardColumn {
  key: TaskBoardStatus
  label: string
  items: VmsTask[]
}

interface TaskBoardProps {
  boardColumns: BoardColumn[]
  onOpenTask: (taskId: string) => void
  onMoveTask: (taskId: string, status: TaskBoardStatus) => void
  canMoveTask: (task: VmsTask) => boolean
  formatAssignee: (membershipNumber: string | null) => string
}

interface TaskCardProps {
  task: VmsTask
  canMove: boolean
  isDragging: boolean
  formatAssignee: (membershipNumber: string | null) => string
  onOpenTask: (taskId: string) => void
  onDragStart: (taskId: string) => void
  onDragEnd: () => void
}

function TaskDropPlaceholder({ task }: { task: VmsTask }) {
  return (
    <article
      aria-hidden="true"
      className="rounded-xl border-2 border-dashed border-cyan-400 bg-gradient-to-b from-cyan-50/90 to-white/80 p-3.5 shadow-[0_18px_40px_-12px_rgba(14,116,144,0.45)] ring-2 ring-cyan-300/40"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 h-4 w-4 shrink-0 rounded bg-cyan-200/80" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-cyan-950/75">{task.name}</p>
          <p className="mt-2 text-xs font-medium text-cyan-700/80">أفلت المهمة هنا</p>
        </div>
      </div>
      <div className="mt-3 h-10 rounded-lg bg-cyan-100/50" />
    </article>
  )
}

function TaskCard({ task, canMove, isDragging, formatAssignee, onOpenTask, onDragStart, onDragEnd }: TaskCardProps) {
  const didDragRef = useRef(false)
  const priority = task.priority === 'high' || task.priority === 'low' || task.priority === 'medium' ? task.priority : 'medium'
  const isUnassigned = !task.assignedTo?.trim()
  const dueDateTimestamp = task.dueDate ? Date.parse(task.dueDate) : Number.NaN
  const isOverdue =
    Number.isFinite(dueDateTimestamp) &&
    dueDateTimestamp < Date.now() &&
    task.status !== 'completed' &&
    task.status !== 'archived'

  return (
    <article
      draggable={canMove}
      onDragStart={(event) => {
        if (!canMove) {
          event.preventDefault()
          return
        }

        didDragRef.current = true
        event.dataTransfer.setData(TASK_DRAG_MIME, task.id)
        event.dataTransfer.effectAllowed = 'move'

        const card = event.currentTarget
        const dragGhost = card.cloneNode(true) as HTMLElement
        dragGhost.style.width = `${card.offsetWidth}px`
        dragGhost.style.position = 'absolute'
        dragGhost.style.top = '-9999px'
        dragGhost.style.left = '-9999px'
        dragGhost.style.opacity = '0.96'
        dragGhost.style.pointerEvents = 'none'
        dragGhost.style.boxShadow = '0 22px 44px -14px rgba(15, 23, 42, 0.35), 0 10px 18px -10px rgba(8, 145, 178, 0.35)'
        dragGhost.style.transform = 'rotate(-1deg)'
        document.body.appendChild(dragGhost)
        event.dataTransfer.setDragImage(dragGhost, card.offsetWidth / 2, 28)
        window.setTimeout(() => {
          document.body.removeChild(dragGhost)
        }, 0)

        onDragStart(task.id)
      }}
      onDragEnd={() => {
        onDragEnd()
        window.setTimeout(() => {
          didDragRef.current = false
        }, 0)
      }}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (didDragRef.current) {
          return
        }

        onOpenTask(task.id)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenTask(task.id)
        }
      }}
      className={`group rounded-xl border bg-white p-3.5 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
        canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${
        isDragging
          ? 'scale-[0.98] border-dashed border-slate-300 bg-slate-50/80 opacity-35 shadow-none'
          : 'hover:-translate-y-0.5 hover:shadow-md'
      } ${
        isOverdue
          ? 'border-red-300/90 ring-1 ring-red-200/80 hover:border-red-400'
          : isUnassigned
            ? 'border-violet-300/90 ring-1 ring-violet-200/80 hover:border-violet-400'
            : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {canMove ? (
              <span className="mt-0.5 shrink-0 text-slate-300 transition group-hover:text-slate-500" aria-hidden="true">
                <FiMove className="h-4 w-4" />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{task.name}</p>
              {task.subtaskProgress && task.subtaskProgress.total > 0 ? (
                <span
                  className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                    task.subtaskProgress.completed === task.subtaskProgress.total
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  {task.subtaskProgress.completed}/{task.subtaskProgress.total} فرعية
                </span>
              ) : null}
              {isOverdue ? (
                <span className="mt-1 inline-flex rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                  متأخرة
                </span>
              ) : isUnassigned ? (
                <span className="mt-1 inline-flex rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
                  متاحة للتكليف
                </span>
              ) : null}
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{task.description ?? 'لا يوجد وصف للمهمة.'}</p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(task.status)}`}>
            {taskStatusLabel(task.status)}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityBadgeClass(priority)}`}>
            {taskPriorityLabel(priority)}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5" title="النقاط">
          <FiTarget className="h-3.5 w-3.5 text-slate-500" />
          <span>{task.points}</span>
        </p>
        <p
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${isOverdue ? 'bg-red-50 text-red-800' : 'bg-slate-50'}`}
          title="الموعد"
        >
          <FiCalendar className={`h-3.5 w-3.5 ${isOverdue ? 'text-red-700' : 'text-slate-500'}`} />
          <span>{formatDueDate(task.dueDate)}</span>
        </p>
        <p
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:col-span-2 ${
            isUnassigned ? 'bg-violet-50 text-violet-800' : 'bg-slate-50'
          }`}
          title="التكليف"
        >
          <FiUser className={`h-3.5 w-3.5 ${isUnassigned ? 'text-violet-700' : 'text-slate-500'}`} />
          <span>{formatAssignee(task.assignedTo)}</span>
        </p>
      </div>

      <div className="mt-2 flex items-center justify-end">
        <span className={`h-2 w-2 rounded-full transition ${priorityTone(priority)} group-hover:scale-110`} title={taskPriorityLabel(priority)} />
      </div>
    </article>
  )
}

export function TaskBoard({ boardColumns, onOpenTask, onMoveTask, canMoveTask, formatAssignee }: TaskBoardProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverColumnKey, setDragOverColumnKey] = useState<TaskBoardStatus | null>(null)

  const draggingTask = draggingTaskId
    ? boardColumns.flatMap((column) => column.items).find((task) => task.id === draggingTaskId) ?? null
    : null

  const draggingSourceColumnKey = draggingTaskId
    ? boardColumns.find((column) => column.items.some((task) => task.id === draggingTaskId))?.key ?? null
    : null

  function handleColumnDragOver(event: DragEvent<HTMLDivElement>, columnKey: TaskBoardStatus) {
    if (!event.dataTransfer.types.includes(TASK_DRAG_MIME)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverColumnKey(columnKey)
  }

  function handleColumnDrop(event: DragEvent<HTMLDivElement>, columnKey: TaskBoardStatus) {
    event.preventDefault()
    setDragOverColumnKey(null)
    setDraggingTaskId(null)

    const taskId = event.dataTransfer.getData(TASK_DRAG_MIME)
    if (!taskId) {
      return
    }

    onMoveTask(taskId, columnKey)
  }

  return (
    <div className="grid auto-cols-[minmax(20rem,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2">
      {boardColumns.map((column) => {
        const lane = laneStyle(column.key)
        const isDropTarget = dragOverColumnKey === column.key
        const isExternalDropTarget =
          isDropTarget && draggingTask !== null && draggingSourceColumnKey !== null && draggingSourceColumnKey !== column.key

        return (
          <section
            key={column.key}
            className={`flex max-h-[calc(100vh-18rem)] flex-col overflow-hidden rounded-2xl border shadow-sm transition ${lane.lane} ${
              isDropTarget ? 'ring-2 ring-cyan-400/70 ring-offset-2' : ''
            }`}
          >
            <header className={`sticky top-0 z-10 bg-gradient-to-b px-4 py-3 ${lane.head}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{column.label}</p>
                <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-800">
                  {column.items.length}
                </span>
              </div>
            </header>

            <div
              className={`min-h-[8rem] flex-1 space-y-3 overflow-y-auto px-3 pb-3 pt-3 transition ${
                isDropTarget ? 'bg-cyan-50/30' : ''
              }`}
              onDragOver={(event) => handleColumnDragOver(event, column.key)}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) {
                  return
                }

                setDragOverColumnKey((current) => (current === column.key ? null : current))
              }}
              onDrop={(event) => handleColumnDrop(event, column.key)}
            >
              {isExternalDropTarget && draggingTask ? <TaskDropPlaceholder task={draggingTask} /> : null}

              {column.items.length === 0 && !isExternalDropTarget ? (
                <div
                  className={`rounded-xl border border-dashed px-4 py-6 text-center text-sm transition ${
                    isDropTarget ? 'border-cyan-400 bg-cyan-50/80 text-cyan-800 shadow-[0_16px_32px_-14px_rgba(14,116,144,0.35)]' : 'border-slate-300 bg-white/70 text-slate-500'
                  }`}
                >
                  {isDropTarget ? 'أفلت المهمة هنا' : 'لا توجد مهام هنا بعد.'}
                </div>
              ) : null}

              {column.items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  canMove={canMoveTask(task)}
                  isDragging={draggingTaskId === task.id}
                  formatAssignee={formatAssignee}
                  onOpenTask={onOpenTask}
                  onDragStart={setDraggingTaskId}
                  onDragEnd={() => {
                    setDraggingTaskId(null)
                    setDragOverColumnKey(null)
                  }}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
