import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createProjectMember, createTask, fetchProjectById, fetchProjectMembers, fetchTasks, updateProject } from '../../api/vms'
import type { VmsProject, VmsProjectMember, VmsTask } from '../../types/vms'
import { formatDateEnCA } from '../../utils/date-format'
import { getStoredUser } from '../../utils/auth'

function statusLabel(status: string) {
  if (status === 'completed') {
    return 'مكتمل'
  }

  if (status === 'active') {
    return 'نشط'
  }

  if (status === 'archived') {
    return 'مؤرشف'
  }

  return status
}

function taskStatusLabel(status: string) {
  if (status === 'completed') {
    return 'مكتملة'
  }

  if (status === 'in_progress') {
    return 'قيد التنفيذ'
  }

  if (status === 'open') {
    return 'مفتوحة'
  }

  if (status === 'archived') {
    return 'مؤرشفة'
  }

  return status
}

function statusBadgeClass(status: string) {
  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'in_progress') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (status === 'archived') {
    return 'border-slate-200 bg-slate-100 text-slate-600'
  }

  return 'border-cyan-200 bg-cyan-50 text-cyan-700'
}

function priorityTone(status: string) {
  if (status === 'completed') {
    return 'bg-emerald-500'
  }

  if (status === 'in_progress') {
    return 'bg-amber-500'
  }

  if (status === 'archived') {
    return 'bg-slate-400'
  }

  return 'bg-cyan-500'
}

function laneStyle(status: string) {
  if (status === 'completed') {
    return {
      lane: 'border-emerald-200/80 bg-emerald-50/70',
      head: 'from-emerald-100 to-emerald-50 text-emerald-900',
    }
  }

  if (status === 'in_progress') {
    return {
      lane: 'border-amber-200/80 bg-amber-50/70',
      head: 'from-amber-100 to-amber-50 text-amber-900',
    }
  }

  if (status === 'archived') {
    return {
      lane: 'border-slate-300/80 bg-slate-100/80',
      head: 'from-slate-200 to-slate-100 text-slate-700',
    }
  }

  return {
    lane: 'border-cyan-200/80 bg-cyan-50/70',
    head: 'from-cyan-100 to-cyan-50 text-cyan-900',
  }
}

function memberInitials(displayName: string, membershipNumber: string) {
  const value = displayName.trim()
  if (!value) {
    return membershipNumber.slice(-2).toUpperCase()
  }

  const segments = value.split(/\s+/).filter(Boolean)
  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase()
  }

  return `${segments[0][0] ?? ''}${segments[1][0] ?? ''}`.toUpperCase()
}

function memberAvatarTone(membershipNumber: string) {
  const tones = [
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-rose-100 text-rose-800 border-rose-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
  ]

  const code = membershipNumber
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return tones[code % tones.length]
}

function formatDueDate(value: string | null) {
  if (!value) {
    return 'بدون موعد'
  }

  return formatDateEnCA(value)
}

export function DashboardProjectDetailsPage() {
  const { projectID } = useParams()
  const user = getStoredUser()
  const [project, setProject] = useState<VmsProject | null>(null)
  const [projectTasks, setProjectTasks] = useState<VmsTask[]>([])
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)

  useEffect(() => {
    if (!projectID) {
      return
    }

    const currentProjectId = projectID

    const controller = new AbortController()

    async function loadProjectData() {
      try {
        const [projectPayload, tasksPayload, membersPayload] = await Promise.all([
          fetchProjectById(currentProjectId),
          fetchTasks(),
          fetchProjectMembers(currentProjectId),
        ])

        if (controller.signal.aborted) {
          return
        }

        setProject(projectPayload.project)
        setProjectTasks(tasksPayload.tasks.filter((task) => task.projectId === currentProjectId))
        setProjectMembers(membersPayload.projectMembers)
      } catch {
        if (!controller.signal.aborted) {
          setNotFound(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProjectData()

    return () => {
      controller.abort()
    }
  }, [projectID])

  const memberOptions = useMemo(() => projectMembers, [projectMembers])
  const memberNameByMembership = useMemo(
    () => new Map(projectMembers.map((member) => [member.membershipNumber, member.displayName])),
    [projectMembers],
  )
  const memberCount = projectMembers.length
  const boardColumns = useMemo(
    () => [
      { key: 'open', label: 'مفتوحة', items: projectTasks.filter((task) => task.status === 'open') },
      { key: 'in_progress', label: 'قيد التنفيذ', items: projectTasks.filter((task) => task.status === 'in_progress') },
      { key: 'completed', label: 'مكتملة', items: projectTasks.filter((task) => task.status === 'completed') },
      { key: 'archived', label: 'مؤرشفة', items: projectTasks.filter((task) => task.status === 'archived') },
    ],
    [projectTasks],
  )
  const selectedTask = useMemo(
    () => (selectedTaskId ? projectTasks.find((task) => task.id === selectedTaskId) ?? null : null),
    [projectTasks, selectedTaskId],
  )
  const previewMembers = useMemo(() => projectMembers.slice(0, 4), [projectMembers])
  const hiddenMembersCount = Math.max(0, projectMembers.length - previewMembers.length)

  const formatAssignee = (membershipNumber: string | null) => {
    if (!membershipNumber) {
      return 'غير مسند'
    }

    return memberNameByMembership.get(membershipNumber) ?? membershipNumber
  }

  const handleUpdateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError(null)

    if (!projectID || !project) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? project.status).trim()
    const status = statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'active'

    if (!name) {
      setSaveError('يرجى إدخال اسم المشروع.')
      return
    }

    setIsSaving(true)

    try {
      const payload = await updateProject(projectID, {
        name,
        description,
        status,
      })
      setProject(payload.project)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSaveError(requestError.message)
      } else {
        setSaveError('تعذر تحديث المشروع.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTaskError(null)
    const form = event.currentTarget

    if (!projectID) {
      return
    }

    if (!user) {
      setTaskError('يجب تسجيل الدخول لإضافة مهمة.')
      return
    }

    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? 'open').trim()
    const status =
      statusRaw === 'in_progress' || statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'open'
    const dueDateRaw = String(formData.get('dueDate') ?? '').trim()
    const pointsRawValue = String(formData.get('points') ?? '').trim()
    const pointsRaw = pointsRawValue === '' ? 1 : Number(pointsRawValue)
    const assignedTo = String(formData.get('assignedTo') ?? '').trim()

    if (!name) {
      setTaskError('يرجى إدخال اسم المهمة.')
      return
    }

    if (Number.isNaN(pointsRaw) || pointsRaw < 1) {
      setTaskError('يجب أن تكون النقاط 1 على الأقل.')
      return
    }

    setIsCreatingTask(true)

    try {
      const payload = await createTask({
        projectId: projectID,
        name,
        description: description || undefined,
        createdBy: user.membershipNumber,
        status,
        dueDate: dueDateRaw ? new Date(dueDateRaw).toISOString() : undefined,
        points: Math.max(1, Math.trunc(pointsRaw)),
        assignedTo: assignedTo || undefined,
      })

      setProjectTasks((previous) => [payload.task, ...previous])
      form.reset()
    } catch (requestError) {
      if (requestError instanceof Error) {
        setTaskError(requestError.message)
      } else {
        setTaskError('تعذر إنشاء المهمة.')
      }
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMemberError(null)
    const form = event.currentTarget

    if (!projectID) {
      return
    }

    const formData = new FormData(form)
    const membershipNumber = String(formData.get('membershipNumber') ?? '').trim()
    const roleRaw = String(formData.get('role') ?? 'member').trim()
    const role = roleRaw === 'manager' || roleRaw === 'observer' ? roleRaw : 'member'

    if (!membershipNumber) {
      setMemberError('يرجى إدخال رقم العضوية.')
      return
    }

    if (projectMembers.some((member) => member.membershipNumber === membershipNumber)) {
      setMemberError('هذا العضو مضاف بالفعل إلى المشروع.')
      return
    }

    setIsAddingMember(true)

    try {
      const payload = await createProjectMember({
        projectId: projectID,
        membershipNumber,
        role,
      })

      if (payload.projectMember) {
        setProjectMembers((previous) => [payload.projectMember, ...previous])
      }

      form.reset()
    } catch (requestError) {
      if (requestError instanceof Error) {
        setMemberError(requestError.message)
      } else {
        setMemberError('تعذر إضافة العضو.')
      }
    } finally {
      setIsAddingMember(false)
    }
  }

  if (!projectID || notFound) {
    return <Navigate to="/dashboard/projects" replace />
  }

  if (isLoading || !project) {
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل تفاصيل المشروع...</p>
      </section>
    )
  }

  return (
    <section className="w-full space-y-3">
      <header className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-cyan-950 px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(project.status)}`}>
                  {statusLabel(project.status)}
                </span>
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  {project.parentProjectId ? `مشروع فرعي • ${project.parentProjectId}` : 'مشروع رئيسي'}
                </span>
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  {memberCount} عضو
                </span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-100/80">لوحة المشروع</p>
                <h2 className="mt-1.5 text-xl font-semibold text-white sm:text-2xl">{project.name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-200">
                  {project.description ?? 'لا يوجد وصف للمشروع حالياً.'}
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:w-[20rem] lg:grid-cols-1">
              <Link
                to="/dashboard/projects"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                العودة للمشاريع
              </Link>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                <p className="text-xs text-cyan-100/80">المسؤول</p>
                <p className="mt-1 text-sm font-semibold text-white">{project.owner}</p>
                <p className="mt-1 text-xs text-slate-200">{project.telegramGroupId ?? 'لا توجد مجموعة تلغرام مرتبطة'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-slate-200/70 bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_55%,_#e2e8f0)] p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/85 p-2 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsAddTaskOpen(true)}
              className="inline-flex items-center rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              + إضافة مهمة
            </button>
            <button
              type="button"
              onClick={() => setIsProjectSettingsOpen(true)}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              إعدادات المشروع
            </button>
            <button
              type="button"
              onClick={() => setIsMembersOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              title="عرض أعضاء المشروع"
            >
              <div className="flex -space-x-2">
                {previewMembers.map((member) => (
                  <span
                    key={`member-preview-${member.projectId}-${member.membershipNumber}`}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold shadow-sm ${memberAvatarTone(member.membershipNumber)}`}
                  >
                    {memberInitials(member.displayName, member.membershipNumber)}
                  </span>
                ))}
                {hiddenMembersCount > 0 ? (
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-700 shadow-sm">
                    (+{hiddenMembersCount})
                  </span>
                ) : null}
                {projectMembers.length === 0 ? (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[11px] font-semibold text-slate-600 shadow-sm">
                    0
                  </span>
                ) : null}
              </div>
              <span className="hidden sm:inline">الأعضاء</span>
            </button>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
            آخر تحديث: {formatDateEnCA(project.updatedAt)}
          </span>
        </div>

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

                {column.items.map((task) => (
                  <article
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTaskId(task.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedTaskId(task.id)
                      }
                    }}
                    className="group cursor-pointer rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{task.name}</p>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                          {task.description ?? 'لا يوجد وصف للمهمة.'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(task.status)}`}>
                        {taskStatusLabel(task.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <p className="rounded-lg bg-slate-50 px-2.5 py-1.5">النقاط: {task.points}</p>
                      <p className="rounded-lg bg-slate-50 px-2.5 py-1.5">الموعد: {formatDueDate(task.dueDate)}</p>
                      <p className="rounded-lg bg-slate-50 px-2.5 py-1.5 sm:col-span-2">التكليف: {formatAssignee(task.assignedTo)}</p>
                    </div>

                    <div className="mt-2 flex items-center justify-end">
                      <span className={`h-2 w-2 rounded-full transition ${priorityTone(task.status)} group-hover:scale-110`} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )})}
        </div>
      </div>

      {selectedTask ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setSelectedTaskId(null)}>
          <article className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-slate-950">تفاصيل المهمة</p>
              <button type="button" onClick={() => setSelectedTaskId(null)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
            </div>

            <div className="mt-4 space-y-4">
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
            </div>
          </article>
        </div>
      ) : null}

      {isProjectSettingsOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setIsProjectSettingsOpen(false)}>
          <article className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-950">إعدادات المشروع</p>
              <button type="button" onClick={() => setIsProjectSettingsOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
            </div>
            <form onSubmit={handleUpdateProject} className="mt-4 space-y-3">
              <input
                name="name"
                defaultValue={project.name}
                placeholder="اسم المشروع"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                required
              />
              <select
                name="status"
                defaultValue={project.status}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
              >
                <option value="active">نشط</option>
                <option value="completed">مكتمل</option>
                <option value="archived">مؤرشف</option>
              </select>
              <textarea
                name="description"
                defaultValue={project.description ?? ''}
                placeholder="وصف المشروع"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                rows={4}
              />
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
      ) : null}

      {isAddTaskOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setIsAddTaskOpen(false)}>
          <article className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-950">إضافة مهمة جديدة</p>
              <button type="button" onClick={() => setIsAddTaskOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <input
                  name="name"
                  placeholder="عنوان المهمة"
                  className="xl:col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                  required
                />
                <select
                  name="assignedTo"
                  defaultValue=""
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                >
                  <option value="">غير مسند</option>
                  {memberOptions.map((member) => (
                    <option key={member.membershipNumber} value={member.membershipNumber}>
                      {member.displayName}
                    </option>
                  ))}
                </select>
                <select
                  name="status"
                  defaultValue="open"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                >
                  <option value="open">مفتوحة</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتملة</option>
                  <option value="archived">مؤرشفة</option>
                </select>
                <input
                  name="dueDate"
                  type="date"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                />
                <input
                  name="points"
                  type="number"
                  min={1}
                  defaultValue={1}
                  placeholder="نقاط"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <textarea
                  name="description"
                  placeholder="تفاصيل المهمة (اختياري)"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600"
                  rows={2}
                />
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
      ) : null}

      {isAddMemberOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setIsAddMemberOpen(false)}>
          <article className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-950">إضافة عضو إلى المشروع</p>
              <button type="button" onClick={() => setIsAddMemberOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
            </div>
            <form onSubmit={handleAddMember} className="mt-4 space-y-3">
              <input
                name="membershipNumber"
                list="project-member-assignee-options"
                placeholder="رقم العضوية"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                required
              />
              <datalist id="project-member-assignee-options">
                {memberOptions.map((member) => (
                  <option key={member.membershipNumber} value={member.membershipNumber} label={member.displayName} />
                ))}
              </datalist>
              <select
                name="role"
                defaultValue="member"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
              >
                <option value="member">عضو</option>
                <option value="manager">مدير</option>
                <option value="observer">مراقب</option>
              </select>
              <button
                type="submit"
                disabled={isAddingMember}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isAddingMember ? 'جار الإضافة...' : 'إضافة العضو'}
              </button>
            </form>
            {memberError ? <p className="mt-3 text-sm text-red-600">{memberError}</p> : null}
          </article>
        </div>
      ) : null}

      {isMembersOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setIsMembersOpen(false)}>
          <article className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-950">أعضاء المشروع</p>
              <button type="button" onClick={() => setIsMembersOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">إغلاق</button>
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setIsMembersOpen(false)
                  setIsAddMemberOpen(true)
                }}
                className="inline-flex items-center rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                + إضافة عضو
              </button>
            </div>
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
      ) : null}
    </section>
  )
}