import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import {
  fetchClubsDashboard,
  fetchDirectProjects,
  fetchEventRegistrations,
  fetchEvents,
  fetchOpenPositions,
  fetchTasks,
} from '../../api/vms'
import { AgendaCalendar } from '../../components/dashboard/agenda/AgendaCalendar'
import { buildAgendaData, type AgendaData } from '../../components/dashboard/agenda/agenda-utils'
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
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadAgenda = useCallback(async () => {
    if (!user?.membershipNumber) {
      setAgenda(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setHasError(false)

    try {
      const [tasksPayload, registrationsPayload, eventsPayload, positionsPayload, projectsPayload, clubsPayload] =
        await Promise.all([
          fetchTasks(user.membershipNumber),
          fetchEventRegistrations(undefined, { membershipNumber: user.membershipNumber }),
          fetchEvents(),
          fetchOpenPositions(user.membershipNumber),
          fetchDirectProjects(user.membershipNumber),
          fetchClubsDashboard(user.membershipNumber),
        ])

      setAgenda(
        buildAgendaData({
          membershipNumber: user.membershipNumber,
          tasks: tasksPayload.tasks,
          registrations: registrationsPayload.eventRegistrations,
          events: eventsPayload.events,
          positions: positionsPayload.positions,
          projects: projectsPayload.projects,
          clubs: clubsPayload.clubs,
        }),
      )
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [user?.membershipNumber])

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      if (!user?.membershipNumber) {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
        return
      }

      try {
        const [tasksPayload, registrationsPayload, eventsPayload, positionsPayload, projectsPayload, clubsPayload] =
          await Promise.all([
            fetchTasks(user.membershipNumber),
            fetchEventRegistrations(undefined, { membershipNumber: user.membershipNumber }),
            fetchEvents(),
            fetchOpenPositions(user.membershipNumber),
            fetchDirectProjects(user.membershipNumber),
            fetchClubsDashboard(user.membershipNumber),
          ])

        if (controller.signal.aborted) {
          return
        }

        setAgenda(
          buildAgendaData({
            membershipNumber: user.membershipNumber,
            tasks: tasksPayload.tasks,
            registrations: registrationsPayload.eventRegistrations,
            events: eventsPayload.events,
            positions: positionsPayload.positions,
            projects: projectsPayload.projects,
            clubs: clubsPayload.clubs,
          }),
        )
        setHasError(false)
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
  }, [user?.membershipNumber])

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
              عرض شهري لمهامك وفعالياتك — انقر على أي يوم لعرض التفاصيل.
            </p>
          </div>
        </div>

        {!isLoading && !hasError && agenda ? (
          <span className="inline-flex w-fit rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
            {agenda.calendarEvents.length} عنصر مجدول
          </span>
        ) : null}
      </div>

      {isLoading ? <AgendaSkeleton /> : null}

      {hasError ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-5 text-center">
          <p className="text-sm font-medium text-red-800">تعذر تحميل جدولك.</p>
          <p className="mt-1 text-xs text-red-700/90">تحقق من الاتصال ثم أعد المحاولة.</p>
          <button
            type="button"
            onClick={() => void loadAgenda()}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-50"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {!isLoading && !hasError && agenda ? (
        <>
          <AgendaCalendar events={agenda.calendarEvents} unscheduledCount={agenda.unscheduledTasks.length} />

          {agenda.unscheduledTasks.length > 0 ? (
            <aside className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
              <h3 className="text-sm font-semibold text-violet-900">مهام بدون موعد نهائي</h3>
              <p className="mt-1 text-xs text-violet-800/80">هذه المهام نشطة لكن لم يُحدد لها تاريخ استحقاق بعد.</p>
              <div className="mt-3 space-y-2">
                {agenda.unscheduledTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={paths.project(task.projectId)}
                    className="block rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-violet-200"
                  >
                    {task.name}
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {agenda.projectNames[task.projectId] ?? task.projectId}
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
