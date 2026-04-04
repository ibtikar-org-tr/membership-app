import { useCountUp } from './useCountUp'

export function MembersOverviewCard() {
  const totalMembers = useCountUp(1284)
  const monthlyGrowth = useCountUp(12)
  const telegramActive = useCountUp(742)
  const newMembers = useCountUp(38)
  const countriesCount = useCountUp(2)
  const universitiesCount = useCountUp(62)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">إجمالي الأعضاء</p>
          <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{totalMembers.toLocaleString('en-US')}</p>
        </div>
        <div className="self-start rounded-2xl bg-emerald-100 px-4 py-2 text-right sm:self-auto">
          <p className="text-xs font-semibold text-emerald-700">+{monthlyGrowth}% هذه الدورة</p>
          <p className="mt-1 text-sm text-emerald-900">نمو مستمر</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
          <p className="text-slate-500">نشطون على التلغرام</p>
          <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">{telegramActive.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
          <p className="text-slate-500">منتسبين جدد</p>
          <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">{newMembers.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
          <p className="text-slate-500">الدول</p>
          <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">{countriesCount.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
          <p className="text-slate-500">الجامعات</p>
          <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">{universitiesCount.toLocaleString('en-US')}</p>
        </div>
      </div>
    </div>
  )
}