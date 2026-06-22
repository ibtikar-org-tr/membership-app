import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiGitBranch } from 'react-icons/fi'
import { fetchPlatformProjects } from '../../api/vms'
import type { VmsProject } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'

function toMermaidNodeId(projectId: string) {
  return `project_${projectId.replace(/[^a-zA-Z0-9_]/g, '_')}`
}

function escapeAttributeValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function escapeMermaidLabel(value: string) {
  return value.replace(/"/g, '\\"').replace(/\n/g, ' ').trim()
}

function projectLabel(project: VmsProject) {
  return project.name
}

function getMaxDepth(projects: VmsProject[]) {
  const projectById = new Map(projects.map((project) => [project.id, project]))
  let maxDepth = 0

  for (const project of projects) {
    let depth = 1
    let current = project

    while (current.parentProjectId) {
      const parent = projectById.get(current.parentProjectId)
      if (!parent) {
        break
      }

      depth += 1
      current = parent
    }

    maxDepth = Math.max(maxDepth, depth)
  }

  return maxDepth
}

function TreeSkeleton() {
  return (
    <div className="mt-5 flex min-h-56 items-center justify-center rounded-2xl border border-slate-100 bg-linear-to-b from-slate-50 to-white p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-200" />
        <div className="flex items-start gap-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-0.5 w-8 animate-pulse bg-slate-200" />
            <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-0.5 w-8 animate-pulse bg-slate-200" />
            <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-0.5 w-8 animate-pulse bg-slate-200" />
            <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
        <p className="text-xs text-slate-400">جار تحميل شجرة المشاريع...</p>
      </div>
    </div>
  )
}

interface ProjectHierarchyTreeProps {
  clickableProjectIds?: string[]
}

interface TooltipPosition {
  x: number
  y: number
}

function ProjectTreeTooltip({ project, position }: { project: VmsProject; position: TooltipPosition }) {
  const description = project.description?.trim()

  return (
    <div
      className="pointer-events-none fixed z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 text-right shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, calc(-100% - 10px))',
      }}
      dir="rtl"
      role="tooltip"
    >
      <p className="mt-2 text-xs text-slate-500">
        <span className="font-medium text-slate-700">المسؤول:</span>{' '}
        {project.ownerDisplayName ?? project.owner}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        {description}
      </p>
    </div>
  )
}

export function ProjectHierarchyTree({ clickableProjectIds = [] }: ProjectHierarchyTreeProps) {
  const [projects, setProjects] = useState<VmsProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null)
  const diagramRef = useRef<HTMLDivElement | null>(null)
  const diagramId = useId().replace(/:/g, '_')
  const user = useMemo(() => getStoredUser(), [])
  const navigate = useNavigate()
  const clickableProjectIdSet = useMemo(() => new Set(clickableProjectIds), [clickableProjectIds])

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)

    try {
      const payload = await fetchPlatformProjects(user?.membershipNumber)
      setProjects(payload.projects)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [user?.membershipNumber])

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      try {
        const payload = await fetchPlatformProjects(user?.membershipNumber)

        if (!controller.signal.aborted) {
          setProjects(payload.projects)
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
  }, [user?.membershipNumber])

  const rootCount = useMemo(() => projects.filter((project) => !project.parentProjectId).length, [projects])
  const maxDepth = useMemo(() => getMaxDepth(projects), [projects])
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects])
  const hoveredProject = hoveredProjectId ? projectById.get(hoveredProjectId) ?? null : null

  const diagramDefinition = useMemo(() => {
    if (projects.length === 0) {
      return ''
    }

    const projectNodes = new Map(projects.map((project) => [project.id, toMermaidNodeId(project.id)]))
    const lines = ['flowchart TD']

    const sortedProjects = [...projects].sort((left, right) => {
      if (left.parentProjectId && !right.parentProjectId) {
        return 1
      }

      if (!left.parentProjectId && right.parentProjectId) {
        return -1
      }

      return left.name.localeCompare(right.name, 'ar')
    })

    for (const project of sortedProjects) {
      const nodeId = projectNodes.get(project.id)
      if (!nodeId) {
        continue
      }

      lines.push(`  ${nodeId}["${escapeMermaidLabel(projectLabel(project))}"]`)
    }

    for (const project of sortedProjects) {
      const nodeId = projectNodes.get(project.id)
      if (!nodeId) {
        continue
      }

      const parentNodeId = project.parentProjectId ? projectNodes.get(project.parentProjectId) : null
      if (parentNodeId) {
        lines.push(`  ${parentNodeId} --> ${nodeId}`)
      }
    }

    const rootNodeIds = sortedProjects
      .filter((project) => !project.parentProjectId)
      .map((project) => projectNodes.get(project.id))
      .filter((nodeId): nodeId is string => Boolean(nodeId))

    const childNodeIds = sortedProjects
      .filter((project) => project.parentProjectId)
      .map((project) => projectNodes.get(project.id))
      .filter((nodeId): nodeId is string => Boolean(nodeId))

    const clickableNodeIds = sortedProjects
      .filter((project) => clickableProjectIdSet.has(project.id))
      .map((project) => projectNodes.get(project.id))
      .filter((nodeId): nodeId is string => Boolean(nodeId))

    lines.push(
      '  classDef rootProject fill:#f0fdfa,stroke:#14b8a6,stroke-width:2px,color:#115e59,rx:14,ry:14',
      '  classDef childProject fill:#ffffff,stroke:#cbd5e1,stroke-width:1.5px,color:#334155,rx:12,ry:12',
      '  classDef clickableProject fill:#ecfeff,stroke:#0891b2,stroke-width:2.5px,color:#0e7490,rx:14,ry:14',
    )

    if (rootNodeIds.length > 0) {
      lines.push(`  class ${rootNodeIds.join(',')} rootProject`)
    }

    if (childNodeIds.length > 0) {
      lines.push(`  class ${childNodeIds.join(',')} childProject`)
    }

    if (clickableNodeIds.length > 0) {
      lines.push(`  class ${clickableNodeIds.join(',')} clickableProject`)
    }

    return lines.join('\n')
  }, [clickableProjectIdSet, projects])

  useEffect(() => {
    if (!diagramDefinition || !diagramRef.current) {
      if (diagramRef.current) {
        diagramRef.current.innerHTML = ''
      }
      return
    }

    let isActive = true

    async function renderDiagram() {
      try {
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: {
            fontFamily: 'inherit',
            fontSize: '14px',
            primaryColor: '#f0fdfa',
            primaryTextColor: '#0f172a',
            primaryBorderColor: '#14b8a6',
            lineColor: '#94a3b8',
            secondaryColor: '#f8fafc',
            tertiaryColor: '#ecfeff',
            clusterBkg: '#f8fafc',
            edgeLabelBackground: '#ffffff',
          },
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
            curve: 'basis',
            padding: 20,
            nodeSpacing: 48,
            rankSpacing: 64,
          },
        })

        const { svg } = await mermaid.render(`${diagramId}-diagram`, diagramDefinition)

        if (isActive && diagramRef.current) {
          diagramRef.current.innerHTML = svg

          const svgElement = diagramRef.current.querySelector('svg')
          if (svgElement) {
            svgElement.style.maxWidth = '100%'
            svgElement.style.height = 'auto'
            svgElement.setAttribute('role', 'img')
            svgElement.setAttribute('aria-label', 'شجرة هرمية للمشاريع')
          }

          for (const project of projects) {
            const projectId = project.id
            const nodeId = toMermaidNodeId(projectId)
            const escapedNodeId = escapeAttributeValue(nodeId)
            const node = diagramRef.current.querySelector<SVGGElement>(
              `g.node[id="${escapedNodeId}"], g.node[id*="${escapedNodeId}"], g[id="${escapedNodeId}"], g[id*="${escapedNodeId}"]`,
            )

            if (!node) {
              continue
            }

            const isClickable = clickableProjectIdSet.has(projectId)
            const shape = node.querySelector<SVGElement>('rect, polygon, path, circle, ellipse')
            const defaultShapeFilter = shape?.style.filter ?? ''

            if (isClickable) {
              node.style.cursor = 'pointer'
              node.classList.add('clickable-project-node')
              node.setAttribute('tabindex', '0')
              node.setAttribute('role', 'link')
              node.setAttribute('aria-label', 'فتح تفاصيل المشروع')

              const label = node.querySelector<SVGTextElement>('text')
              if (label) {
                label.style.fontWeight = '700'
                label.style.textDecoration = 'underline'
                label.style.textUnderlineOffset = '3px'
              }
            } else {
              node.style.cursor = 'default'
            }

            const showTooltip = () => {
              const nodeRect = node.getBoundingClientRect()
              setHoveredProjectId(projectId)
              setTooltipPosition({
                x: nodeRect.left + nodeRect.width / 2,
                y: nodeRect.top,
              })
            }

            const hideTooltip = () => {
              setHoveredProjectId(null)
              setTooltipPosition(null)
            }

            const handleOpenProject = () => {
              if (!isClickable) {
                return
              }

              navigate(`/dashboard/projects/${projectId}`)
            }

            const handleKeyDown = (event: Event) => {
              if (!isClickable) {
                return
              }

              const keyboardEvent = event as KeyboardEvent
              if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                keyboardEvent.preventDefault()
                handleOpenProject()
              }
            }

            const handleMouseEnter = () => {
              showTooltip()

              if (isClickable && shape) {
                shape.style.filter = 'drop-shadow(0 4px 10px rgba(8, 145, 178, 0.22))'
                shape.style.strokeWidth = '3px'
              }
            }

            const handleMouseLeave = () => {
              hideTooltip()

              if (shape) {
                shape.style.filter = defaultShapeFilter
                shape.style.strokeWidth = ''
              }
            }

            const handleFocus = () => {
              showTooltip()

              if (isClickable && shape) {
                shape.style.filter = 'drop-shadow(0 0 0 3px rgba(8, 145, 178, 0.35))'
              }
            }

            const handleBlur = () => {
              hideTooltip()

              if (shape) {
                shape.style.filter = defaultShapeFilter
              }
            }

            node.addEventListener('mouseenter', handleMouseEnter)
            node.addEventListener('mouseleave', handleMouseLeave)
            node.addEventListener('focus', handleFocus)
            node.addEventListener('blur', handleBlur)

            if (isClickable) {
              node.addEventListener('click', handleOpenProject)
              node.addEventListener('keydown', handleKeyDown)
            }
          }
        }
      } catch {
        if (isActive) {
          setHasError(true)
        }
      }
    }

    renderDiagram()

    return () => {
      isActive = false
      setHoveredProjectId(null)
      setTooltipPosition(null)
    }
  }, [clickableProjectIdSet, diagramDefinition, diagramId, navigate, projects])

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700">
            <FiGitBranch className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">شجرة المشاريع</h3>
            <p className="mt-0.5 text-sm text-slate-500">عرض هرمي لجميع المشاريع في المنصة من الأعلى إلى الأسفل. مرّر المؤشر على أي مشروع لعرض الوصف والمالك.</p>
          </div>
        </div>

        {!isLoading && !hasError ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {projects.length} مشروع
            </span>
            {maxDepth > 1 ? (
              <span className="inline-flex w-fit rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                {maxDepth} مستويات
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* {clickableProjectIds.length > 0 && !isLoading && !hasError && projects.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-[11px] text-slate-600">
          <span className="font-medium text-slate-700">دليل الألوان:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-md border-2 border-teal-500 bg-teal-50" aria-hidden />
            مشروع رئيسي
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-md border border-slate-300 bg-white" aria-hidden />
            مشروع فرعي
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-md border-2 border-cyan-600 bg-cyan-50" aria-hidden />
            قابل للضغط
          </span>
        </div>
      ) : null} */}

      {isLoading ? <TreeSkeleton /> : null}

      {hasError ? (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-5 text-center">
          <p className="text-sm font-medium text-red-800">تعذر تحميل شجرة المشاريع.</p>
          <p className="mt-1 text-xs text-red-700/90">تحقق من الاتصال ثم أعد المحاولة.</p>
          <button
            type="button"
            onClick={() => void loadProjects()}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-50"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {!isLoading && !hasError && projects.length === 0 ? (
        <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
            <FiGitBranch className="h-6 w-6" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">لا توجد مشاريع لعرضها في الشجرة</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">ستظهر المشاريع هنا فور إضافتها إلى المنصة.</p>
        </div>
      ) : null}

      {!isLoading && !hasError && projects.length > 0 ? (
        <div
          ref={diagramRef}
          className="project-tree-canvas relative mt-5 min-h-56 overflow-x-auto rounded-2xl border border-slate-200/80 bg-[radial-gradient(circle_at_1px_1px,#e2e8f0_1px,transparent_0)] bg-size-[20px_20px] bg-linear-to-b from-slate-50/90 to-white p-5 sm:p-8 [&_svg]:mx-auto"
          dir="ltr"
        />
      ) : null}

      {hoveredProject && tooltipPosition ? (
        <ProjectTreeTooltip project={hoveredProject} position={tooltipPosition} />
      ) : null}
    </section>
  )
}
