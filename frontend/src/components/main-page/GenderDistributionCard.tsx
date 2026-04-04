import { useCountUp } from './useCountUp'
import type { HomeStatsGenderDistribution } from '../../types/home-stats'

interface GenderDistributionCardProps {
  genderDistribution?: HomeStatsGenderDistribution
}

export function GenderDistributionCard({ genderDistribution }: GenderDistributionCardProps) {
  const maleRatio = useCountUp(genderDistribution?.malePercentage ?? 0)
  const femaleRatio = useCountUp(genderDistribution?.femalePercentage ?? 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-lg sm:p-5">
      <p className="text-xs font-semibold text-slate-500 sm:text-sm">توزيع الأعضاء حسب الجنس</p>
      <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs sm:mb-2 sm:text-sm">
            <span>الذكور</span>
            <span>{maleRatio}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 sm:h-2">
            <div className="h-1.5 rounded-full bg-blue-300 transition-[width] duration-200 sm:h-2" style={{ width: `${maleRatio}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs sm:mb-2 sm:text-sm">
            <span>الإناث</span>
            <span>{femaleRatio}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 sm:h-2">
            <div className="h-1.5 rounded-full bg-pink-300 transition-[width] duration-200 sm:h-2" style={{ width: `${femaleRatio}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}