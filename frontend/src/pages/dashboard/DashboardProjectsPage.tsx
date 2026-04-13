import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { fetchProjects } from '../../api/vms'
import type { VmsProject } from '../../types/vms'

function statusLabel(status: string) {
  if (status === 'active') {
    return 'نشط'
  }

  if (status === 'completed') {
    return 'مكتمل'
  }

  if (status === 'archived') {
    return 'مؤرشف'
  }

  return status
}

function statusProgress(status: string) {
  if (status === 'completed') {
    return 100
  }

  if (status === 'archived') {
    return 25
  }

  return 60
}

export function DashboardProjectsPage() {
  const [projects, setProjects] = useState<VmsProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProjects() {
      try {
        const payload = await fetchProjects()

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

  const activeCount = useMemo(() => projects.filter((project) => project.status === 'active').length, [projects])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">المشاريع</h2>
          <p className="mt-1 text-sm text-slate-500">عرض مختصر للمشاريع الحالية من قاعدة البيانات.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {activeCount} مشاريع نشطة
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? <p className="text-sm text-slate-500">جار تحميل المشاريع...</p> : null}
        {!isLoading && hasError ? <p className="text-sm text-red-600">تعذر تحميل المشاريع.</p> : null}
        {!isLoading && !hasError && projects.length === 0 ? <p className="text-sm text-slate-500">لا توجد مشاريع حالياً.</p> : null}

        {!isLoading &&
          !hasError &&
          projects.map((project) => {
            const progress = statusProgress(project.status)

            return (
          <article key={project.id} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                <p className="mt-1 text-xs text-slate-600">{project.owner} • الحالة {statusLabel(project.status)}</p>
              </div>
              <Link
                to={`/dashboard/projects/${project.id}`}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                عرض المشروع
              </Link>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600">تقدير الإنجاز: {progress}%</p>
          </article>
            )
          })}
      </div>
    </section>
  )
}