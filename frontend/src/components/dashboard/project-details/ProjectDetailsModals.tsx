import type { FormEvent } from 'react'
import { FiEdit3 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import type { VmsEvent, VmsProject, VmsProjectMember, VmsTask } from '../../../types/vms'
import { formatDateEnCA, formatDateTimeEnCA } from '../../../utils/date-format'
import { formatDueDate, statusBadgeClass, taskStatusLabel } from './helpers'

function eventStatusLabel(status: string) {
  if (status === 'draft') return 'مسودة'
  if (status === 'public') return 'منشورة'
  if (status === 'archived') return 'مؤرشفة'
  return status
}

interface TaskDetailsModalProps {
  selectedTask: VmsTask
  canEditSelectedTask: boolean
  isTaskEditMode: boolean
  isUpdatingTask: boolean
  taskUpdateError: string | null
  memberOptions: VmsProjectMember[]
  formatAssignee: (membershipNumber: string | null) => string
  onClose: () => void
  onToggleEditMode: () => void
  onCancelEdit: () => void
  onUpdateTask: (event: FormEvent<HTMLFormElement>) => void
}

export function TaskDetailsModal({
  selectedTask,
  canEditSelectedTask,
  isTaskEditMode,
  isUpdatingTask,
  taskUpdateError,
  memberOptions,
  formatAssignee,
  onClose,
  onToggleEditMode,
  onCancelEdit,
  onUpdateTask,
}: TaskDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-slate-950">تفاصيل المهمة</p>
          <div className="flex items-center gap-2">
            {canEditSelectedTask ? (
              <button
                type="button"
                onClick={onToggleEditMode}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
                title={isTaskEditMode ? 'إنهاء التعديل' : 'تعديل المهمة'}
              >
                <FiEdit3 className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">
              إغلاق
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {canEditSelectedTask && isTaskEditMode ? (
            <form onSubmit={onUpdateTask} className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">عنوان المهمة</label>
                    <input
                      name="name"
                      defaultValue={selectedTask.name}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">الحالة</label>
                    <select
                      name="status"
                      defaultValue={selectedTask.status}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                    >
                      <option value="open">مفتوحة</option>
                      <option value="in_progress">قيد التنفيذ</option>
                      <option value="completed">مكتملة</option>
                      <option value="archived">مؤرشفة</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">النقاط</label>
                    <input
                      name="points"
                      type="number"
                      min={1}
                      defaultValue={selectedTask.points}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">الموعد</label>
                    <input
                      name="dueDate"
                      type="date"
                      defaultValue={selectedTask.dueDate ? formatDateEnCA(selectedTask.dueDate) : ''}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">التكليف</label>
                    <select
                      name="assignedTo"
                      defaultValue={selectedTask.assignedTo ?? ''}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                    >
                      <option value="">غير مسند</option>
                      {memberOptions.map((member) => (
                        <option key={`task-edit-member-${member.membershipNumber}`} value={member.membershipNumber}>
                          {member.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">الوصف</label>
                    <textarea
                      name="description"
                      defaultValue={selectedTask.description ?? ''}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p className="rounded-xl border border-slate-200 bg-white px-3 py-2">أنشئت بواسطة: {formatAssignee(selectedTask.createdBy)}</p>
                <p className="rounded-xl border border-slate-200 bg-white px-3 py-2">تاريخ الإنشاء: {formatDateEnCA(selectedTask.createdAt)}</p>
                <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 sm:col-span-2">آخر تحديث: {formatDateEnCA(selectedTask.updatedAt)}</p>
              </div>
              <button
                type="submit"
                disabled={isUpdatingTask}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isUpdatingTask ? 'جار حفظ التعديلات...' : 'حفظ التعديلات'}
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                إلغاء التعديل
              </button>
            </form>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">{selectedTask.name}</p>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(selectedTask.status)}`}>
                    {taskStatusLabel(selectedTask.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{selectedTask.description ?? 'لا يوجد وصف للمهمة.'}</p>
              </div>

              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p className="rounded-xl border border-slate-200 bg-white px-3 py-2">المكلّف: {formatAssignee(selectedTask.assignedTo)}</p>
                <p className="rounded-xl border border-slate-200 bg-white px-3 py-2">النقاط: {selectedTask.points}</p>
                <p className="rounded-xl border border-slate-200 bg-white px-3 py-2">الموعد: {formatDueDate(selectedTask.dueDate)}</p>
                <p className="rounded-xl border border-slate-200 bg-white px-3 py-2">أنشئت بواسطة: {formatAssignee(selectedTask.createdBy)}</p>
                <p className="rounded-xl border border-slate-200 bg-white px-3 py-2">تاريخ الإنشاء: {formatDateEnCA(selectedTask.createdAt)}</p>
                <p className="rounded-xl border border-slate-200 bg-white px-3 py-2">آخر تحديث: {formatDateEnCA(selectedTask.updatedAt)}</p>
              </div>
              {canEditSelectedTask ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  لديك صلاحية تعديل هذه المهمة. اضغط زر القلم لبدء التعديل.
                </p>
              ) : (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  يمكنك تعديل المهمة إذا كانت مسندة لك أو كنت مديراً للمشروع أو مالك المشروع.
                </p>
              )}
            </>
          )}
          {taskUpdateError ? <p className="text-sm text-red-600">{taskUpdateError}</p> : null}
        </div>
      </article>
    </div>
  )
}

interface ProjectSettingsModalProps {
  project: VmsProject
  isSaving: boolean
  saveError: string | null
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ProjectSettingsModal({ project, isSaving, saveError, onClose, onSubmit }: ProjectSettingsModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-950">إعدادات المشروع</p>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
        </div>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">اسم المشروع</label>
            <input
              name="name"
              defaultValue={project.name}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">حالة المشروع</label>
            <select
              name="status"
              defaultValue={project.status}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
            >
              <option value="active">نشط</option>
              <option value="completed">مكتمل</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">وصف المشروع</label>
            <textarea
              name="description"
              defaultValue={project.description ?? ''}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
              rows={4}
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? 'جار الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>
        {saveError ? <p className="mt-3 text-sm text-red-600">{saveError}</p> : null}
      </article>
    </div>
  )
}

interface AddTaskModalProps {
  isCreatingTask: boolean
  taskError: string | null
  memberOptions: VmsProjectMember[]
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AddTaskModal({ isCreatingTask, taskError, memberOptions, onClose, onSubmit }: AddTaskModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-950">إضافة مهمة جديدة</p>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">عنوان المهمة</label>
              <input
                name="name"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">التكليف</label>
              <select
                name="assignedTo"
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
              >
                <option value="">غير مسند</option>
                {memberOptions.map((member) => (
                  <option key={member.membershipNumber} value={member.membershipNumber}>
                    {member.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">الحالة</label>
              <select
                name="status"
                defaultValue="open"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
              >
                <option value="open">مفتوحة</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتملة</option>
                <option value="archived">مؤرشفة</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">الموعد</label>
              <input
                name="dueDate"
                type="date"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">النقاط</label>
              <input
                name="points"
                type="number"
                min={1}
                defaultValue={1}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">تفاصيل المهمة</label>
              <textarea
                name="description"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                rows={2}
              />
            </div>
            <button
              type="submit"
              disabled={isCreatingTask}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isCreatingTask ? 'جار الإضافة...' : 'إضافة المهمة'}
            </button>
          </div>
        </form>
        {taskError ? <p className="mt-3 text-sm text-red-600">{taskError}</p> : null}
      </article>
    </div>
  )
}

interface AddMemberModalProps {
  isAddingMember: boolean
  memberError: string | null
  memberOptions: VmsProjectMember[]
  canManageProjectMembers: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AddMemberModal({
  isAddingMember,
  memberError,
  memberOptions,
  canManageProjectMembers,
  onClose,
  onSubmit,
}: AddMemberModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-950">إضافة عضو إلى المشروع</p>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
        </div>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">رقم العضوية</label>
            <input
              name="membershipNumber"
              list="project-member-assignee-options"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
              required
            />
          </div>
          <datalist id="project-member-assignee-options">
            {memberOptions.map((member) => (
              <option key={member.membershipNumber} value={member.membershipNumber} label={member.displayName} />
            ))}
          </datalist>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">الدور</label>
            <select
              name="role"
              defaultValue="member"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
            >
              <option value="member">عضو</option>
              <option value="manager">مدير</option>
              <option value="observer">مراقب</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isAddingMember || !canManageProjectMembers}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isAddingMember ? 'جار الإضافة...' : 'إضافة العضو'}
          </button>
        </form>
        {!canManageProjectMembers ? <p className="mt-3 text-sm text-amber-700">إضافة الأعضاء متاحة فقط لمالك المشروع أو مديريه.</p> : null}
        {memberError ? <p className="mt-3 text-sm text-red-600">{memberError}</p> : null}
      </article>
    </div>
  )
}

interface MembersModalProps {
  projectMembers: VmsProjectMember[]
  canManageProjectMembers: boolean
  onClose: () => void
  onOpenAddMember: () => void
}

export function MembersModal({ projectMembers, canManageProjectMembers, onClose, onOpenAddMember }: MembersModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-950">أعضاء المشروع</p>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
        </div>
        {canManageProjectMembers ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={onOpenAddMember}
              className="inline-flex items-center rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              + إضافة عضو
            </button>
          </div>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {projectMembers.length === 0 ? <p className="text-sm text-slate-500">لا يوجد أعضاء في هذا المشروع حالياً.</p> : null}
          {projectMembers.map((member) => (
            <div key={`member-${member.projectId}-${member.membershipNumber}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-900">{member.displayName}</p>
              <p className="mt-1 text-xs text-slate-500">{member.role} • {member.membershipNumber}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}

interface ProjectEventsModalProps {
  events: VmsEvent[]
  isLoading: boolean
  hasError: boolean
  canCreateEvents: boolean
  isCreatingEvent: boolean
  createError: string | null
  onClose: () => void
  onCreateEvent: (event: FormEvent<HTMLFormElement>) => void
}

export function ProjectEventsModal({
  events,
  isLoading,
  hasError,
  canCreateEvents,
  isCreatingEvent,
  createError,
  onClose,
  onCreateEvent,
}: ProjectEventsModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-950">فعاليات المشروع</p>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
        </div>

        {canCreateEvents ? (
          <form onSubmit={onCreateEvent} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-5">
            <input
              name="name"
              placeholder="اسم الفعالية"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              required
            />
            <input
              name="startTime"
              type="datetime-local"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
            <input
              name="endTime"
              type="datetime-local"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
            <select
              name="status"
              defaultValue="draft"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            >
              <option value="draft">مسودة</option>
              <option value="public">منشورة</option>
              <option value="archived">مؤرشفة</option>
            </select>
            <button
              type="submit"
              disabled={isCreatingEvent}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isCreatingEvent ? 'جار الإضافة...' : 'إضافة فعالية'}
            </button>
            <textarea
              name="description"
              placeholder="وصف الفعالية"
              className="md:col-span-5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              rows={2}
            />
          </form>
        ) : (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            إنشاء الفعاليات متاح فقط لمالك المشروع ومديري المشروع.
          </p>
        )}

        {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}

        <div className="mt-5 space-y-3">
          {isLoading ? <p className="text-sm text-slate-500">جار تحميل الفعاليات...</p> : null}
          {!isLoading && hasError ? <p className="text-sm text-red-600">تعذر تحميل فعاليات المشروع.</p> : null}
          {!isLoading && !hasError && events.length === 0 ? <p className="text-sm text-slate-500">لا توجد فعاليات مرتبطة بهذا المشروع حالياً.</p> : null}

          {!isLoading &&
            !hasError &&
            events.map((eventItem) => (
              <article key={eventItem.id} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm font-semibold text-slate-900">{eventItem.name}</p>
                  <Link
                    to={`/dashboard/event/${eventItem.id}`}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    عرض الفعالية
                  </Link>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                  <p>البداية: {formatDateTimeEnCA(eventItem.startTime)}</p>
                  <p>النهاية: {formatDateTimeEnCA(eventItem.endTime)}</p>
                  <p>الحالة: {eventStatusLabel(eventItem.status)}</p>
                </div>
              </article>
            ))}
        </div>
      </article>
    </div>
  )
}
