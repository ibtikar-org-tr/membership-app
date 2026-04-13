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
  const memberOptions = useMemo(() => projectMembers.map((member) => member.membershipNumber), [projectMembers])

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
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل تفاصيل المشروع...</p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <header className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">تفاصيل المشروع</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{project.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{project.description}</p>
          </div>
          <Link
            to="/dashboard/projects"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            العودة للمشاريع
          </Link>
        </div>
      </header>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">تعديل المشروع</p>
        <form onSubmit={handleUpdateProject} className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            name="name"
            defaultValue={project.name}
            placeholder="اسم المشروع"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            required
          />
          <select
            name="status"
            defaultValue={project.status}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          >
            <option value="active">نشط</option>
            <option value="completed">مكتمل</option>
            <option value="archived">مؤرشف</option>
          </select>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isSaving ? 'جار الحفظ...' : 'حفظ التعديلات'}
          </button>
          <textarea
            name="description"
            defaultValue={project.description ?? ''}
            placeholder="وصف المشروع"
            className="md:col-span-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            rows={2}
          />
        </form>
        {saveError ? <p className="mt-2 text-sm text-red-600">{saveError}</p> : null}
      </article>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">الفريق المسؤول</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{project.owner}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">حالة المشروع</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{statusLabel(project.status)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">عدد المهام المرتبطة</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{projectTasks.length}</p>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">تقدم المهام</p>
          <p className="text-sm font-semibold text-slate-800">
            {projectTasks.length > 0 ? Math.round((completedTasksCount / projectTasks.length) * 100) : 0}%
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-500"
            style={{ width: `${projectTasks.length > 0 ? Math.round((completedTasksCount / projectTasks.length) * 100) : 0}%` }}
          />
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">تاريخ الإنشاء: {formatDateEnCA(project.createdAt)}</p>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">آخر تحديث: {formatDateEnCA(project.updatedAt)}</p>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">بيانات إضافية</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            {project.parentProjectId ? `المشروع الأب: ${project.parentProjectId}` : 'لا يوجد مشروع أب'}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            {project.telegramGroupId ? `مجموعة تلغرام: ${project.telegramGroupId}` : 'لا توجد مجموعة تلغرام'}
          </span>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">إضافة عضو إلى المشروع</p>
        <form onSubmit={handleAddMember} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-4">
          <input
            name="membershipNumber"
            list="project-member-assignee-options"
            placeholder="رقم العضوية"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            required
          />
          <datalist id="project-member-assignee-options">
            {memberOptions.map((membershipNumber) => (
              <option key={membershipNumber} value={membershipNumber} />
            ))}
          </datalist>
          <select
            name="role"
            defaultValue="member"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          >
            <option value="member">عضو</option>
            <option value="manager">مدير</option>
            <option value="observer">مراقب</option>
          </select>
          <button
            type="submit"
            disabled={isAddingMember}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isAddingMember ? 'جار الإضافة...' : 'إضافة العضو'}
          </button>
        </form>
        {memberError ? <p className="mt-2 text-sm text-red-600">{memberError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {projectMembers.length === 0 ? <span className="text-sm text-slate-500">لا يوجد أعضاء في هذا المشروع حالياً.</span> : null}
          {projectMembers.map((member) => (
            <span key={`${member.projectId}-${member.membershipNumber}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {member.membershipNumber} • {member.role}
            </span>
          ))}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">إضافة مهمة جديدة</p>
        <form onSubmit={handleCreateTask} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-5">
          <input
            name="name"
            placeholder="اسم المهمة"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            required
          />
          <select
            name="status"
            defaultValue="open"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          >
            <option value="open">مفتوحة</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتملة</option>
            <option value="archived">مؤرشفة</option>
          </select>
          <input
            name="dueDate"
            type="date"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          />
          <input
            name="points"
            type="number"
            min={0}
            defaultValue={0}
            placeholder="النقاط"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          />
          <button
            type="submit"
            disabled={isCreatingTask}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isCreatingTask ? 'جار الإضافة...' : 'إضافة المهمة'}
          </button>
          <input
            name="assignedTo"
            list="project-task-assignee-options"
            placeholder="رقم العضوية للمكلّف (اختياري)"
            className="md:col-span-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          />
          <datalist id="project-task-assignee-options">
            {memberOptions.map((membershipNumber) => (
              <option key={membershipNumber} value={membershipNumber} />
            ))}
          </datalist>
          <input
            name="description"
            placeholder="وصف المهمة (اختياري)"
            className="md:col-span-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          />
        </form>
        {taskError ? <p className="mt-2 text-sm text-red-600">{taskError}</p> : null}
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">المهام المرتبطة</p>
        <div className="mt-4 space-y-2">
          {projectTasks.length === 0 ? <p className="text-sm text-slate-500">لا توجد مهام مرتبطة بهذا المشروع.</p> : null}
          {projectTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-700">{task.name}</span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                {taskStatusLabel(task.status)}
              </span>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}