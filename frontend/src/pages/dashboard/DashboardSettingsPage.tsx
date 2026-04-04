import { MOCK_SETTINGS } from './mockData'

export function DashboardSettingsPage() {
  const settingsRows = [
    { label: 'لغة الواجهة', value: MOCK_SETTINGS.language },
    { label: 'نمط العرض', value: MOCK_SETTINGS.theme },
    { label: 'تنبيهات البريد الإلكتروني', value: MOCK_SETTINGS.emailNotifications ? 'مفعّل' : 'غير مفعّل' },
    { label: 'تنبيهات التلغرام', value: MOCK_SETTINGS.telegramNotifications ? 'مفعّل' : 'غير مفعّل' },
    { label: 'النشرة الأسبوعية', value: MOCK_SETTINGS.weeklyDigest ? 'مفعّلة' : 'غير مفعّلة' },
    { label: 'ظهور الملف الشخصي', value: MOCK_SETTINGS.profileVisibility },
  ]

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">الإعدادات</h2>
          <p className="mt-1 text-sm text-slate-500">تفضيلات الحساب الحالية مع عرض توضيحي قابل للتطوير لاحقاً.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          الملف الشخصي محمي
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {settingsRows.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">{item.label}</span>
            <span className="text-sm font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}