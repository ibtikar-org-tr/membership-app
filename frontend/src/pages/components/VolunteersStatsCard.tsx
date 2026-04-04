import { useCountUp } from './useCountUp'

export function VolunteersStatsCard() {
  const volunteersCount = useCountUp(326)
  const growthPercent = useCountUp(9)
  const activeCount = useCountUp(214)
  const eventsCount = useCountUp(27)
  const hoursCount = useCountUp(1940)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:p-5">
      <div className="relative flex flex-col gap-3 pt-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-0">
        <div>
          <p className="text-xs font-semibold text-slate-500 sm:text-sm">المتطوعون</p>
          <p className="mt-1 text-xl font-black text-slate-900 sm:mt-2 sm:text-3xl">{volunteersCount.toLocaleString('en-US')}</p>
        </div>
        <div className="absolute left-0 top-0 rounded-2xl bg-sky-100 px-3 py-2 text-left sm:static sm:self-auto sm:px-4">
          <p className="text-xs font-semibold text-sky-700">+{growthPercent}% هذا الشهر</p>
          <p className="mt-1 text-sm text-sky-900">نشاط متزايد</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] sm:mt-5 sm:gap-3 sm:text-sm">
        <div className="rounded-xl bg-slate-50 px-2 py-2 sm:p-3">
          <p className="leading-none text-slate-500">نشطون</p>
          <p className="mt-1 whitespace-nowrap text-sm font-bold leading-none text-slate-900 sm:text-lg">{activeCount.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-2 py-2 sm:p-3">
          <p className="leading-none text-slate-500">فعاليات</p>
          <p className="mt-1 whitespace-nowrap text-sm font-bold leading-none text-slate-900 sm:text-lg">{eventsCount.toLocaleString('en-US')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-2 py-2 sm:p-3">
          <p className="leading-none text-slate-500">ساعات</p>
          <p className="mt-1 whitespace-nowrap text-sm font-bold leading-none text-slate-900 sm:text-lg">{hoursCount.toLocaleString('en-US')}</p>
        </div>
      </div>
    </div>
  )
}