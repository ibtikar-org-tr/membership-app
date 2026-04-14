import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

interface ProjectHierarchyTreeProps {
  clickableProjectIds?: string[]
}

export function ProjectHierarchyTree({ clickableProjectIds = [] }: ProjectHierarchyTreeProps) {
  const [projects, setProjects] = useState<VmsProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const diagramRef = useRef<HTMLDivElement | null>(null)
  const diagramId = useId().replace(/:/g, '_')
  const user = useMemo(() => getStoredUser(), [])
  const navigate = useNavigate()
  const clickableProjectIdSet = useMemo(() => new Set(clickableProjectIds), [clickableProjectIds])

  useEffect(() => {
    const controller = new AbortController()

    async function loadProjects() {
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
    }

    loadProjects()

    return () => {
      controller.abort()
    }
  }, [user?.membershipNumber])

  const diagramDefinition = useMemo(() => {
    if (projects.length === 0) {
      return ''
    }

    const projectNodes = new Map(projects.map((project) => [project.id, toMermaidNodeId(project.id)]))
    const lines = ['flowchart TD', '  root["كل المشاريع"]']

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
      } else {
        lines.push(`  root --> ${nodeId}`)
      }
    }

    return lines.join('\n')
  }, [projects])

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
          theme: 'neutral',
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
          },
        })

        const { svg } = await mermaid.render(`${diagramId}-diagram`, diagramDefinition)

        if (isActive && diagramRef.current) {
          diagramRef.current.innerHTML = svg

          for (const projectId of clickableProjectIdSet) {
            const nodeId = toMermaidNodeId(projectId)
            const escapedNodeId = escapeAttributeValue(nodeId)
            const node = diagramRef.current.querySelector<SVGGElement>(
              `g.node[id="${escapedNodeId}"], g.node[id*="${escapedNodeId}"], g[id="${escapedNodeId}"], g[id*="${escapedNodeId}"]`,
            )

            if (!node) {
              continue
            }

            node.style.cursor = 'pointer'
            node.setAttribute('tabindex', '0')
            node.setAttribute('role', 'link')
            node.setAttribute('aria-label', 'فتح تفاصيل المشروع')

            const handleOpenProject = () => {
              navigate(`/dashboard/projects/${projectId}`)
            }

            const handleKeyDown = (event: Event) => {
              const keyboardEvent = event as KeyboardEvent
              if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                keyboardEvent.preventDefault()
                handleOpenProject()
              }
            }

            node.addEventListener('click', handleOpenProject)
            node.addEventListener('keydown', handleKeyDown)
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
    }
  }, [clickableProjectIdSet, diagramDefinition, diagramId, navigate])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">شجرة المشاريع</h3>
          <p className="mt-1 text-sm text-slate-500">عرض هرمي لجميع المشاريع في المنصة.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {projects.length} مشروع
        </span>
      </div>

      {isLoading ? <p className="mt-4 text-sm text-slate-500">جار تحميل شجرة المشاريع...</p> : null}
      {!isLoading && hasError ? <p className="mt-4 text-sm text-red-600">تعذر تحميل شجرة المشاريع.</p> : null}
      {!isLoading && !hasError && projects.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">لا توجد مشاريع لعرضها في الشجرة.</p>
      ) : null}

      {!isLoading && !hasError ? (
        <div
          ref={diagramRef}
          className="mt-4 overflow-x-auto rounded-lg border border-slate-100 bg-slate-50 p-4"
          dir="ltr"
        />
      ) : null}
    </section>
  )
}
