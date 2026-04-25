export function DashboardCommunityPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">المجتمع</h2>
          <p className="mt-1 text-sm text-slate-500">هذه الصفحة فارغة حالياً، سيتم إضافة المحتوى قريباً.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-12 px-4">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="mt-4 text-lg font-medium text-slate-900">الصفحة فارغة</p>
          <p className="mt-2 text-sm text-slate-600">سيتم إضافة محتوى هذه الصفحة قريباً. يرجى العودة لاحقاً.</p>
        </div>
      </div>
    </section>
  )
}