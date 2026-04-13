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

  const completedTasksCount = useMemo(
    () => projectTasks.filter((task) => task.status === 'completed').length,
    [projectTasks],
  )
  const memberOptions = useMemo(() => projectMembers, [projectMembers])
  const memberCount = projectMembers.length
  const openTasksCount = useMemo(() => projectTasks.filter((task) => task.status === 'open').length, [projectTasks])
  const inProgressTasksCount = useMemo(
    () => projectTasks.filter((task) => task.status === 'in_progress').length,
    [projectTasks],
  )
  const completedRatio = projectTasks.length > 0 ? Math.round((completedTasksCount / projectTasks.length) * 100) : 0
  const boardColumns = useMemo(
    () => [
      { key: 'open', label: 'مفتوحة', items: projectTasks.filter((task) => task.status === 'open') },
      { key: 'in_progress', label: 'قيد التنفيذ', items: projectTasks.filter((task) => task.status === 'in_progress') },
      { key: 'completed', label: 'مكتملة', items: projectTasks.filter((task) => task.status === 'completed') },
    ],
    [projectTasks],
  )

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

    if (!projectID) {
      return
    }

    if (!user) {
      setTaskError('يجب تسجيل الدخول لإضافة مهمة.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? 'open').trim()
    const status =
      statusRaw === 'in_progress' || statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'open'
    const dueDateRaw = String(formData.get('dueDate') ?? '').trim()
    const pointsRaw = Number(formData.get('points') ?? 0)
    const assignedTo = String(formData.get('assignedTo') ?? '').trim()

    if (!name) {
      setTaskError('يرجى إدخال اسم المهمة.')
      return
    }

    if (Number.isNaN(pointsRaw) || pointsRaw < 0) {
      setTaskError('يرجى إدخال قيمة صحيحة للنقاط.')
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
        points: Math.trunc(pointsRaw),
        assignedTo: assignedTo || undefined,
      })

      setProjectTasks((previous) => [payload.task, ...previous])
      event.currentTarget.reset()
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

    if (!projectID) {
      return
    }

    const formData = new FormData(event.currentTarget)
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

      event.currentTarget.reset()
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
    <section className="space-y-6">
      <header className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-cyan-950 px-5 py-6 text-white sm:px-7 sm:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
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
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{project.name}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  {project.description ?? 'لا يوجد وصف للمشروع حالياً.'}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[23rem] lg:grid-cols-1">
              <Link
                to="/dashboard/projects"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                العودة للمشاريع
              </Link>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-cyan-100/80">المسؤول</p>
                <p className="mt-1 text-sm font-semibold text-white">{project.owner}</p>
                <p className="mt-1 text-xs text-slate-200">{project.telegramGroupId ?? 'لا توجد مجموعة تلغرام مرتبطة'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-slate-200/70 bg-white p-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">إجمالي المهام</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{projectTasks.length}</p>
            <p className="mt-1 text-xs text-slate-500">كل المهام المرتبطة بالمشروع</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">قيد التنفيذ</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{inProgressTasksCount}</p>
            <p className="mt-1 text-xs text-slate-500">المهام المتحركة حالياً</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">مكتملة</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{completedTasksCount}</p>
            <p className="mt-1 text-xs text-slate-500">نسبة الإنجاز {completedRatio}%</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">مفتوحة</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{openTasksCount}</p>
            <p className="mt-1 text-xs text-slate-500">جاهزة للتنفيذ</p>
          </article>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">مسار المشروع</p>
                <p className="mt-1 text-sm text-slate-500">عرض سريع لتوقيت الإنشاء والتحديث ونسبة الإنجاز.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                آخر تحديث: {formatDateEnCA(project.updatedAt)}
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <div className="h-2.5 bg-slate-200">
                <div className="h-full rounded-r-full bg-gradient-to-l from-cyan-500 via-sky-500 to-emerald-500" style={{ width: `${completedRatio}%` }} />
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-500">تاريخ الإنشاء</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{formatDateEnCA(project.createdAt)}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-500">آخر تعديل</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{formatDateEnCA(project.updatedAt)}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-500">التقدم</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{completedRatio}%</p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">لوحة المهام</p>
                <p className="mt-1 text-sm text-slate-500">المهام منظّمة حسب الحالة مثل أنظمة إدارة العمل الحقيقية.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {projectTasks.length} بطاقة
              </span>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              {boardColumns.map((column) => (
                <div key={column.key} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{column.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{column.items.length} مهمة</p>
                    </div>
                    <span className={`h-2.5 w-2.5 rounded-full ${priorityTone(column.key)}`} />
                  </div>

                  <div className="mt-4 space-y-3">
                    {column.items.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                        لا توجد مهام هنا بعد.
                      </div>
                    ) : null}

                    {column.items.map((task) => (
                      <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">{task.name}</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                              {task.description ?? 'لا يوجد وصف للمهمة.'}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(task.status)}`}>
                            {taskStatusLabel(task.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <p className="rounded-xl bg-slate-50 px-3 py-2">النقاط: {task.points}</p>
                          <p className="rounded-xl bg-slate-50 px-3 py-2">الموعد: {formatDueDate(task.dueDate)}</p>
                          <p className="rounded-xl bg-slate-50 px-3 py-2 sm:col-span-2">التكليف: {task.assignedTo ?? 'غير مسند'}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">المهام المرتبطة</p>
                <p className="mt-1 text-sm text-slate-500">قائمة مختصرة للبحث السريع.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {projectTasks.length} سجل
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {projectTasks.length === 0 ? <p className="text-sm text-slate-500">لا توجد مهام مرتبطة بهذا المشروع.</p> : null}
              {projectTasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{task.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {task.assignedTo ?? 'غير مسند'} • {formatDueDate(task.dueDate)} • {task.points} نقطة
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(task.status)}`}>
                    {taskStatusLabel(task.status)}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <article className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-slate-950">إعدادات المشروع</p>
            <p className="mt-1 text-sm text-slate-500">تعديل سريع لاسم المشروع وحالته ووصفه.</p>
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

          <article className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-slate-950">إضافة عضو إلى المشروع</p>
            <p className="mt-1 text-sm text-slate-500">أضف العضو قبل إسناد المهام له.</p>
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

            <div className="mt-4 flex flex-wrap gap-2">
              {projectMembers.length === 0 ? <span className="text-sm text-slate-500">لا يوجد أعضاء في هذا المشروع حالياً.</span> : null}
              {projectMembers.map((member) => (
                <span
                  key={`${member.projectId}-${member.membershipNumber}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  {member.displayName} • {member.role}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-slate-950">إضافة مهمة جديدة</p>
            <p className="mt-1 text-sm text-slate-500">أنشئ بطاقة عمل جديدة داخل هذا المشروع.</p>
            <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
              <input
                name="name"
                placeholder="اسم المهمة"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                required
              />
              <textarea
                name="description"
                placeholder="وصف المهمة (اختياري)"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                rows={3}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  name="status"
                  defaultValue="open"
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                >
                  <option value="open">مفتوحة</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتملة</option>
                  <option value="archived">مؤرشفة</option>
                </select>
                <input
                  name="dueDate"
                  type="date"
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="points"
                  type="number"
                  min={0}
                  defaultValue={0}
                  placeholder="النقاط"
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                />
                <select
                  name="assignedTo"
                  defaultValue=""
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                >
                  <option value="">غير مسند</option>
                  {memberOptions.map((member) => (
                    <option key={member.membershipNumber} value={member.membershipNumber}>
                      {member.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreatingTask}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-l from-cyan-600 to-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingTask ? 'جار الإضافة...' : 'إضافة المهمة'}
              </button>
            </form>
            {taskError ? <p className="mt-3 text-sm text-red-600">{taskError}</p> : null}
          </article>

          <article className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-slate-950">أعضاء المشروع</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {projectMembers.length === 0 ? <p className="text-sm text-slate-500">لا يوجد أعضاء في هذا المشروع حالياً.</p> : null}
              {projectMembers.map((member) => (
                <div key={`member-${member.projectId}-${member.membershipNumber}`} className="min-w-[7rem] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <p className="font-semibold text-slate-900">{member.displayName}</p>
                      <p className="mt-1 uppercase tracking-wide text-slate-500">{member.role} • {member.membershipNumber}</p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </section>
  )
}