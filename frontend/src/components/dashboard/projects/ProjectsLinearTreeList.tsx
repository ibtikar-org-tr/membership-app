import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { FiChevronLeft } from 'react-icons/fi'
import type { VmsProject } from '../../../types/vms'
import { projectStatusAccent, statusBadgeClass, statusLabel } from '../project-details/helpers'
import { buildLinearProjectTreeRows } from './buildLinearProjectTreeRows'

const TREE_LINE = 'bg-slate-200'

function TreeGuideLines({ depth, linePrefixes, isLast }: { depth: number; linePrefixes: boolean[]; isLast: boolean }) {
  if (depth === 0) {
    return null
  }

  return (
    <div className="flex shrink-0 self-stretch" aria-hidden>
      {linePrefixes.map((continues, index) => (
        <span key={`tree-prefix-${index}`} className="relative w-5 shrink-0 self-stretch">
          {continues ? <span className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 ${TREE_LINE}`} /> : null}
        </span>
      ))}
      <span className="relative w-5 shrink-0 self-stretch">
        <span className={`absolute left-1/2 top-0 bottom-1/2 w-px -translate-x-1/2 ${TREE_LINE}`} />
        <span className={`absolute top-1/2 left-0 h-px w-1/2 ${TREE_LINE}`} />
        {!isLast ? <span className={`absolute left-1/2 top-1/2 bottom-0 w-px -translate-x-1/2 ${TREE_LINE}`} /> : null}
      </span>
    </div>
  )
}

function ProjectTreeRow({
  project,
  depth,
  linePrefixes,
  isLast,
  isLastRow,
}: {
  project: VmsProject
  depth: number
  linePrefixes: boolean[]
  isLast: boolean
  isLastRow: boolean
}) {
  return (
    <li className="flex items-stretch">
      <TreeGuideLines depth={depth} linePrefixes={linePrefixes} isLast={isLast} />
      <article
        className={`group flex min-w-0 flex-1 items-stretch overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition hover:border-cyan-200/80 hover:shadow-md ${isLastRow ? '' : 'mb-2'}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 py-2.5 ps-3 pe-2 sm:gap-3 sm:py-3 sm:ps-4 sm:pe-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(project.status)}`}>
                {statusLabel(project.status)}
              </span>
              <h4 className="min-w-0 truncate text-sm font-semibold text-slate-900">{project.name}</h4>
            </div>
            {project.description ? (
              <p className="min-w-0 truncate text-xs text-slate-500 sm:max-w-md sm:flex-1">{project.description}</p>
            ) : null}
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 sm:ms-auto">
              <span className="truncate">
                <span className="text-slate-400">المسؤول:</span> {project.ownerDisplayName ?? project.owner}
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
        <div className={`w-1 shrink-0 ${projectStatusAccent(project.status)}`} aria-hidden />
      </article>
    </li>
  )
}

export function ProjectsLinearTreeList({ projects }: { projects: VmsProject[] }) {
  const rows = useMemo(() => buildLinearProjectTreeRows(projects), [projects])

  return (
    <ul className="grid list-none grid-cols-1 gap-0 p-0 lg:max-w-5xl">
      {rows.map(({ project, depth, linePrefixes, isLast }, index) => (
        <ProjectTreeRow
          key={project.id}
          project={project}
          depth={depth}
          linePrefixes={linePrefixes}
          isLast={isLast}
          isLastRow={index === rows.length - 1}
        />
      ))}
    </ul>
  )
}

export function ProjectsLinearTreeSkeleton() {
  return (
    <div className="space-y-0 lg:max-w-5xl">
      {[0, 1, 2, 3, 4, 5].map((key) => {
        const depth = key % 3
        const isLastRow = key === 5

        return (
          <div key={`project-tree-skeleton-${key}`} className="flex items-stretch">
            {depth > 0 ? (
              <div className="flex shrink-0 self-stretch" aria-hidden>
                {Array.from({ length: depth }, (_, index) => (
                  <span key={index} className="relative w-5 shrink-0 self-stretch">
                    <span className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 ${TREE_LINE}`} />
                  </span>
                ))}
              </div>
            ) : null}
            <div
              className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 ${isLastRow ? '' : 'mb-2'}`}
            >
              <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-40 animate-pulse rounded-md bg-slate-200" />
              <div className="ms-auto h-7 w-20 animate-pulse rounded-lg bg-slate-200" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
