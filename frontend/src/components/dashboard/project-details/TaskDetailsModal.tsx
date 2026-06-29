import { useEffect, useState } from 'react'
import { SkillsField } from '../../SkillsField'
import { formatDateEnCA, formatDateTimeEnCA } from '../../../utils/date-format'
import { formatDueDate, priorityBadgeClass, statusBadgeClass, taskPriorityLabel, taskStatusLabel } from './helpers'
import { TaskSubtasksChecklist } from './TaskSubtasksChecklist'
import type { VmsProjectMember, VmsTask, VmsTaskSubtask } from '../../../types/vms'

type EditableTaskField = 'name' | 'description' | 'status' | 'priority' | 'points' | 'dueDate' | 'assignedTo' | 'skills'

interface TaskUpdatePatch {
  name?: string
  description?: string
  status?: 'open' | 'in_progress' | 'completed' | 'archived'
  priority?: 'low' | 'medium' | 'high'
  points?: number
  dueDate?: string
  assignedTo?: string
  skills?: Record<string, string>
}

interface TaskDetailsModalProps {
  selectedTask: VmsTask
  canEditSelectedTask: boolean
  canRemindTask: boolean
  isUpdatingTask: boolean
  isRemindingTask: boolean
  taskUpdateError: string | null
  taskRemindError: string | null
  taskRemindSuccess: string | null
  memberOptions: VmsProjectMember[]
  formatAssignee: (membershipNumber: string | null) => string
  subtasks: VmsTaskSubtask[]
  isLoadingSubtasks: boolean
  subtaskLoadingPlaceholderCount?: number
  subtaskError: string | null
  onClose: () => void
  onUpdateTask: (patch: TaskUpdatePatch) => Promise<void>
  onRemindTask: () => Promise<void>
  onCreateSubtask: (name: string) => Promise<void>
  onToggleSubtask: (subtaskId: string, completed: boolean) => Promise<void>
  onRenameSubtask: (subtaskId: string, name: string) => Promise<void>
  onDeleteSubtask: (subtaskId: string) => Promise<void>
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

function taskDraftFrom(selectedTask: VmsTask) {
  return {
    name: selectedTask.name,
    description: selectedTask.description ?? '',
    status: normalizeTaskStatus(selectedTask.status),
    priority: normalizeTaskPriority(selectedTask.priority),
    points: String(selectedTask.points),
    dueDate: selectedTask.dueDate ? formatDateEnCA(selectedTask.dueDate) : '',
    assignedTo: selectedTask.assignedTo ?? '',
    skills: Object.keys(selectedTask.skills ?? {}).join(', '),
  }
}

export function TaskDetailsModal({
  selectedTask,
  canEditSelectedTask,
  canRemindTask,
  isUpdatingTask,
  isRemindingTask,
  taskUpdateError,
  taskRemindError,
  taskRemindSuccess,
  memberOptions,
  formatAssignee,
  subtasks,
  isLoadingSubtasks,
  subtaskLoadingPlaceholderCount,
  subtaskError,
  onClose,
  onUpdateTask,
  onRemindTask,
  onCreateSubtask,
  onToggleSubtask,
  onRenameSubtask,
  onDeleteSubtask,
}: TaskDetailsModalProps) {
  const [draft, setDraft] = useState(() => taskDraftFrom(selectedTask))
  const [editingField, setEditingField] = useState<EditableTaskField | null>(null)

  useEffect(() => {
    setDraft(taskDraftFrom(selectedTask))
    setEditingField(null)
  }, [selectedTask])

  async function saveField(field: EditableTaskField, value: string) {
    if (!canEditSelectedTask) {
      return
    }

    const nextPatch: TaskUpdatePatch = {}

    if (field === 'name') {
      const nextName = value.trim()
      if (!nextName) {
        setDraft((current) => ({ ...current, name: selectedTask.name }))
        setEditingField(null)
        return
      }

      if (nextName === selectedTask.name) {
        setEditingField(null)
        return
      }

      nextPatch.name = nextName
      setDraft((current) => ({ ...current, name: nextName }))
    }

    if (field === 'description') {
      const nextDescription = value.trim()
      if (nextDescription === (selectedTask.description ?? '')) {
        setEditingField(null)
        return
      }

      nextPatch.description = nextDescription || undefined
      setDraft((current) => ({ ...current, description: nextDescription }))
    }

    if (field === 'status') {
      const nextStatus = normalizeTaskStatus(value)
      if (nextStatus === selectedTask.status) {
        setEditingField(null)
        return
      }

      nextPatch.status = nextStatus
      setDraft((current) => ({ ...current, status: nextStatus }))
    }

    if (field === 'priority') {
      const nextPriority = normalizeTaskPriority(value)
      if (nextPriority === selectedTask.priority) {
        setEditingField(null)
        return
      }

      nextPatch.priority = nextPriority
      setDraft((current) => ({ ...current, priority: nextPriority }))
    }

    if (field === 'points') {
      const nextPoints = Number(value)
      if (!Number.isFinite(nextPoints) || nextPoints < 1) {
        setDraft((current) => ({ ...current, points: String(selectedTask.points) }))
        setEditingField(null)
        return
      }

      if (nextPoints === selectedTask.points) {
        setEditingField(null)
        return
      }

      nextPatch.points = Math.max(1, Math.trunc(nextPoints))
      setDraft((current) => ({ ...current, points: String(Math.max(1, Math.trunc(nextPoints))) }))
    }

    if (field === 'dueDate') {
      const nextDueDate = value.trim()
      if (!nextDueDate) {
        setDraft((current) => ({ ...current, dueDate: selectedTask.dueDate ? formatDateEnCA(selectedTask.dueDate) : '' }))
        setEditingField(null)
        return
      }

      const nextDueDateIso = new Date(nextDueDate).toISOString()
      if (nextDueDateIso === selectedTask.dueDate) {
        setEditingField(null)
        return
      }

      nextPatch.dueDate = nextDueDateIso
      setDraft((current) => ({ ...current, dueDate: nextDueDate }))
    }

    if (field === 'assignedTo') {
      const nextAssignedTo = value.trim()
      if (!nextAssignedTo) {
        setDraft((current) => ({ ...current, assignedTo: selectedTask.assignedTo ?? '' }))
        setEditingField(null)
        return
      }

      if (nextAssignedTo === (selectedTask.assignedTo ?? '')) {
        setEditingField(null)
        return
      }

      nextPatch.assignedTo = nextAssignedTo
      setDraft((current) => ({ ...current, assignedTo: nextAssignedTo }))
    }

    if (field === 'skills') {
      const nextSkills = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .reduce<Record<string, string>>((accumulator, item) => {
          accumulator[item] = 'required'
          return accumulator
        }, {})

      const currentSkills = Object.keys(selectedTask.skills ?? {}).join(', ')
      const nextSkillsText = Object.keys(nextSkills).join(', ')

      if (nextSkillsText === currentSkills) {
        setEditingField(null)
        return
      }

      nextPatch.skills = nextSkills
      setDraft((current) => ({ ...current, skills: nextSkillsText }))
    }

    if (Object.keys(nextPatch).length === 0) {
      return
    }

    try {
      await onUpdateTask(nextPatch)
      setEditingField(null)
    } catch {
      if (field === 'name') {
        setDraft((current) => ({ ...current, name: selectedTask.name }))
      }

      if (field === 'description') {
        setDraft((current) => ({ ...current, description: selectedTask.description ?? '' }))
      }

      if (field === 'status') {
        setDraft((current) => ({ ...current, status: normalizeTaskStatus(selectedTask.status) }))
      }

      if (field === 'priority') {
        setDraft((current) => ({ ...current, priority: normalizeTaskPriority(selectedTask.priority) }))
      }

      if (field === 'points') {
        setDraft((current) => ({ ...current, points: String(selectedTask.points) }))
      }

      if (field === 'dueDate') {
        setDraft((current) => ({ ...current, dueDate: selectedTask.dueDate ? formatDateEnCA(selectedTask.dueDate) : '' }))
      }

      if (field === 'assignedTo') {
        setDraft((current) => ({ ...current, assignedTo: selectedTask.assignedTo ?? '' }))
      }

      if (field === 'skills') {
        setDraft((current) => ({ ...current, skills: Object.keys(selectedTask.skills ?? {}).join(', ') }))
      }

      setEditingField(null)
    }
  }

  function renderValue(value: string, fallback: string) {
    return value.trim() ? value : fallback
  }

  const fieldButtonClass = (field: EditableTaskField, spanClass = '') =>
    `group w-full rounded-2xl border px-4 py-3 text-right transition ${spanClass} ${
      editingField === field
        ? 'border-cyan-300 bg-white shadow-sm ring-2 ring-cyan-500/15'
        : canEditSelectedTask
          ? 'border-transparent bg-transparent hover:border-cyan-200 hover:bg-cyan-50/60'
          : 'border-transparent bg-transparent'
    }`

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article
        className="flex max-h-[min(90vh,52rem)] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">بطاقة المهمة</p>
            <p className="mt-1 text-base font-semibold text-slate-950">تفاصيل المهمة</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50">
            إغلاق
          </button>
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
          <section className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
            <button
              type="button"
              onClick={() => canEditSelectedTask && setEditingField('name')}
              className={fieldButtonClass('name')}
            >
              <span className="block text-xs font-semibold text-slate-500">عنوان المهمة</span>
              {editingField === 'name' && canEditSelectedTask ? (
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  onBlur={(event) => {
                    void saveField('name', event.currentTarget.value)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void saveField('name', event.currentTarget.value)
                    }
                    if (event.key === 'Escape') {
                      setDraft((current) => ({ ...current, name: selectedTask.name }))
                      setEditingField(null)
                    }
                  }}
                  disabled={isUpdatingTask}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed"
                />
              ) : (
                <span className="mt-2 block text-lg font-semibold text-slate-950 group-hover:text-cyan-700">{draft.name}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => canEditSelectedTask && setEditingField('description')}
              className={fieldButtonClass('description')}
            >
              <span className="block text-xs font-semibold text-slate-500">الوصف</span>
              {editingField === 'description' && canEditSelectedTask ? (
                <textarea
                  autoFocus
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  onBlur={(event) => {
                    void saveField('description', event.currentTarget.value)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setDraft((current) => ({ ...current, description: selectedTask.description ?? '' }))
                      setEditingField(null)
                    }
                    if (event.key === 'Enter' && event.shiftKey) {
                      return
                    }
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void saveField('description', event.currentTarget.value)
                    }
                  }}
                  disabled={isUpdatingTask}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed"
                />
              ) : (
                <span className={`mt-2 block text-sm leading-6 ${draft.description.trim() ? 'text-slate-700' : 'text-slate-500'} group-hover:text-cyan-700`}>
                  {draft.description.trim() || 'لا يوجد وصف للمهمة.'}
                </span>
              )}
            </button>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <SkillsField
                id={`task-skills-${selectedTask.id}`}
                label="المهارات المرتبطة بالمهمة"
                value={draft.skills ?? ''}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, skills: value }))
                  void saveField('skills', value)
                }}
                placeholder="ابحث عن مهارة أو أضف مهارة جديدة"
              />
            </div>

            <TaskSubtasksChecklist
              subtasks={subtasks}
              canEdit={canEditSelectedTask}
              isLoading={isLoadingSubtasks}
              loadingPlaceholderCount={subtaskLoadingPlaceholderCount}
              error={subtaskError}
              onCreateSubtask={onCreateSubtask}
              onToggleSubtask={onToggleSubtask}
              onRenameSubtask={onRenameSubtask}
              onDeleteSubtask={onDeleteSubtask}
            />
          </section>

          <section className="space-y-3">
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => canEditSelectedTask && setEditingField('status')}
              className={fieldButtonClass('status')}
            >
              <span className="block text-xs font-semibold text-slate-500">الحالة</span>
              {editingField === 'status' && canEditSelectedTask ? (
                <select
                  autoFocus
                  value={draft.status}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, status: event.target.value }))
                    void saveField('status', event.target.value)
                  }}
                  onBlur={() => {
                    setEditingField(null)
                  }}
                  disabled={isUpdatingTask}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed"
                >
                  <option value="open">مفتوحة</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتملة</option>
                  <option value="archived">مؤرشفة</option>
                </select>
              ) : (
                <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(draft.status)}`}>
                  {taskStatusLabel(draft.status)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => canEditSelectedTask && setEditingField('priority')}
              className={fieldButtonClass('priority')}
            >
              <span className="block text-xs font-semibold text-slate-500">الأولوية</span>
              {editingField === 'priority' && canEditSelectedTask ? (
                <select
                  autoFocus
                  value={draft.priority}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, priority: event.target.value }))
                    void saveField('priority', event.target.value)
                  }}
                  onBlur={() => {
                    setEditingField(null)
                  }}
                  disabled={isUpdatingTask}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              ) : (
                <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClass(draft.priority)}`}>
                  {taskPriorityLabel(draft.priority)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => canEditSelectedTask && setEditingField('points')}
              className={fieldButtonClass('points')}
            >
              <span className="block text-xs font-semibold text-slate-500">النقاط</span>
              {editingField === 'points' && canEditSelectedTask ? (
                <input
                  autoFocus
                  type="number"
                  min={1}
                  value={draft.points}
                  onChange={(event) => setDraft((current) => ({ ...current, points: event.target.value }))}
                  onBlur={(event) => {
                    void saveField('points', event.currentTarget.value)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void saveField('points', event.currentTarget.value)
                    }
                    if (event.key === 'Escape') {
                      setDraft((current) => ({ ...current, points: String(selectedTask.points) }))
                      setEditingField(null)
                    }
                  }}
                  disabled={isUpdatingTask}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed"
                />
              ) : (
                <span className="mt-2 block text-lg font-semibold text-slate-950 group-hover:text-cyan-700">{draft.points}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => canEditSelectedTask && setEditingField('dueDate')}
              className={fieldButtonClass('dueDate')}
            >
              <span className="block text-xs font-semibold text-slate-500">الموعد</span>
              {editingField === 'dueDate' && canEditSelectedTask ? (
                <input
                  autoFocus
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  onBlur={(event) => {
                    void saveField('dueDate', event.currentTarget.value)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void saveField('dueDate', event.currentTarget.value)
                    }
                    if (event.key === 'Escape') {
                      setDraft((current) => ({ ...current, dueDate: selectedTask.dueDate ? formatDateEnCA(selectedTask.dueDate) : '' }))
                      setEditingField(null)
                    }
                  }}
                  disabled={isUpdatingTask}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed"
                />
              ) : (
                <span className="mt-2 block text-sm font-medium text-slate-700 group-hover:text-cyan-700">{formatDueDate(selectedTask.dueDate)}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => canEditSelectedTask && setEditingField('assignedTo')}
              className={fieldButtonClass('assignedTo', 'sm:col-span-2')}
            >
              <span className="block text-xs font-semibold text-slate-500">التكليف</span>
              {editingField === 'assignedTo' && canEditSelectedTask ? (
                <select
                  autoFocus
                  value={draft.assignedTo}
                  onChange={(event) => {
                    const nextAssignedTo = event.target.value
                    setDraft((current) => ({ ...current, assignedTo: nextAssignedTo }))
                    if (nextAssignedTo) {
                      void saveField('assignedTo', nextAssignedTo)
                    }
                  }}
                  onBlur={(event) => {
                    if (!event.currentTarget.value.trim()) {
                      setDraft((current) => ({ ...current, assignedTo: selectedTask.assignedTo ?? '' }))
                    }

                    setEditingField(null)
                  }}
                  disabled={isUpdatingTask}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed"
                >
                  <option value="">غير مسند</option>
                  {memberOptions.map((member) => (
                    <option key={`task-edit-member-${member.membershipNumber}`} value={member.membershipNumber}>
                      {member.displayName}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="mt-2 block text-sm font-medium text-slate-700 group-hover:text-cyan-700">{renderValue(formatAssignee(selectedTask.assignedTo), 'غير مسند')}</span>
              )}
            </button>
            </div>

            <section className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">أنشئت بواسطة: {formatAssignee(selectedTask.createdBy)}</p>
            <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">تاريخ الإنشاء: {formatDateEnCA(selectedTask.createdAt)}</p>
            <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:col-span-2">آخر تحديث: {formatDateEnCA(selectedTask.updatedAt)}</p>
            <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:col-span-2">
              آخر تذكير: {selectedTask.lastRemindedAt ? formatDateTimeEnCA(selectedTask.lastRemindedAt) : 'لم يُرسل بعد'}
            </p>
            </section>

          {canRemindTask ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void onRemindTask()}
                disabled={isRemindingTask || isUpdatingTask}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRemindingTask ? 'جار إرسال التذكير...' : 'إرسال تذكير عبر تيليجرام'}
              </button>
              {taskRemindSuccess ? <p className="text-sm text-emerald-700">{taskRemindSuccess}</p> : null}
              {taskRemindError ? <p className="text-sm text-red-600">{taskRemindError}</p> : null}
            </div>
          ) : null}

          {canEditSelectedTask ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              اضغط على أي حقل لتعديله. الحفظ يتم تلقائياً عند الخروج من الحقل أو بعد التأكيد.
            </p>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              يمكنك تعديل المهمة إذا كانت مسندة لك أو كنت مديراً للمشروع أو مالك المشروع.
            </p>
          )}

          {taskUpdateError ? <p className="text-sm text-red-600">{taskUpdateError}</p> : null}
          </section>
        </div>
      </article>
    </div>
  )
}