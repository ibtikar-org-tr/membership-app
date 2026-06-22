import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { FiChevronLeft, FiCornerDownLeft } from 'react-icons/fi'
import type { VmsProject } from '../../../types/vms'
import { formatDateEnCA } from '../../../utils/date-format'
import { priorityTone, statusBadgeClass, statusLabel } from '../project-details/helpers'
import { buildLinearProjectTreeRows } from './buildLinearProjectTreeRows'

function TreeIndentGuide({ depth }: { depth: number }) {
  if (depth === 0) {
    return null
  }

  return (
    <div className="flex shrink-0 items-stretch" aria-hidden>
      {Array.from({ length: depth }, (_, index) => (
        <span
          key={`tree-guide-${index}`}
          className={`inline-block w-5 shrink-0 ${index === depth - 1 ? 'border-s border-slate-200' : 'border-s border-slate-100'}`}
        />
      ))}
      <span className="flex w-5 shrink-0 items-center justify-center text-slate-300">
        <FiCornerDownLeft className="h-3.5 w-3.5 rotate-180" />
      </span>
    </div>
  )
}

function ProjectTreeRow({ project, depth }: { project: VmsProject; depth: number }) {
  return (
    <li>
      <article className="group flex items-stretch gap-2 rounded-xl border border-slate-200/80 bg-white shadow-sm transition hover:border-cyan-200/80 hover:shadow-md sm:gap-3">
        <div className={`w-1 shrink-0 rounded-s-xl ${priorityTone(project.status)}`} aria-hidden />
        <div className="flex min-w-0 flex-1 items-center gap-2 py-2.5 ps-1 pe-3 sm:gap-3 sm:py-3 sm:pe-4">
          <TreeIndentGuide depth={depth} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(project.status)}`}>
                {statusLabel(project.status)}
              </span>
              <h4 className="min-w-0 truncate text-sm font-semibold text-slate-900">{project.name}</h4>
            </div>
            {project.description ? (
              <p className="min-w-0 truncate text-xs text-slate-500 sm:max-w-md sm:flex-1">{project.description}</p>
            ) : (
              <p className="hidden text-xs italic text-slate-400 sm:block sm:max-w-md sm:flex-1">لا يوجد وصف</p>
            )}
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 sm:ms-auto">
              <span className="truncate">
                <span className="text-slate-400">المسؤول:</span> {project.ownerDisplayName ?? project.owner}
              </span>
              <span className="hidden sm:inline">
                <span className="text-slate-400">آخر تحديث:</span> {formatDateEnCA(project.updatedAt)}
              </span>
            </div>
          </div>
          <Link
            to={`/dashboard/projects/${project.id}`}
            className="inline-flex shrink-0 items-center gap-1 self-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 transition group-hover:border-cyan-300 group-hover:bg-cyan-50/80 group-hover:text-cyan-950"
          >
            التفاصيل
            <FiChevronLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </article>
    </li>
  )
}

export function ProjectsLinearTreeList({ projects }: { projects: VmsProject[] }) {
  const rows = useMemo(() => buildLinearProjectTreeRows(projects), [projects])

  return (
    <ul className="grid list-none grid-cols-1 gap-2 p-0 lg:max-w-5xl">
      {rows.map(({ project, depth }) => (
        <ProjectTreeRow key={project.id} project={project} depth={depth} />
      ))}
    </ul>
  )
}

export function ProjectsLinearTreeSkeleton() {
  return (
    <div className="space-y-2 lg:max-w-5xl">
      {[0, 1, 2, 3, 4, 5].map((key) => (
        <div
          key={`project-tree-skeleton-${key}`}
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3"
          style={{ marginInlineStart: `${(key % 3) * 1.25}rem` }}
        >
          <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-40 animate-pulse rounded-md bg-slate-200" />
          <div className="ms-auto h-7 w-20 animate-pulse rounded-lg bg-slate-200" />
        </div>
      ))}
    </div>
  )
}
