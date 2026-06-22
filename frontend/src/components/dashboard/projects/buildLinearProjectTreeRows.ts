import type { VmsProject } from '../../../types/vms'

export interface LinearProjectTreeRow {
  project: VmsProject
  depth: number
  isLast: boolean
  linePrefixes: boolean[]
}

export function buildLinearProjectTreeRows(projects: VmsProject[]): LinearProjectTreeRow[] {
  const projectIds = new Set(projects.map((project) => project.id))
  const childrenByParentId = new Map<string, VmsProject[]>()

  for (const project of projects) {
    const parentId = project.parentProjectId
    if (!parentId || !projectIds.has(parentId)) {
      continue
    }

    const siblings = childrenByParentId.get(parentId) ?? []
    siblings.push(project)
    childrenByParentId.set(parentId, siblings)
  }

  for (const siblings of childrenByParentId.values()) {
    siblings.sort((left, right) => left.name.localeCompare(right.name, 'ar'))
  }

  const roots = projects
    .filter((project) => !project.parentProjectId || !projectIds.has(project.parentProjectId))
    .sort((left, right) => left.name.localeCompare(right.name, 'ar'))

  const rows: LinearProjectTreeRow[] = []

  function visit(project: VmsProject, depth: number, linePrefixes: boolean[], isLastSibling: boolean) {
    rows.push({
      project,
      depth,
      isLast: isLastSibling,
      linePrefixes: [...linePrefixes],
    })

    const children = childrenByParentId.get(project.id) ?? []
    children.forEach((child, index) => {
      const isLast = index === children.length - 1
      visit(child, depth + 1, [...linePrefixes, !isLastSibling], isLast)
    })
  }

  roots.forEach((root, index) => {
    visit(root, 0, [], index === roots.length - 1)
  })

  return rows
}
