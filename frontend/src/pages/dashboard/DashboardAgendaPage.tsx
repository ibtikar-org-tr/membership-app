import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { fetchAgenda } from '../../api/vms'
import { AgendaCalendar } from '../../components/dashboard/agenda/AgendaCalendar'
import {
  buildAgendaData,
  getMonthRange,
  type AgendaData,
  type AgendaTaskItem,
} from '../../components/dashboard/agenda/agenda-utils'
import { paths } from '../../routes/paths'
import { getStoredUser } from '../../utils/auth'

function AgendaSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      <div className="h-6 w-48 animate-pulse rounded-md bg-slate-100" />
      <div className="h-[520px] animate-pulse rounded-2xl bg-slate-100" />
    </div>
  )
}

export function DashboardAgendaPage() {
  const user = useMemo(() => getStoredUser(), [])
  const [agenda, setAgenda] = useState<AgendaData | null>(null)
  const [unscheduledTasks, setUnscheduledTasks] = useState<AgendaTaskItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [visibleRange, setVisibleRange] = useState(() => getMonthRange())
  const unscheduledLoadedRef = useRef(false)
  const unscheduledTasksRef = useRef<AgendaTaskItem[]>([])
  const requestIdRef = useRef(0)
  const visibleRangeRef = useRef(visibleRange)
  const agendaReadyRef = useRef(false)

  const loadAgendaForRange = useCallback(
    async (range: { from: string; to: string }, options?: { isInitial?: boolean }) => {
      if (!user?.membershipNumber) {
        setAgenda(null)
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      const requestId = ++requestIdRef.current
      const includeUnscheduled = !unscheduledLoadedRef.current
      const isInitial = options?.isInitial ?? !agendaReadyRef.current

      if (isInitial) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setHasError(false)

      try {
        const payload = await fetchAgenda({
          from: range.from,
          to: range.to,
          includeUnscheduled,
        })

        if (requestId !== requestIdRef.current) {
          return
        }

        if (includeUnscheduled) {
          unscheduledLoadedRef.current = true
          unscheduledTasksRef.current = payload.unscheduledTasks
          setUnscheduledTasks(payload.unscheduledTasks)
        }

        const nextAgenda = buildAgendaData({
          tasks: payload.tasks,
          events: payload.events,
          unscheduledTasks: unscheduledTasksRef.current,
        })

        agendaReadyRef.current = true
        visibleRangeRef.current = range
        setAgenda(nextAgenda)
        setVisibleRange(range)
        setHasError(false)
      } catch {
        if (requestId === requestIdRef.current) {
          setHasError(true)
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [user?.membershipNumber],
  )

  const handleVisibleRangeChange = useCallback(
    (range: { from: string; to: string }) => {
      const current = visibleRangeRef.current
      if (range.from === current.from && range.to === current.to && agendaReadyRef.current) {
        return
      }

      void loadAgendaForRange(range, { isInitial: !agendaReadyRef.current })
    },
    [loadAgendaForRange],
  )

  const handleRetry = () => {
    void loadAgendaForRange(visibleRangeRef.current, { isInitial: !agendaReadyRef.current })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700">
            <CalendarCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">جدولي</h2>
            <p className="mt-1 text-sm text-slate-500">
              عرض شهري لمهامك وفعالياتك — يتم تحميل شهر واحد في كل مرة.
            </p>
          </div>
        </div>

        {!isLoading && !hasError && agenda ? (
          <span className="inline-flex w-fit rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
            {agenda.calendarEvents.length} عنصر هذا الشهر
          </span>
        ) : null}
      </div>

      {isLoading && !agenda ? <AgendaSkeleton /> : null}

      {hasError && !agenda ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-5 text-center">
          <p className="text-sm font-medium text-red-800">تعذر تحميل جدولك.</p>
          <p className="mt-1 text-xs text-red-700/90">تحقق من الاتصال ثم أعد المحاولة.</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-50"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {hasError && agenda ? (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-800">
          تعذر تحديث الشهر الحالي.{' '}
          <button type="button" onClick={handleRetry} className="font-semibold underline">
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {user?.membershipNumber ? (
        <>
          <div className={isLoading && !agenda ? 'sr-only' : undefined}>
            <AgendaCalendar
              events={agenda?.calendarEvents ?? []}
              unscheduledCount={unscheduledTasks.length}
              isRefreshing={isRefreshing}
              onVisibleRangeChange={handleVisibleRangeChange}
            />
          </div>

          {unscheduledTasks.length > 0 ? (
            <aside className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
              <h3 className="text-sm font-semibold text-violet-900">مهام بدون موعد نهائي</h3>
              <p className="mt-1 text-xs text-violet-800/80">هذه المهام نشطة لكن لم يُحدد لها تاريخ استحقاق بعد.</p>
              <div className="mt-3 space-y-2">
                {unscheduledTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={paths.project(task.projectId)}
                    className="block rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-violet-200"
                  >
                    {task.name}
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {task.projectName ?? task.projectId}
                    </span>
                  </Link>
                ))}
              </div>
            </aside>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
