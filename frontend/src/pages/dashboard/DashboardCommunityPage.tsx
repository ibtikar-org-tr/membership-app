import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { fetchLeaderboard } from '../../api/vms'
import { CommunityLeaderboard } from '../../components/dashboard/community/CommunityLeaderboard'
import type { VmsLeaderboardEntry } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'

export function DashboardCommunityPage() {
  const user = useMemo(() => getStoredUser(), [])
  const [entries, setEntries] = useState<VmsLeaderboardEntry[]>([])
  const [currentUser, setCurrentUser] = useState<VmsLeaderboardEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)

    try {
      const payload = await fetchLeaderboard(50)
      setEntries(payload.entries)
      setCurrentUser(payload.currentUser)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      try {
        const payload = await fetchLeaderboard(50)

        if (!controller.signal.aborted) {
          setEntries(payload.entries)
          setCurrentUser(payload.currentUser)
          setHasError(false)
        }
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
            <Trophy className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">المجتمع</h2>
            <p className="mt-1 text-sm text-slate-500">لوحة المتصدرين حسب النقاط المكتسبة من المهام والأنشطة.</p>
            <p className="mt-1 text-xs text-slate-500">تنافس مع الأعضاء، أكمل المهام، وارتقِ في الترتيب.</p>
          </div>
        </div>

        {!isLoading && !hasError ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              {entries.length} عضو
            </span>
            {currentUser ? (
              <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                ترتيبك: {currentUser.rank}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {isLoading ? <CommunityLeaderboard.Skeleton /> : null}

      {hasError ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-5 text-center">
          <p className="text-sm font-medium text-red-800">تعذر تحميل لوحة المتصدرين.</p>
          <p className="mt-1 text-xs text-red-700/90">تحقق من الاتصال ثم أعد المحاولة.</p>
          <button
            type="button"
            onClick={() => void loadLeaderboard()}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-50"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {!isLoading && !hasError ? (
        <CommunityLeaderboard
          entries={entries}
          currentUser={currentUser}
          currentMembershipNumber={user?.membershipNumber}
        />
      ) : null}
    </section>
  )
}
