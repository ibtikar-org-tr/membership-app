const PROJECTS = [
  { name: 'بوابة التدريب الداخلية', owner: 'فريق الويب', progress: 72, phase: 'تطوير' },
  { name: 'منصة توجيه الطلاب', owner: 'فريق المنتج', progress: 45, phase: 'تصميم' },
  { name: 'لوحة تحليلات المجتمع', owner: 'فريق البيانات', progress: 61, phase: 'تنفيذ' },
  { name: 'أرشيف الفعاليات', owner: 'فريق المحتوى', progress: 88, phase: 'مراجعة' },
]

export function DashboardProjectsPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">المشاريع</h2>
          <p className="mt-1 text-sm text-slate-500">عرض مختصر للمشاريع الحالية ونسب الإنجاز.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          4 مشاريع نشطة
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {PROJECTS.map((project) => (
          <article key={project.name} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                <p className="mt-1 text-xs text-slate-600">{project.owner} • مرحلة {project.phase}</p>
              </div>
              <span className="text-sm font-semibold text-slate-800">{project.progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-500" style={{ width: `${project.progress}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}