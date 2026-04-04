import { useCountUp } from './useCountUp'

export function GenderDistributionCard() {
  const maleRatio = useCountUp(56)
  const femaleRatio = useCountUp(44)

  return (
    <div className="rounded-2xl bg-linear-to-r from-slate-900 to-slate-700 p-4 text-white shadow-lg sm:p-5">
      <p className="text-sm font-semibold text-slate-300">توزيع الأعضاء حسب الجنس</p>
      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>الذكور</span>
            <span>{maleRatio}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/15">
            <div className="h-2 rounded-full bg-emerald-400 transition-[width] duration-200" style={{ width: `${maleRatio}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>الإناث</span>
            <span>{femaleRatio}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/15">
            <div className="h-2 rounded-full bg-cyan-400 transition-[width] duration-200" style={{ width: `${femaleRatio}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}