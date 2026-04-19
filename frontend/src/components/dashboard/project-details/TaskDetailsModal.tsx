import type { FormEvent } from 'react'
import type { VmsProjectMember, VmsTask } from '../../../types/vms'
import { formatDateEnCA } from '../../../utils/date-format'
import { formatDueDate, priorityBadgeClass, statusBadgeClass, taskPriorityLabel, taskStatusLabel } from './helpers'

interface TaskDetailsModalProps {
  selectedTask: VmsTask
  canEditSelectedTask: boolean
  isUpdatingTask: boolean
  taskUpdateError: string | null
  memberOptions: VmsProjectMember[]
  formatAssignee: (membershipNumber: string | null) => string
  onClose: () => void
  onUpdateTask: (event: FormEvent<HTMLFormElement>) => void
}

function normalizeTaskPriority(priority: string) {
  if (priority === 'high' || priority === 'low' || priority === 'medium') {
    return priority
  }

  return 'medium'
}

function normalizeTaskStatus(status: string) {
  if (status === 'open' || status === 'in_progress' || status === 'completed' || status === 'archived') {
    return status
  }

  return 'open'
}

export function TaskDetailsModal({
  selectedTask,
  canEditSelectedTask,
  isUpdatingTask,
  taskUpdateError,
  memberOptions,
  formatAssignee,
  onClose,
  onUpdateTask,
}: TaskDetailsModalProps) {
  const priority = normalizeTaskPriority(selectedTask.priority)
  const status = normalizeTaskStatus(selectedTask.status)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">بطاقة المهمة</p>
            <p className="mt-1 text-base font-semibold text-slate-950">تفاصيل المهمة</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50">
            إغلاق
          </button>
        </div>

        {canEditSelectedTask ? (
          <form onSubmit={onUpdateTask} className="mt-4 space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition focus-within:border-cyan-300 focus-within:bg-white">
              <label className="mb-2 block text-xs font-semibold text-slate-500">عنوان المهمة</label>
              <input
                name="name"
                defaultValue={selectedTask.name}
                autoFocus
                className="w-full rounded-2xl border border-transparent bg-transparent px-0 py-1 text-xl font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:px-4 focus:py-3 focus:text-base focus:ring-2 focus:ring-cyan-500/15"
                required
              />

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">الحالة</label>
                  <select
                    name="status"
                    defaultValue={status}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
                  >
                    <option value="open">مفتوحة</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="completed">مكتملة</option>
                    <option value="archived">مؤرشفة</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">الأولوية</label>
                  <select
                    name="priority"
                    defaultValue={priority}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">النقاط</label>
                  <input
                    name="points"
                    type="number"
                    min={1}
                    defaultValue={selectedTask.points}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">الموعد</label>
                  <input
                    name="dueDate"
                    type="date"
                    defaultValue={selectedTask.dueDate ? formatDateEnCA(selectedTask.dueDate) : ''}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">التكليف</label>
                  <select
                    name="assignedTo"
                    defaultValue={selectedTask.assignedTo ?? ''}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
                  >
                    <option value="">غير مسند</option>
                    {memberOptions.map((member) => (
                      <option key={`task-edit-member-${member.membershipNumber}`} value={member.membershipNumber}>
                        {member.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">الوصف</label>
                  <textarea
                    name="description"
                    defaultValue={selectedTask.description ?? ''}
                    className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
                    rows={4}
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">أنشئت بواسطة: {formatAssignee(selectedTask.createdBy)}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">تاريخ الإنشاء: {formatDateEnCA(selectedTask.createdAt)}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:col-span-2">آخر تحديث: {formatDateEnCA(selectedTask.updatedAt)}</p>
            </section>

            <section className="grid gap-2 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 sm:grid-cols-2">
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">المكلّف: {formatAssignee(selectedTask.assignedTo)}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">الأولوية: {taskPriorityLabel(priority)}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">النقاط: {selectedTask.points}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">الموعد: {formatDueDate(selectedTask.dueDate)}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:col-span-2">الحالة: {taskStatusLabel(status)}</p>
            </section>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isUpdatingTask}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isUpdatingTask ? 'جار حفظ التعديلات...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950">{selectedTask.name}</p>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(selectedTask.status)}`}>
                    {taskStatusLabel(selectedTask.status)}
                  </span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClass(priority)}`}>
                    {taskPriorityLabel(priority)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">{selectedTask.description ?? 'لا يوجد وصف للمهمة.'}</p>
            </section>

            <section className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">المكلّف: {formatAssignee(selectedTask.assignedTo)}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">الأولوية: {taskPriorityLabel(priority)}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">النقاط: {selectedTask.points}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">الموعد: {formatDueDate(selectedTask.dueDate)}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">أنشئت بواسطة: {formatAssignee(selectedTask.createdBy)}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">تاريخ الإنشاء: {formatDateEnCA(selectedTask.createdAt)}</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">آخر تحديث: {formatDateEnCA(selectedTask.updatedAt)}</p>
            </section>

            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              يمكنك تعديل المهمة إذا كانت مسندة لك أو كنت مديراً للمشروع أو مالك المشروع.
            </p>
          </div>
        )}

        {taskUpdateError ? <p className="mt-3 text-sm text-red-600">{taskUpdateError}</p> : null}
      </article>
    </div>
  )
}