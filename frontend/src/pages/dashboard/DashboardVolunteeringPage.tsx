import { useEffect, useMemo, useState } from 'react'
import { createPositionApplication, fetchOpenPositions } from '../../api/vms'
import type { VmsPosition } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'

export function DashboardVolunteeringPage() {
  const user = useMemo(() => getStoredUser(), [])
  const [positions, setPositions] = useState<VmsPosition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [applyingPositionId, setApplyingPositionId] = useState<string | null>(null)
  const [applyError, setApplyError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadPositions() {
      try {
        const payload = await fetchOpenPositions(user?.membershipNumber ?? '')

        if (!controller.signal.aborted) {
          setPositions(payload.positions)
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

    void loadPositions()

    return () => {
      controller.abort()
    }
  }, [user?.membershipNumber])

  const handleApply = async (positionId: string) => {
    if (!user) {
      setApplyError('يجب تسجيل الدخول أولاً.')
      return
    }

    setApplyError(null)
    setApplyingPositionId(positionId)

    try {
      await createPositionApplication(positionId, {}, user.membershipNumber)
      setPositions((previous) =>
        previous.map((position) =>
          position.id === positionId
            ? {
                ...position,
                applications: [
                  ...position.applications,
                  {
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    positionId,
                    membershipNumber: user.membershipNumber,
                    motivationLetter: null,
                    status: 'pending',
                    reviewedBy: null,
                    displayName: user.email,
                    reviewedByDisplayName: null,
                  },
                ],
              }
            : position,
        ),
      )
    } catch (requestError) {
      if (requestError instanceof Error) {
        setApplyError(requestError.message)
      } else {
        setApplyError('تعذر التقديم على الفرصة.')
      }
    } finally {
      setApplyingPositionId(null)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">التطوع</h2>
          <p className="mt-1 text-sm text-slate-500">الفرص التطوعية المفتوحة عبر جميع المشاريع.</p>
          <p className="mt-1 text-xs text-slate-500">اضغط تطبيق للتقديم مباشرة على الفرصة المفتوحة.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {positions.length} فرصة مفتوحة
        </span>
      </div>

      {isLoading ? <p className="mt-6 text-center text-sm text-slate-500">جار تحميل الفرص التطوعية...</p> : null}
      {hasError ? <p className="mt-6 text-center text-sm text-red-600">تعذر تحميل الفرص التطوعية.</p> : null}
      {applyError ? <p className="mt-3 text-sm text-red-600">{applyError}</p> : null}

      {!isLoading && !hasError ? (
        positions.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">لا توجد فرص تطوعية مفتوحة حالياً.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {positions.map((position) => (
              <article key={position.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{position.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">المشروع: {position.projectName ?? position.projectId}</p>
                  </div>
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    مفتوحة
                  </span>
                </div>

                {position.description ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{position.description}</p> : null}

                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{position.seats} مقاعد</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{position.acceptedApplicationsCount} مقبولين</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{position.applications.length} طلب</span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-left">
                  <span className="text-xs text-slate-500">إذا لم تظهر لك فرصة مناسبة، راجع الصفحة لاحقاً.</span>
                  <button
                    type="button"
                    onClick={() => void handleApply(position.id)}
                    disabled={applyingPositionId === position.id || position.applications.some((application) => application.membershipNumber === user?.membershipNumber)}
                    className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {applyingPositionId === position.id
                      ? 'جار التقديم...'
                      : position.applications.some((application) => application.membershipNumber === user?.membershipNumber)
                        ? 'تم التقديم'
                        : 'تقديم'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}
    </section>
  )
}
