const COMMUNITY_GROUPS = [
  { name: 'المجموعة العامة', members: 1640, channel: 'Telegram', status: 'نشطة' },
  { name: 'مجتمع الواجهة الأمامية', members: 430, channel: 'Discord', status: 'نشطة' },
  { name: 'مجتمع الذكاء الاصطناعي', members: 290, channel: 'Telegram', status: 'نشطة' },
  { name: 'مجتمع التصميم', members: 180, channel: 'WhatsApp', status: 'متوسطة النشاط' },
]

const COMMUNITY_NOTICES = [
  'فتح باب استقبال المقترحات للجلسة الشهرية القادمة.',
  'تحديث قواعد النشر داخل القنوات المتخصصة.',
  'إضافة دليل بدايات سريعة للأعضاء الجدد.',
]

export function DashboardCommunityPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">المجتمع</h2>
          <p className="mt-1 text-sm text-slate-500">متابعة المجموعات والقنوات والتحديثات المجتمعية.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          4 مجموعات رئيسية
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {COMMUNITY_GROUPS.map((group) => (
          <article key={group.name} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{group.name}</p>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>عدد الأعضاء: {group.members.toLocaleString('en-US')}</p>
              <p>القناة: {group.channel}</p>
              <p>الحالة: {group.status}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-sm font-semibold text-slate-900">إعلانات المجتمع</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {COMMUNITY_NOTICES.map((notice) => (
            <li key={notice} className="rounded-md bg-white px-3 py-2">
              {notice}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}