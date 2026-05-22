import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { VmsEvent, VmsProject, VmsProjectMember } from '../../../types/vms'
import { formatDateTimeEnCA } from '../../../utils/date-format'
import { projectMemberRoleLabel } from './helpers'
import { SkillsField } from '../../SkillsField'

function eventStatusLabel(status: string) {
  if (status === 'draft') return 'مسودة'
  if (status === 'public') return 'منشورة'
  if (status === 'archived') return 'مؤرشفة'
  return status
}

function skillsToCsv(skills: Record<string, string> | null | undefined) {
  return Object.keys(skills ?? {}).join(', ')
}

interface ProjectSettingsModalProps {
  project: VmsProject
  isProjectOwner: boolean
  ownershipTransferOptions: VmsProjectMember[]
  isSaving: boolean
  saveError: string | null
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ProjectSettingsModal({
  project,
  isProjectOwner,
  ownershipTransferOptions,
  isSaving,
  saveError,
  onClose,
  onSubmit,
}: ProjectSettingsModalProps) {
  const [skillsValue, setSkillsValue] = useState(() => skillsToCsv(project.skills))

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
            <label className="mb-1 block text-xs font-medium text-slate-600">معرّف مجموعة تلغرام</label>
            <input
              name="telegramGroupId"
              defaultValue={project.telegramGroupId ?? ''}
              placeholder="مثال: -1001234567890"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
            />
            <p className="mt-1 text-xs text-slate-500">اتركه فارغاً إذا لم تكن تريد ربط مجموعة تلغرام بالمشروع.</p>
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
          <SkillsField
            id="project-skills"
            label="المهارات المرتبطة بالمشروع"
            value={skillsValue}
            onChange={setSkillsValue}
            placeholder="ابحث عن مهارة أو أضف مهارة جديدة"
          />
          {isProjectOwner ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-xs font-semibold text-amber-950">نقل ملكية المشروع</p>
              <p className="mt-1 text-xs text-amber-900/80">
                يمكنك تسليم المشروع لعضو مسجّل فيه. لا يمكن لمالك المشروع مغادرته دون نقل الملكية أولاً؛ سيُحفظ لك دور
                &quot;عضو&quot; بعد النقل إن لم تكن مضافًا في قائمة الأعضاء.
              </p>
              {ownershipTransferOptions.length > 0 ? (
                <label className="mt-3 block">
                  <span className="mb-1 block text-xs font-medium text-amber-950/90">المالك الجديد (اختياري)</span>
                  <select
                    name="transferOwnerTo"
                    defaultValue=""
                    className="w-full rounded-2xl border border-amber-300/80 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">— بدون تغيير —</option>
                    {ownershipTransferOptions.map((member) => (
                      <option key={member.membershipNumber} value={member.membershipNumber}>
                        {member.displayName} ({member.membershipNumber})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="mt-2 text-xs text-amber-900/75">أضف عضوًا آخر إلى المشروع لتتمكن من نقل الملكية.</p>
              )}
            </div>
          ) : null}
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
  const [skillsValue, setSkillsValue] = useState('')

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-4" onClick={onClose}>
      <article className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200 bg-linear-to-l from-cyan-50 via-white to-emerald-50 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-slate-950">إضافة مهمة جديدة</p>
              <p className="mt-1 text-xs text-slate-600">أضف التفاصيل الأساسية ثم احفظ المهمة لتظهر في لوحة المشروع.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
            >
              إغلاق
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500">البيانات الأساسية</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="xl:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">عنوان المهمة</label>
                <input
                  name="name"
                  placeholder="مثال: تجهيز تقرير الأنشطة الأسبوعي"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">التكليف</label>
                <select
                  name="assignedTo"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
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
                  defaultValue="medium"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">الموعد</label>
                <input
                  name="dueDate"
                  type="date"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">النقاط</label>
                <input
                  name="points"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <label className="mb-1 block text-xs font-medium text-slate-600">تفاصيل المهمة</label>
            <textarea
              name="description"
              placeholder="أضف وصفًا قصيرًا يوضح المطلوب ومعايير الإنجاز."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              rows={3}
            />
          </div>

          <SkillsField
            id="task-skills"
            label="المهارات المرتبطة بالمهمة"
            value={skillsValue}
            onChange={setSkillsValue}
            placeholder="ابحث عن مهارة أو أضف مهارة جديدة"
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isCreatingTask}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isCreatingTask ? 'جار الإضافة...' : 'إضافة المهمة'}
            </button>
          </div>

          {taskError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{taskError}</p>
          ) : null}
        </form>
      </article>
    </div>
  )
}

interface LeaveProjectConfirmModalProps {
  projectName: string
  isLeaving: boolean
  leaveError: string | null
  onClose: () => void
  onConfirm: () => void
}

export function LeaveProjectConfirmModal({
  projectName,
  isLeaving,
  leaveError,
  onClose,
  onConfirm,
}: LeaveProjectConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-base font-semibold text-slate-950">مغادرة المشروع</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          هل أنت متأكد من مغادرة المشروع «{projectName}»؟ لن تتمكن من الوصول إلى مهامه وفعالياته وأنديته حتى تنضم
          إليه مجدداً.
        </p>
        {leaveError ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{leaveError}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLeaving}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLeaving}
            className="rounded-xl border border-red-200 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
          >
            {isLeaving ? 'جار المغادرة...' : 'نعم، مغادرة المشروع'}
          </button>
        </div>
      </article>
    </div>
  )
}

interface RemoveProjectMemberConfirmModalProps {
  memberDisplayName: string
  membershipNumber: string
  isRemoving: boolean
  removeError: string | null
  onClose: () => void
  onConfirm: () => void
}

export function RemoveProjectMemberConfirmModal({
  memberDisplayName,
  membershipNumber,
  isRemoving,
  removeError,
  onClose,
  onConfirm,
}: RemoveProjectMemberConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-base font-semibold text-slate-950">إزالة عضو من المشروع</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          هل أنت متأكد من إزالة «{memberDisplayName}» ({membershipNumber}) من المشروع؟ لن يتمكن من الوصول إلى مهامه
          وفعالياته حتى ينضم مجدداً.
        </p>
        {removeError ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{removeError}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isRemoving}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRemoving}
            className="rounded-xl border border-red-200 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
          >
            {isRemoving ? 'جار الإزالة...' : 'نعم، إزالة العضو'}
          </button>
        </div>
      </article>
    </div>
  )
}

interface MembersModalProps {
  projectMembers: VmsProjectMember[]
  projectOwnerMembershipNumber: string
  actorMembershipNumber: string | null
  canManageMembers: boolean
  removingMembershipNumber: string | null
  onSelectMember: (member: VmsProjectMember) => void
  onRequestRemove: (member: VmsProjectMember) => void
  onClose: () => void
}

export function MembersModal({
  projectMembers,
  projectOwnerMembershipNumber,
  actorMembershipNumber,
  canManageMembers,
  removingMembershipNumber,
  onSelectMember,
  onRequestRemove,
  onClose,
}: MembersModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <article className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-950">أعضاء المشروع</p>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
        </div>

        <div className="mt-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {projectMembers.length === 0 ? <p className="text-sm text-slate-500">لا يوجد أعضاء في هذا المشروع حالياً.</p> : null}
            {projectMembers.map((member) => {
              const isOwner = member.membershipNumber === projectOwnerMembershipNumber
              const isSelf = member.membershipNumber === actorMembershipNumber
              const canRemove =
                canManageMembers && !isOwner && !isSelf && removingMembershipNumber !== member.membershipNumber

              return (
                <div
                  key={`member-${member.projectId}-${member.membershipNumber}`}
                  className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => onSelectMember(member)}
                    className="min-w-0 flex-1 rounded-2xl px-4 py-3 text-right transition hover:bg-slate-100/80"
                    title="عرض معلومات العضو"
                  >
                    <p className="font-semibold text-slate-900">{member.displayName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {projectMemberRoleLabel(member.role)} • {member.membershipNumber}
                      {isOwner ? ' • مالك المشروع' : null}
                    </p>
                  </button>
                  {canRemove ? (
                    <button
                      type="button"
                      onClick={() => onRequestRemove(member)}
                      className="m-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      إزالة
                    </button>
                  ) : removingMembershipNumber === member.membershipNumber ? (
                    <span className="m-2 shrink-0 text-[11px] text-slate-500">جار الإزالة...</span>
                  ) : null}
                </div>
              )
            })}
          </div>
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
