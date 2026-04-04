import { useEffect, useState } from 'react'

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let animationFrameId = 0
    let startTime: number | null = null

    const step = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp
      }

      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = 1 - (1 - progress) * (1 - progress)
      const nextValue = Math.round(target * easedProgress)

      setValue(nextValue)

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step)
      }
    }

    animationFrameId = window.requestAnimationFrame(step)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [target, duration])

  return value
}

export function VolunteersStatsCard() {
  const volunteersCount = useCountUp(326)
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
          <p className="text-xs font-semibold text-sky-700">+9% هذا الشهر</p>
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