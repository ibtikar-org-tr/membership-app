import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import { createProjectMember, createTask, fetchProfile, fetchProjectById, fetchProjectMembers, fetchTasks, updateProject, updateTask } from '../../api/vms'
import type { VmsProject, VmsProjectMember, VmsTask } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { AddMemberModal, AddTaskModal, MembersModal, ProjectSettingsModal, TaskDetailsModal } from './project-details/ProjectDetailsModals'
import { ProjectHeader } from './project-details/ProjectHeader'
import { TaskBoard } from './project-details/TaskBoard'

export function DashboardProjectDetailsPage() {
  const { projectID } = useParams()
  const user = useMemo(() => getStoredUser(), [])
  const [project, setProject] = useState<VmsProject | null>(null)
  const [parentProjectName, setParentProjectName] = useState<string | null>(null)
  const [ownerDisplayName, setOwnerDisplayName] = useState<string | null>(null)
  const [projectTasks, setProjectTasks] = useState<VmsTask[]>([])
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)

  const [isAddingMember, setIsAddingMember] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isTaskEditMode, setIsTaskEditMode] = useState(false)
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)
  const [taskUpdateError, setTaskUpdateError] = useState<string | null>(null)
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)

  useEffect(() => {
    if (!projectID || !user) {
      return
    }

    const currentProjectId = projectID
    const currentUser = user
    const controller = new AbortController()

    async function loadProjectData() {
      try {
        const [projectPayload, tasksPayload, membersPayload] = await Promise.all([
          fetchProjectById(currentProjectId, currentUser.membershipNumber),
          fetchTasks(currentUser.membershipNumber),
          fetchProjectMembers(currentProjectId),
        ])

        if (controller.signal.aborted) {
          return
        }

        setProject(projectPayload.project)
        setProjectTasks(tasksPayload.tasks.filter((task) => task.projectId === currentProjectId))
        setProjectMembers(membersPayload.projectMembers)
      } catch {
        if (!controller.signal.aborted) {
          setNotFound(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProjectData()

    return () => {
      controller.abort()
    }
  }, [projectID, user])

  useEffect(() => {
    if (!project?.parentProjectId) {
      setParentProjectName(null)
      return
    }

    const parentId = project.parentProjectId
    let isActive = true

    async function loadParentProjectName() {
      try {
        const payload = await fetchProjectById(parentId, user?.membershipNumber)
        if (!isActive) {
          return
        }

        setParentProjectName(payload.project.name)
      } catch {
        if (isActive) {
          setParentProjectName(null)
        }
      }
    }

    loadParentProjectName()

    return () => {
      isActive = false
    }
  }, [project?.parentProjectId])

  useEffect(() => {
    if (!project?.owner) {
      setOwnerDisplayName(null)
      return
    }

    const ownerMembershipNumber = project.owner
    let isActive = true

    async function loadOwnerDisplayName() {
      try {
        const payload = await fetchProfile(ownerMembershipNumber)
        if (!isActive) {
          return
        }

        const displayName =
          payload.profile.arName?.trim() ||
          payload.profile.enName?.trim() ||
          payload.profile.membershipNumber

        setOwnerDisplayName(displayName)
      } catch {
        if (isActive) {
          setOwnerDisplayName(null)
        }
      }
    }

    loadOwnerDisplayName()

    return () => {
      isActive = false
    }
  }, [project?.owner])

  const memberOptions = useMemo(() => projectMembers, [projectMembers])
  const memberNameByMembership = useMemo(
    () => new Map(projectMembers.map((member) => [member.membershipNumber, member.displayName])),
    [projectMembers],
  )
  const memberCount = projectMembers.length
  const previewMembers = useMemo(() => projectMembers.slice(0, 4), [projectMembers])
  const hiddenMembersCount = Math.max(0, projectMembers.length - previewMembers.length)

  const boardColumns = useMemo(
    () => [
      { key: 'open', label: 'مفتوحة', items: projectTasks.filter((task) => task.status === 'open') },
      { key: 'in_progress', label: 'قيد التنفيذ', items: projectTasks.filter((task) => task.status === 'in_progress') },
      { key: 'completed', label: 'مكتملة', items: projectTasks.filter((task) => task.status === 'completed') },
      { key: 'archived', label: 'مؤرشفة', items: projectTasks.filter((task) => task.status === 'archived') },
    ],
    [projectTasks],
  )

  const selectedTask = useMemo(
    () => (selectedTaskId ? projectTasks.find((task) => task.id === selectedTaskId) ?? null : null),
    [projectTasks, selectedTaskId],
  )

  const projectManagerMembershipNumbers = useMemo(
    () => new Set(projectMembers.filter((member) => member.role === 'manager').map((member) => member.membershipNumber)),
    [projectMembers],
  )
  const canManageProjectMembers = useMemo(() => {
    if (!project || !user) {
      return false
    }

    const currentMembershipNumber = user.membershipNumber
    return project.owner === currentMembershipNumber || projectManagerMembershipNumbers.has(currentMembershipNumber)
  }, [project, projectManagerMembershipNumbers, user])
  const canManageProject = canManageProjectMembers
  const canCreateTask = useMemo(() => {
    if (!project || !user) {
      return false
    }

    if (project.owner === user.membershipNumber) {
      return true
    }

    return projectMembers.some((member) => member.membershipNumber === user.membershipNumber)
  }, [project, projectMembers, user])

  const canEditSelectedTask = useMemo(() => {
    if (!selectedTask || !project || !user) {
      return false
    }

    const currentMembershipNumber = user.membershipNumber
    return (
      selectedTask.assignedTo === currentMembershipNumber ||
      project.owner === currentMembershipNumber ||
      projectManagerMembershipNumbers.has(currentMembershipNumber)
    )
  }, [project, projectManagerMembershipNumbers, selectedTask, user])

  const formatAssignee = (membershipNumber: string | null) => {
    if (!membershipNumber) {
      return 'غير مسند'
    }

    return memberNameByMembership.get(membershipNumber) ?? membershipNumber
  }

  const closeTaskDetails = () => {
    setIsTaskEditMode(false)
    setTaskUpdateError(null)
    setSelectedTaskId(null)
  }

  const handleUpdateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError(null)

    if (!projectID || !project || !user) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? project.status).trim()
    const status = statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'active'

    if (!name) {
      setSaveError('يرجى إدخال اسم المشروع.')
      return
    }

    setIsSaving(true)

    try {
      const payload = await updateProject(projectID, {
        name,
        ...(description ? { description } : {}),
        status,
      }, user.membershipNumber)
      setProject(payload.project)
      setIsProjectSettingsOpen(false)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSaveError(requestError.message)
      } else {
        setSaveError('تعذر تحديث المشروع.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTaskError(null)
    const form = event.currentTarget

    if (!projectID) {
      return
    }

    if (!user) {
      setTaskError('يجب تسجيل الدخول لإضافة مهمة.')
      return
    }

    if (!canCreateTask) {
      setTaskError('إضافة المهام متاحة فقط لأعضاء المشروع المباشرين.')
      return
    }

    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? 'open').trim()
    const status =
      statusRaw === 'in_progress' || statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'open'
    const dueDateRaw = String(formData.get('dueDate') ?? '').trim()
    const pointsRawValue = String(formData.get('points') ?? '').trim()
    const pointsRaw = pointsRawValue === '' ? 1 : Number(pointsRawValue)
    const assignedTo = String(formData.get('assignedTo') ?? '').trim()

    if (!name) {
      setTaskError('يرجى إدخال اسم المهمة.')
      return
    }

    if (Number.isNaN(pointsRaw) || pointsRaw < 1) {
      setTaskError('يجب أن تكون النقاط 1 على الأقل.')
      return
    }

    setIsCreatingTask(true)

    const currentUser = user

    try {
      const payload = await createTask({
        projectId: projectID,
        name,
        description: description || undefined,
        createdBy: currentUser.membershipNumber,
        status,
        dueDate: dueDateRaw ? new Date(dueDateRaw).toISOString() : undefined,
        points: Math.max(1, Math.trunc(pointsRaw)),
        assignedTo: assignedTo || undefined,
      }, currentUser.membershipNumber)

      setProjectTasks((previous) => [payload.task, ...previous])
      form.reset()
      setIsAddTaskOpen(false)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setTaskError(requestError.message)
      } else {
        setTaskError('تعذر إنشاء المهمة.')
      }
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMemberError(null)
    const form = event.currentTarget

    if (!projectID) {
      return
    }

    if (!user || !canManageProjectMembers) {
      setMemberError('إضافة أعضاء المشروع متاحة فقط لمالك المشروع أو مديريه.')
      return
    }

    const formData = new FormData(form)
    const membershipNumber = String(formData.get('membershipNumber') ?? '').trim()
    const roleRaw = String(formData.get('role') ?? 'member').trim()
    const role = roleRaw === 'manager' || roleRaw === 'observer' ? roleRaw : 'member'

    if (!membershipNumber) {
      setMemberError('يرجى إدخال رقم العضوية.')
      return
    }

    if (projectMembers.some((member) => member.membershipNumber === membershipNumber)) {
      setMemberError('هذا العضو مضاف بالفعل إلى المشروع.')
      return
    }

    setIsAddingMember(true)

    try {
      const payload = await createProjectMember({
        projectId: projectID,
        membershipNumber,
        role,
      }, user.membershipNumber)

      if (payload.projectMember) {
        setProjectMembers((previous) => [payload.projectMember, ...previous])
      }

      form.reset()
      setIsAddMemberOpen(false)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setMemberError(requestError.message)
      } else {
        setMemberError('تعذر إضافة العضو.')
      }
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleUpdateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTaskUpdateError(null)

    if (!selectedTask || !canEditSelectedTask || !user) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? selectedTask.status).trim()
    const status =
      statusRaw === 'in_progress' || statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'open'
    const dueDateRaw = String(formData.get('dueDate') ?? '').trim()
    const pointsRawValue = String(formData.get('points') ?? '').trim()
    const pointsRaw = pointsRawValue === '' ? selectedTask.points : Number(pointsRawValue)
    const assignedTo = String(formData.get('assignedTo') ?? '').trim()

    if (!name) {
      setTaskUpdateError('يرجى إدخال اسم المهمة.')
      return
    }

    if (Number.isNaN(pointsRaw) || pointsRaw < 1) {
      setTaskUpdateError('يجب أن تكون النقاط 1 على الأقل.')
      return
    }

    const currentUser = user

    setIsUpdatingTask(true)

    try {
      const payload = await updateTask(selectedTask.id, {
        name,
        description: description || undefined,
        status,
        dueDate: dueDateRaw ? new Date(dueDateRaw).toISOString() : selectedTask.dueDate ?? undefined,
        points: Math.max(1, Math.trunc(pointsRaw)),
        assignedTo: assignedTo || undefined,
      }, currentUser.membershipNumber)

      setProjectTasks((previous) => previous.map((task) => (task.id === payload.task.id ? payload.task : task)))
      setIsTaskEditMode(false)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setTaskUpdateError(requestError.message)
      } else {
        setTaskUpdateError('تعذر تحديث المهمة.')
      }
    } finally {
      setIsUpdatingTask(false)
    }
  }

  if (!projectID || notFound) {
    return <Navigate to="/dashboard/projects" replace />
  }

  if (isLoading || !project) {
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل تفاصيل المشروع...</p>
      </section>
    )
  }

  return (
    <section className="w-full space-y-3">
      <ProjectHeader
        project={project}
        parentProjectName={parentProjectName}
        ownerDisplayName={ownerDisplayName}
        ownerFallbackName={formatAssignee(project.owner)}
        memberCount={memberCount}
        projectMembers={projectMembers}
        previewMembers={previewMembers}
        hiddenMembersCount={hiddenMembersCount}
        canCreateTask={canCreateTask}
        canManageProject={canManageProject}
        onOpenAddTask={() => setIsAddTaskOpen(true)}
        eventsPath={`/dashboard/projects/${project.id}/events`}
        subProjectsPath={`/dashboard/projects/${project.id}/sub-projects`}
        onOpenMembers={() => setIsMembersOpen(true)}
        onOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
      >
        <TaskBoard
          boardColumns={boardColumns}
          onOpenTask={(taskId) => setSelectedTaskId(taskId)}
          formatAssignee={formatAssignee}
        />
      </ProjectHeader>

      {selectedTask ? (
        <TaskDetailsModal
          selectedTask={selectedTask}
          canEditSelectedTask={canEditSelectedTask}
          isTaskEditMode={isTaskEditMode}
          isUpdatingTask={isUpdatingTask}
          taskUpdateError={taskUpdateError}
          memberOptions={memberOptions}
          formatAssignee={formatAssignee}
          onClose={closeTaskDetails}
          onToggleEditMode={() => {
            setTaskUpdateError(null)
            setIsTaskEditMode((previous) => !previous)
          }}
          onCancelEdit={() => {
            setTaskUpdateError(null)
            setIsTaskEditMode(false)
          }}
          onUpdateTask={handleUpdateTask}
        />
      ) : null}

      {isProjectSettingsOpen ? (
        <ProjectSettingsModal
          project={project}
          isSaving={isSaving}
          saveError={saveError}
          onClose={() => setIsProjectSettingsOpen(false)}
          onSubmit={handleUpdateProject}
        />
      ) : null}

      {isAddTaskOpen ? (
        <AddTaskModal
          isCreatingTask={isCreatingTask}
          taskError={taskError}
          memberOptions={memberOptions}
          onClose={() => setIsAddTaskOpen(false)}
          onSubmit={handleCreateTask}
        />
      ) : null}

      {isAddMemberOpen ? (
        <AddMemberModal
          isAddingMember={isAddingMember}
          memberError={memberError}
          memberOptions={memberOptions}
          canManageProjectMembers={canManageProjectMembers}
          onClose={() => setIsAddMemberOpen(false)}
          onSubmit={handleAddMember}
        />
      ) : null}

      {isMembersOpen ? (
        <MembersModal
          projectMembers={projectMembers}
          canManageProjectMembers={canManageProjectMembers}
          onClose={() => setIsMembersOpen(false)}
          onOpenAddMember={() => {
            if (!canManageProjectMembers) {
              return
            }
            setIsMembersOpen(false)
            setIsAddMemberOpen(true)
          }}
        />
      ) : null}
    </section>
  )
}
