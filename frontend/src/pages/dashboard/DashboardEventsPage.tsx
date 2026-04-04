const EVENTS = [
  { title: 'ورشة React للمبتدئين', date: '10 نيسان 2026', time: '18:00', location: 'أونلاين' },
  { title: 'جلسة عرض المشاريع', date: '15 نيسان 2026', time: '19:30', location: 'مركز إبتكار' },
  { title: 'لقاء مجتمع البيانات', date: '21 نيسان 2026', time: '17:00', location: 'أونلاين' },
  { title: 'فعالية بناء الفرق', date: '28 نيسان 2026', time: '16:00', location: 'قاعة الشباب' },
]

export function DashboardEventsPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">الفعاليات</h2>
          <p className="mt-1 text-sm text-slate-500">جدول الفعاليات القادمة داخل المجتمع.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          هذا الشهر
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {EVENTS.map((eventItem) => (
          <article key={eventItem.title} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{eventItem.title}</p>
            <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
              <p>التاريخ: {eventItem.date}</p>
              <p>الوقت: {eventItem.time}</p>
              <p>المكان: {eventItem.location}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}