import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { fetchProjectById, fetchTasks } from '../../api/vms'
import type { VmsProject, VmsTask } from '../../types/vms'

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
  const [project, setProject] = useState<VmsProject | null>(null)
  const [projectTasks, setProjectTasks] = useState<VmsTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!projectID) {
      return
    }

    const currentProjectId = projectID

    const controller = new AbortController()

    async function loadProjectData() {
      try {
        const [projectPayload, tasksPayload] = await Promise.all([fetchProjectById(currentProjectId), fetchTasks()])

        if (controller.signal.aborted) {
          return
        }

        setProject(projectPayload.project)
        setProjectTasks(tasksPayload.tasks.filter((task) => task.projectId === currentProjectId))
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
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">تاريخ الإنشاء: {new Date(project.createdAt).toLocaleDateString('ar-EG')}</p>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">آخر تحديث: {new Date(project.updatedAt).toLocaleDateString('ar-EG')}</p>
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