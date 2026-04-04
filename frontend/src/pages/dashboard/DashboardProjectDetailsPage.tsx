import { Link, Navigate, useParams } from 'react-router-dom'
import { MOCK_PROJECTS } from './mockData'

function milestoneStyle(status: 'done' | 'in-progress' | 'todo') {
  if (status === 'done') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'in-progress') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function statusLabel(status: 'done' | 'in-progress' | 'todo') {
  if (status === 'done') {
    return 'مكتمل'
  }

  if (status === 'in-progress') {
    return 'قيد التنفيذ'
  }

  return 'قادم'
}

export function DashboardProjectDetailsPage() {
  const { projectID } = useParams()
  const project = MOCK_PROJECTS.find((item) => item.id === projectID)

  if (!projectID || !project) {
    return <Navigate to="/dashboard/projects" replace />
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
          <p className="text-xs text-slate-500">المرحلة الحالية</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{project.phase}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">حجم الفريق</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{project.teamSize} أعضاء</p>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">نسبة الإنجاز</p>
          <p className="text-sm font-semibold text-slate-800">{project.progress}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-slate-500" style={{ width: `${project.progress}%` }} />
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">تاريخ البداية: {project.startedAt}</p>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">الموعد المتوقع: {project.deadline}</p>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">الوسوم</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {tag}
            </span>
          ))}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">المعالم الرئيسية</p>
        <div className="mt-4 space-y-2">
          {project.milestones.map((milestone) => (
            <div key={milestone.title} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-700">{milestone.title}</span>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${milestoneStyle(milestone.status)}`}>
                {statusLabel(milestone.status)}
              </span>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}