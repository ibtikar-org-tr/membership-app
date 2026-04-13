import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createProject, fetchProjects } from '../../api/vms'
import type { VmsProject } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { ProjectHierarchyTree } from './ProjectHierarchyTree'

export function DashboardProjectsPage() {
  const [projects, setProjects] = useState<VmsProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const user = useMemo(() => getStoredUser(), [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadProjects() {
      try {
        const payload = await fetchProjects(user?.membershipNumber)

        if (!controller.signal.aborted) {
          setProjects(payload.projects)
          setHasError(false)
        }
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      controller.abort()
    }
  }, [])

  const topLevelCount = useMemo(() => projects.filter((project) => !project.parentProjectId).length, [projects])

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)

    if (!user) {
      setCreateError('يجب تسجيل الدخول أولاً.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const parentProjectIdRaw = String(formData.get('parentProjectId') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? 'active').trim()
    const status = statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'active'

    if (!name) {
      setCreateError('يرجى إدخال اسم المشروع.')
      return
    }

    setIsCreating(true)

    try {
      const payload = await createProject({
        name,
        description: description || undefined,
        parentProjectId: parentProjectIdRaw || undefined,
        owner: user.membershipNumber,
        status,
      })

      setProjects((previous) => [payload.project, ...previous])
      event.currentTarget.reset()
    } catch (requestError) {
      if (requestError instanceof Error) {
        setCreateError(requestError.message)
      } else {
        setCreateError('تعذر إنشاء المشروع.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">المشاريع</h2>
          <p className="mt-1 text-sm text-slate-500">عرض مختصر للمشاريع الحالية من قاعدة البيانات.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {projects.length - topLevelCount} مشاريع فرعية
        </span>
      </div>

      <form onSubmit={handleCreateProject} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-5">
        <input
          name="name"
          placeholder="اسم المشروع"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          required
        />
        <input
          name="description"
          placeholder="وصف مختصر"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
        />
        <select
          name="parentProjectId"
          defaultValue=""
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
        >
          <option value="">بدون مشروع أب (مشروع رئيسي)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue="active"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
        >
          <option value="active">نشط</option>
          <option value="completed">مكتمل</option>
          <option value="archived">مؤرشف</option>
        </select>
        <button
          type="submit"
          disabled={isCreating}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {isCreating ? 'جار الإضافة...' : 'إضافة مشروع'}
        </button>
      </form>

      {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}

      <div className="mt-5 space-y-3">
        {isLoading ? <p className="text-sm text-slate-500">جار تحميل المشاريع...</p> : null}
        {!isLoading && hasError ? <p className="text-sm text-red-600">تعذر تحميل المشاريع.</p> : null}
        {!isLoading && !hasError && projects.length === 0 ? <p className="text-sm text-slate-500">لا توجد مشاريع حالياً.</p> : null}

        {!isLoading &&
          !hasError &&
          projects.map((project) => {
            return (
          <article key={project.id} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                <p className="mt-1 text-xs text-slate-600">{project.owner}</p>
                {project.parentProjectId ? <p className="mt-1 text-xs text-slate-500">مشروع فرعي</p> : null}
              </div>
              <Link
                to={`/dashboard/projects/${project.id}`}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                عرض المشروع
              </Link>
            </div>
          </article>
            )
          })}
      </div>

      <div className="mt-6">
        <ProjectHierarchyTree />
      </div>
    </section>
  )
}