import { FiCalendar, FiTarget, FiUser } from 'react-icons/fi'
import type { VmsTask } from '../../../types/vms'
import { formatDueDate, laneStyle, priorityBadgeClass, priorityTone, statusBadgeClass, taskPriorityLabel, taskStatusLabel } from './helpers'

interface BoardColumn {
  key: string
  label: string
  items: VmsTask[]
}

interface TaskBoardProps {
  boardColumns: BoardColumn[]
  onOpenTask: (taskId: string) => void
  formatAssignee: (membershipNumber: string | null) => string
}

export function TaskBoard({ boardColumns, onOpenTask, formatAssignee }: TaskBoardProps) {
  return (
    <div className="grid auto-cols-[minmax(20rem,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2">
      {boardColumns.map((column) => {
        const lane = laneStyle(column.key)

        return (
          <section key={column.key} className={`flex max-h-[calc(100vh-18rem)] flex-col overflow-hidden rounded-2xl border shadow-sm ${lane.lane}`}>
            <header className={`sticky top-0 z-10 bg-gradient-to-b px-4 py-3 ${lane.head}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{column.label}</p>
                <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-800">
                  {column.items.length}
                </span>
              </div>
            </header>

            <div className="min-h-[8rem] flex-1 space-y-3 overflow-y-auto px-3 pb-3 pt-3">
              {column.items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
                  لا توجد مهام هنا بعد.
                </div>
              ) : null}

              {column.items.map((task) => {
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
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenTask(task.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpenTask(task.id)
                      }
                    }}
                    className={`group cursor-pointer rounded-xl border bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                      isOverdue
                        ? 'border-red-300/90 ring-1 ring-red-200/80 hover:border-red-400'
                        : isUnassigned
                          ? 'border-violet-300/90 ring-1 ring-violet-200/80 hover:border-violet-400'
                          : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{task.name}</p>
                        {isOverdue ? (
                          <span className="mt-1 inline-flex rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                            متأخرة
                          </span>
                        ) : isUnassigned ? (
                          <span className="mt-1 inline-flex rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
                            متاحة للتكليف
                          </span>
                        ) : null}
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                          {task.description ?? 'لا يوجد وصف للمهمة.'}
                        </p>
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
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
                          isOverdue ? 'bg-red-50 text-red-800' : 'bg-slate-50'
                        }`}
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
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
