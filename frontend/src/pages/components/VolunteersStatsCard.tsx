import { useCountUp } from './useCountUp'

export function VolunteersStatsCard() {
  const volunteersCount = useCountUp(326)
  const growthPercent = useCountUp(9)
  const activeCount = useCountUp(214)
  const eventsCount = useCountUp(27)
  const hoursCount = useCountUp(1940)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg mt-80">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">المتطوعون</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{volunteersCount.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-2xl bg-sky-100 px-4 py-2 text-right">
          <p className="text-xs font-semibold text-sky-700">+{growthPercent}% هذا الشهر</p>
          <p className="mt-1 text-sm text-sky-900">نشاط متزايد</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">نشطون</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{activeCount.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">فعاليات</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{eventsCount.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">ساعات</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{hoursCount.toLocaleString('en-US')}</p>
        </div>
      </div>
    </div>
  )
}