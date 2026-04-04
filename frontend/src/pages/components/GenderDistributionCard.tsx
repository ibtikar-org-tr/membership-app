import { useCountUp } from './useCountUp'

export function GenderDistributionCard() {
  const maleRatio = useCountUp(56)
  const femaleRatio = useCountUp(44)

  return (
    <div className="rounded-2xl bg-linear-to-r from-slate-900 to-slate-700 p-3 text-white shadow-lg sm:p-5">
      <p className="text-xs font-semibold text-slate-300 sm:text-sm">توزيع الأعضاء حسب الجنس</p>
      <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs sm:mb-2 sm:text-sm">
            <span>الذكور</span>
            <span>{maleRatio}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/15 sm:h-2">
            <div className="h-1.5 rounded-full bg-emerald-400 transition-[width] duration-200 sm:h-2" style={{ width: `${maleRatio}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs sm:mb-2 sm:text-sm">
            <span>الإناث</span>
            <span>{femaleRatio}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/15 sm:h-2">
            <div className="h-1.5 rounded-full bg-cyan-400 transition-[width] duration-200 sm:h-2" style={{ width: `${femaleRatio}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}