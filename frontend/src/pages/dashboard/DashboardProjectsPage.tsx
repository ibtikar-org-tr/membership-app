import { Link } from 'react-router-dom'
import { MOCK_PROJECTS } from './mockData'

export function DashboardProjectsPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">المشاريع</h2>
          <p className="mt-1 text-sm text-slate-500">عرض مختصر للمشاريع الحالية ونسب الإنجاز.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {MOCK_PROJECTS.length} مشاريع نشطة
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {MOCK_PROJECTS.map((project) => (
          <article key={project.name} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                <p className="mt-1 text-xs text-slate-600">{project.owner} • مرحلة {project.phase}</p>
              </div>
              <Link
                to={`/dashboard/projects/${project.id}`}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                عرض المشروع
              </Link>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-500" style={{ width: `${project.progress}%` }} />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600">نسبة الإنجاز: {project.progress}%</p>
          </article>
        ))}
      </div>
    </section>
  )
}