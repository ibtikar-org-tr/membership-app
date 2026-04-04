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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">إجمالي الأعضاء</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{totalMembers.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-2xl bg-emerald-100 px-4 py-2 text-right">
          <p className="text-xs font-semibold text-emerald-700">+{monthlyGrowth}% هذه الدورة</p>
          <p className="mt-1 text-sm text-emerald-900">نمو مستمر</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-slate-500">نشطون على التلغرام</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{telegramActive.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-slate-500">منتسبين جدد</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{newMembers.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-slate-500">الدول</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{countriesCount.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-slate-500">الجامعات</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{universitiesCount.toLocaleString('en-US')}</p>
        </div>
      </div>
    </div>
  )
}