import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  MapPin,
  Shapes,
} from 'lucide-react'
import {
  fetchClubsDashboard,
  fetchDirectProjects,
  fetchEventRegistrations,
  fetchEvents,
  fetchOpenPositions,
  fetchTasks,
} from '../../api/vms'
import { buildAgendaData, type AgendaData, type AgendaTimelineItem } from '../../components/dashboard/agenda/agenda-utils'
import { EventCard } from '../../components/dashboard/events/EventCard'
import {
  formatDueDate,
  priorityBadgeClass,
  statusBadgeClass,
  taskPriorityLabel,
  taskStatusLabel,
} from '../../components/dashboard/project-details/helpers'
import { paths } from '../../routes/paths'
import { getStoredUser } from '../../utils/auth'
import { formatDateEnCA, formatDateTimeEnCA } from '../../utils/date-format'

function AgendaSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={`agenda-stat-${key}`} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={`agenda-card-${key}`} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  )
}

function timelineKindLabel(kind: AgendaTimelineItem['kind']) {
  if (kind === 'task') return 'مهمة'
  if (kind === 'event') return 'فعالية'
  return kind
}

function timelineKindClass(kind: AgendaTimelineItem['kind']) {
  if (kind === 'task') return 'border-violet-200 bg-violet-50 text-violet-800'
  if (kind === 'event') return 'border-cyan-200 bg-cyan-50 text-cyan-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function applicationStatusLabel(status: string) {
  if (status === 'pending') return 'قيد المراجعة'
  if (status === 'accepted') return 'مقبول'
  return status
}

function applicationStatusClass(status: string) {
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (status === 'accepted') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
      <p className="text-sm text-slate-500">{message}</p>
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

  const projectNames = useMemo(() => {
    return new Map((agenda?.projects ?? []).map((project) => [project.id, project.name]))
  }, [agenda?.projects])

  const totalItems =
    (agenda?.myTasks.length ?? 0) +
    (agenda?.upcomingEvents.length ?? 0) +
    (agenda?.volunteering.length ?? 0) +
    (agenda?.projects.length ?? 0) +
    (agenda?.clubs.length ?? 0)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700">
            <CalendarCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">جدولي</h2>
            <p className="mt-1 text-sm text-slate-500">كل ما يخصّك في مكان واحد: مهامك، فعالياتك، مشاريعك، وأنديتك.</p>
          </div>
        </div>

        {!isLoading && !hasError && agenda ? (
          <span className="inline-flex w-fit rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
            {totalItems} عنصر
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
        <div className="mt-6 space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'مهامي', value: agenda.myTasks.length, tone: 'text-violet-700 bg-violet-50 border-violet-200' },
              { label: 'فعالياتي', value: agenda.upcomingEvents.length, tone: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
              { label: 'طلبات التطوع', value: agenda.volunteering.length, tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { label: 'مشاريعي', value: agenda.projects.length, tone: 'text-amber-700 bg-amber-50 border-amber-200' },
            ].map((stat) => (
              <article key={stat.label} className={`rounded-xl border px-4 py-3 ${stat.tone}`}>
                <p className="text-xs font-medium opacity-80">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value.toLocaleString('en-US')}</p>
              </article>
            ))}
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">القادم قريباً</h3>
              <span className="text-xs text-slate-500">مرتّب حسب التاريخ</span>
            </div>

            {agenda.timeline.length > 0 ? (
              <div className="space-y-2">
                {agenda.timeline.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${timelineKindClass(item.kind)}`}
                    >
                      {timelineKindLabel(item.kind)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                      {item.subtitle ? <p className="truncate text-xs text-slate-500">{item.subtitle}</p> : null}
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-600">
                      {item.date ? formatDateTimeEnCA(item.date) : 'بدون موعد'}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptySection message="لا توجد مهام أو فعاليات قادمة حالياً." />
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-violet-600" aria-hidden />
              <h3 className="text-base font-semibold text-slate-900">مهامي</h3>
            </div>

            {agenda.myTasks.length > 0 ? (
              <div className="space-y-2">
                {agenda.myTasks.map((task) => {
                  const dueDateTimestamp = task.dueDate ? Date.parse(task.dueDate) : Number.NaN
                  const isOverdue =
                    Number.isFinite(dueDateTimestamp) &&
                    dueDateTimestamp < Date.now() &&
                    task.status !== 'completed' &&
                    task.status !== 'archived'

                  return (
                    <Link
                      key={task.id}
                      to={paths.project(task.projectId)}
                      className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{task.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{projectNames.get(task.projectId) ?? task.projectId}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(task.status)}`}>
                            {taskStatusLabel(task.status)}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityBadgeClass(task.priority)}`}>
                            {taskPriorityLabel(task.priority)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className={isOverdue ? 'font-semibold text-rose-700' : undefined}>
                          الموعد: {formatDueDate(task.dueDate)}
                        </span>
                        {task.subtaskProgress ? (
                          <span>
                            المهام الفرعية: {task.subtaskProgress.completed}/{task.subtaskProgress.total}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <EmptySection message="لا توجد مهام مُسندة إليك حالياً." />
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-cyan-600" aria-hidden />
              <h3 className="text-base font-semibold text-slate-900">فعالياتي</h3>
            </div>

            {agenda.upcomingEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {agenda.upcomingEvents.map((eventItem) => (
                  <EventCard key={eventItem.id} eventItem={eventItem} />
                ))}
              </div>
            ) : (
              <EmptySection message="لم تسجّل في أي فعالية قادمة بعد." />
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-600" aria-hidden />
              <h3 className="text-base font-semibold text-slate-900">طلبات التطوع</h3>
            </div>

            {agenda.volunteering.length > 0 ? (
              <div className="space-y-2">
                {agenda.volunteering.map(({ position, application }) => (
                  <article
                    key={application.id}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-emerald-700">{position.projectName ?? position.projectId}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{position.name}</p>
                        <p className="mt-1 text-xs text-slate-500">تاريخ التقديم: {formatDateEnCA(application.createdAt)}</p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${applicationStatusClass(application.status)}`}
                      >
                        {applicationStatusLabel(application.status)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptySection message="لا توجد طلبات تطوع نشطة." />
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-amber-600" aria-hidden />
                <h3 className="text-base font-semibold text-slate-900">مشاريعي</h3>
              </div>

              {agenda.projects.length > 0 ? (
                <div className="space-y-2">
                  {agenda.projects.map((project) => (
                    <Link
                      key={project.id}
                      to={paths.project(project.id)}
                      className="block rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-amber-200 hover:bg-amber-50/40"
                    >
                      <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                      {project.description?.trim() ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{project.description}</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptySection message="أنت غير منضم إلى أي مشروع حالياً." />
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Shapes className="h-4 w-4 text-slate-600" aria-hidden />
                <h3 className="text-base font-semibold text-slate-900">أنديتي</h3>
              </div>

              {agenda.clubs.length > 0 ? (
                <div className="space-y-2">
                  {agenda.clubs.map((club) => {
                    const locationLabel = [club.city, club.region, club.country].filter(Boolean).join(' · ')

                    return (
                      <Link
                        key={club.id}
                        to={paths.club(club.id)}
                        className="block rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <p className="text-sm font-semibold text-slate-900">{club.name}</p>
                        {club.projectName ? <p className="mt-1 text-xs text-slate-500">{club.projectName}</p> : null}
                        {locationLabel ? (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                            {locationLabel}
                          </p>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <EmptySection message="لم تنضم إلى أي نادي بعد." />
              )}
            </section>
          </div>
        </div>
      ) : null}
    </section>
  )
}
