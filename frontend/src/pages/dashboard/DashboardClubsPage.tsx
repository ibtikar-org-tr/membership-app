import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchClubs } from '../../api/vms'
import type { VmsClub } from '../../types/vms'

const VISIBILITY_LABEL: Record<string, string> = {
  public: 'عام',
  private: 'خاص',
  draft: 'مسودة',
}

const JOIN_POLICY_LABEL: Record<string, string> = {
  auto_approve: 'دخول مباشر',
  request_to_join: 'طلب انضمام',
  invite_only: 'بدعوة فقط',
}

export function DashboardClubsPage() {
  const [clubs, setClubs] = useState<VmsClub[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const publicClubs = useMemo(
    () => clubs.filter((club) => club.visibility === 'public'),
    [clubs],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadClubs() {
      try {
        const payload = await fetchClubs()

        if (!controller.signal.aborted) {
          setClubs(payload.clubs)
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
    }

    void loadClubs()

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">الأندية</h2>
          <p className="mt-1 text-sm text-slate-500">الأندية العامة المنشورة ضمن المشاريع.</p>
          <p className="mt-1 text-xs text-slate-500">إضافة الأندية وإدارتها تتم من صفحة المشروع بواسطة مالك المشروع أو مديريه.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {publicClubs.length} نادي عام
        </span>
      </div>

      {isLoading ? <p className="mt-6 text-center text-sm text-slate-500">جار تحميل الأندية...</p> : null}
      {hasError ? <p className="mt-6 text-center text-sm text-red-600">تعذر تحميل الأندية.</p> : null}

      {!isLoading && !hasError ? (
        publicClubs.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">لا توجد أندية عامة حالياً.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicClubs.map((club) => (
              <li key={club.id}>
                <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{club.name}</h3>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                      {VISIBILITY_LABEL[club.visibility] ?? club.visibility}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {JOIN_POLICY_LABEL[club.joinPolicy] ?? club.joinPolicy}
                  </p>

                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">
                    {club.description ?? 'لا يوجد وصف لهذا النادي.'}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>المشروع: {club.projectId}</span>
                    <Link
                      to={`/dashboard/clubs/${club.id}`}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      التفاصيل
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  )
}
