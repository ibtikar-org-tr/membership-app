import { useCountUp } from './useCountUp'

export function MembersOverviewCard() {
  const totalMembers = useCountUp(1284)
  const monthlyGrowth = useCountUp(12)
  const telegramActive = useCountUp(742)
  const newMembers = useCountUp(38)
  const countriesCount = useCountUp(2)
  const universitiesCount = useCountUp(62)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 sm:text-sm">إجمالي الأعضاء</p>
          <p className="mt-1 text-xl font-black text-slate-900 sm:mt-2 sm:text-3xl">{totalMembers.toLocaleString('en-US')}</p>
        </div>
        <div className="shrink-0 rounded-2xl bg-emerald-100 px-3 py-2 text-left sm:px-4 sm:text-right">
          <p className="text-xs font-semibold text-emerald-700">+{monthlyGrowth}% هذه الدورة</p>
          <p className="mt-1 text-sm text-emerald-900">نمو مستمر</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:mt-5 sm:gap-3 sm:text-sm">
        <div className="rounded-xl bg-slate-50 px-2 py-2 sm:p-4">
          <p className="leading-none text-slate-500">نشطون على التلغرام</p>
          <p className="mt-1 whitespace-nowrap text-sm font-bold leading-none text-slate-900 sm:text-xl">{telegramActive.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-2 py-2 sm:p-4">
          <p className="leading-none text-slate-500">منتسبين جدد</p>
          <p className="mt-1 whitespace-nowrap text-sm font-bold leading-none text-slate-900 sm:text-xl">{newMembers.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-2 py-2 sm:p-4">
          <p className="leading-none text-slate-500">الدول</p>
          <p className="mt-1 whitespace-nowrap text-sm font-bold leading-none text-slate-900 sm:text-xl">{countriesCount.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-2 py-2 sm:p-4">
          <p className="leading-none text-slate-500">الجامعات</p>
          <p className="mt-1 whitespace-nowrap text-sm font-bold leading-none text-slate-900 sm:text-xl">{universitiesCount.toLocaleString('en-US')}</p>
        </div>
      </div>
    </div>
  )
}