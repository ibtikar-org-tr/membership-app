import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import {
  createTask,
  createTaskSubtask,
  deleteTaskSubtask,
  fetchProjectMemberContact,
  fetchProjectById,
  fetchProjectMembers,
  fetchTaskSubtasks,
  fetchTasks,
  leaveProject,
  remindTask,
  removeProjectMember,
  requestTelegramGroupInvite,
  updateProject,
  updateProjectMemberRole,
  updateTask,
  updateTaskSubtask,
} from '../../api/vms'
import type { VmsProject, VmsProjectMember, VmsTask, VmsTaskSubtask } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import {
  AddTaskModal,
  LeaveProjectConfirmModal,
  MembersModal,
  ProjectSettingsModal,
  RemoveProjectMemberConfirmModal,
} from '../../components/dashboard/project-details/ProjectDetailsModals'
import { MemberInfoModal } from '../../components/dashboard/project-details/MemberInfoModal'
import { TaskDetailsModal } from '../../components/dashboard/project-details/TaskDetailsModal'
import { ProjectHeader } from '../../components/dashboard/project-details/ProjectHeader'
import { TaskBoard } from '../../components/dashboard/project-details/TaskBoard'
import { UnallowedAccessPage } from './UnallowedAccessPage'

export function DashboardProjectDetailsPage() {
  const { projectID } = useParams()
  const navigate = useNavigate()
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

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)
  const [isRemindingTask, setIsRemindingTask] = useState(false)
  const [taskUpdateError, setTaskUpdateError] = useState<string | null>(null)
  const [taskRemindError, setTaskRemindError] = useState<string | null>(null)
  const [taskRemindSuccess, setTaskRemindSuccess] = useState<string | null>(null)
  const [selectedTaskSubtasks, setSelectedTaskSubtasks] = useState<VmsTaskSubtask[]>([])
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false)
  const [isManagingSubtasks, setIsManagingSubtasks] = useState(false)
  const [subtaskError, setSubtaskError] = useState<string | null>(null)
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [memberInfoTarget, setMemberInfoTarget] = useState<VmsProjectMember | null>(null)
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)
  const [isLeavingProject, setIsLeavingProject] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [memberPendingRemoval, setMemberPendingRemoval] = useState<VmsProjectMember | null>(null)
  const [isRemovingMember, setIsRemovingMember] = useState(false)
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null)
  const [removingMembershipNumber, setRemovingMembershipNumber] = useState<string | null>(null)
  const [updatingRoleMembershipNumber, setUpdatingRoleMembershipNumber] = useState<string | null>(null)
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null)
  const [telegramInviteError, setTelegramInviteError] = useState<string | null>(null)
  const [telegramInviteSuccess, setTelegramInviteSuccess] = useState<string | null>(null)
  const [isSendingTelegramInvite, setIsSendingTelegramInvite] = useState(false)

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
    if (!project?.owner || !project.id) {
      setOwnerDisplayName(null)
      return
    }

    const ownerMembershipNumber = project.owner
    const currentProjectId = project.id
    let isActive = true

    async function loadOwnerDisplayName() {
      try {
        const payload = await fetchProjectMemberContact(currentProjectId, ownerMembershipNumber)
        if (!isActive) {
          return
        }

        const displayName =
          payload.contact.arName?.trim() ||
          payload.contact.enName?.trim() ||
          payload.contact.membershipNumber

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
  }, [project?.id, project?.owner])

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
  const isProjectOwner = useMemo(() => {
    if (!project || !user) {
      return false
    }

    return project.owner === user.membershipNumber
  }, [project, user])
  const isProjectMember = useMemo(() => {
    if (!user) {
      return false
    }

    return projectMembers.some((member) => member.membershipNumber === user.membershipNumber)
  }, [projectMembers, user])
  const canLeaveProject = isProjectMember && !isProjectOwner
  const ownershipTransferOptions = useMemo(
    () => projectMembers.filter((member) => member.membershipNumber !== project?.owner),
    [projectMembers, project?.owner],
  )
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

  const canRemindSelectedTask = useMemo(() => {
    if (!selectedTask || !canManageProjectMembers) {
      return false
    }

    const assignee = selectedTask.assignedTo?.trim()
    if (!assignee) {
      return false
    }

    return selectedTask.status === 'open' || selectedTask.status === 'in_progress'
  }, [canManageProjectMembers, selectedTask])

  const formatAssignee = (membershipNumber: string | null) => {
    if (!membershipNumber) {
      return 'غير مسند'
    }

    return memberNameByMembership.get(membershipNumber) ?? membershipNumber
  }

  useEffect(() => {
    setTaskRemindError(null)
    setTaskRemindSuccess(null)
    setSubtaskError(null)
  }, [selectedTaskId])

  useEffect(() => {
    if (!selectedTaskId) {
      setSelectedTaskSubtasks([])
      setIsLoadingSubtasks(false)
      return
    }

    const currentTaskId = selectedTaskId
    const controller = new AbortController()

    async function loadSubtasks() {
      setIsLoadingSubtasks(true)
      setSubtaskError(null)

      try {
        const payload = await fetchTaskSubtasks(currentTaskId)
        if (!controller.signal.aborted) {
          setSelectedTaskSubtasks(payload.subtasks)
        }
      } catch {
        if (!controller.signal.aborted) {
          setSelectedTaskSubtasks([])
          setSubtaskError('تعذر تحميل المهام الفرعية.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSubtasks(false)
        }
      }
    }

    void loadSubtasks()

    return () => {
      controller.abort()
    }
  }, [selectedTaskId])

  function subtaskProgressFromList(subtasks: VmsTaskSubtask[]) {
    if (subtasks.length === 0) {
      return null
    }

    return {
      completed: subtasks.filter((subtask) => subtask.status === 'completed').length,
      total: subtasks.length,
    }
  }

  function syncParentSubtaskProgress(taskId: string, subtasks: VmsTaskSubtask[]) {
    const progress = subtaskProgressFromList(subtasks)
    setProjectTasks((previous) =>
      previous.map((task) => (task.id === taskId ? { ...task, subtaskProgress: progress } : task)),
    )
  }

  const closeTaskDetails = () => {
    setTaskUpdateError(null)
    setTaskRemindError(null)
    setTaskRemindSuccess(null)
    setSubtaskError(null)
    setSelectedTaskSubtasks([])
    setSelectedTaskId(null)
  }

  const handleRemindTask = async () => {
    setTaskRemindError(null)
    setTaskRemindSuccess(null)

    if (!selectedTask || !user?.membershipNumber || !canRemindSelectedTask) {
      return
    }

    setIsRemindingTask(true)

    try {
      const payload = await remindTask(selectedTask.id, user.membershipNumber)
      setProjectTasks((previous) =>
        previous.map((task) =>
          task.id === payload.task.id
            ? { ...payload.task, subtaskProgress: task.subtaskProgress ?? null }
            : task,
        ),
      )
      setTaskRemindSuccess('تم إرسال التذكير إلى المكلّف عبر تيليجرام.')
    } catch (requestError) {
      if (requestError instanceof Error) {
        setTaskRemindError(requestError.message)
      } else {
        setTaskRemindError('تعذر إرسال التذكير.')
      }
    } finally {
      setIsRemindingTask(false)
    }
  }

  const handleUpdateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError(null)

    if (!projectID || !project || !user) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const transferOwnerTo = String(formData.get('transferOwnerTo') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const telegramGroupId = String(formData.get('telegramGroupId') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? project.status).trim()
    const status = statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'active'
    const skillsRaw = String(formData.get('skills') ?? '').trim()
    let skills
    if (skillsRaw) {
      try {
        const parsed = JSON.parse(skillsRaw)
        skills = typeof parsed === 'object' && parsed !== null ? parsed : undefined
      } catch {
        skills = Object.fromEntries(
          skillsRaw
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => [item, 'required']),
        )
      }
    }

    if (!name) {
      setSaveError('يرجى إدخال اسم المشروع.')
      return
    }

    setIsSaving(true)

    try {
      const payload = await updateProject(projectID, {
        name,
        ...(transferOwnerTo ? { owner: transferOwnerTo } : {}),
        ...(description ? { description } : {}),
        ...(telegramGroupId ? { telegramGroupId } : {}),
        status,
        ...(skills ? { skills } : {}),
      }, user.membershipNumber)
      setProject(payload.project)
      const membersPayload = await fetchProjectMembers(projectID)
      setProjectMembers(membersPayload.projectMembers)
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
    const priorityRaw = String(formData.get('priority') ?? 'medium').trim()
    const priority =
      priorityRaw === 'high' || priorityRaw === 'low' || priorityRaw === 'medium' ? priorityRaw : 'medium'
    const dueDateRaw = String(formData.get('dueDate') ?? '').trim()
    const pointsRawValue = String(formData.get('points') ?? '').trim()
    const pointsRaw = pointsRawValue === '' ? 1 : Number(pointsRawValue)
    const assignedTo = String(formData.get('assignedTo') ?? '').trim()
    const skillsRaw = String(formData.get('skills') ?? '').trim()
    const skills = skillsRaw
      ? Object.fromEntries(
          skillsRaw
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => [item, 'required']),
        )
      : undefined

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
        priority,
        dueDate: dueDateRaw ? new Date(dueDateRaw).toISOString() : undefined,
        points: Math.max(1, Math.trunc(pointsRaw)),
        assignedTo: assignedTo || undefined,
        ...(skills ? { skills } : {}),
      }, currentUser.membershipNumber)

      setProjectTasks((previous) => [{ ...payload.task, subtaskProgress: null }, ...previous])
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


  const handleUpdateTask = async (
    patch: Partial<{
      name: string
      description: string
      status: 'open' | 'in_progress' | 'completed' | 'archived'
      priority: 'low' | 'medium' | 'high'
      dueDate: string
      points: number
      assignedTo: string
    }>,
  ) => {
    setTaskUpdateError(null)

    if (!selectedTask || !canEditSelectedTask || !user) {
      throw new Error('لا يمكن تحديث المهمة في الوقت الحالي.')
    }

    const payload: Partial<{
      name: string
      description: string
      status: 'open' | 'in_progress' | 'completed' | 'archived'
      priority: 'low' | 'medium' | 'high'
      dueDate: string
      points: number
      assignedTo: string
    }> = {}

    if (patch.name !== undefined) {
      const nextName = patch.name.trim()
      if (!nextName) {
        setTaskUpdateError('يرجى إدخال اسم المهمة.')
        throw new Error('يرجى إدخال اسم المهمة.')
      }
      payload.name = nextName
    }

    if (patch.description !== undefined) {
      payload.description = patch.description.trim() || undefined
    }

    if (patch.status !== undefined) {
      payload.status = patch.status
    }

    if (patch.priority !== undefined) {
      payload.priority = patch.priority
    }

    if (patch.points !== undefined) {
      if (Number.isNaN(patch.points) || patch.points < 1) {
        setTaskUpdateError('يجب أن تكون النقاط 1 على الأقل.')
        throw new Error('يجب أن تكون النقاط 1 على الأقل.')
      }

      payload.points = Math.max(1, Math.trunc(patch.points))
    }

    if (patch.dueDate !== undefined) {
      payload.dueDate = patch.dueDate
    }

    if (patch.assignedTo !== undefined) {
      payload.assignedTo = patch.assignedTo
    }

    if (Object.keys(payload).length === 0) {
      return
    }

    const currentUser = user

    setIsUpdatingTask(true)

    try {
      const response = await updateTask(selectedTask.id, payload, currentUser.membershipNumber)

      setProjectTasks((previous) =>
        previous.map((task) =>
          task.id === response.task.id
            ? { ...response.task, subtaskProgress: task.subtaskProgress ?? null }
            : task,
        ),
      )
    } catch (requestError) {
      if (requestError instanceof Error) {
        setTaskUpdateError(requestError.message)
        throw requestError
      } else {
        const fallbackError = new Error('تعذر تحديث المهمة.')
        setTaskUpdateError(fallbackError.message)
        throw fallbackError
      }
    } finally {
      setIsUpdatingTask(false)
    }
  }

  const handleCreateSubtask = async (name: string) => {
    if (!selectedTask || !canEditSelectedTask) {
      return
    }

    setSubtaskError(null)
    setIsManagingSubtasks(true)

    try {
      const response = await createTaskSubtask(selectedTask.id, { name })
      const nextSubtasks = [...selectedTaskSubtasks, response.subtask]
      setSelectedTaskSubtasks(nextSubtasks)
      syncParentSubtaskProgress(selectedTask.id, nextSubtasks)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSubtaskError(requestError.message)
      } else {
        setSubtaskError('تعذر إضافة المهمة الفرعية.')
      }
    } finally {
      setIsManagingSubtasks(false)
    }
  }

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    if (!selectedTask || !canEditSelectedTask) {
      return
    }

    setSubtaskError(null)
    setIsManagingSubtasks(true)

    try {
      const response = await updateTaskSubtask(selectedTask.id, subtaskId, {
        status: completed ? 'completed' : 'open',
      })
      const nextSubtasks = selectedTaskSubtasks.map((subtask) =>
        subtask.id === subtaskId ? response.subtask : subtask,
      )
      setSelectedTaskSubtasks(nextSubtasks)
      syncParentSubtaskProgress(selectedTask.id, nextSubtasks)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSubtaskError(requestError.message)
      } else {
        setSubtaskError('تعذر تحديث المهمة الفرعية.')
      }
    } finally {
      setIsManagingSubtasks(false)
    }
  }

  const handleRenameSubtask = async (subtaskId: string, name: string) => {
    if (!selectedTask || !canEditSelectedTask) {
      return
    }

    setSubtaskError(null)
    setIsManagingSubtasks(true)

    try {
      const response = await updateTaskSubtask(selectedTask.id, subtaskId, { name })
      const nextSubtasks = selectedTaskSubtasks.map((subtask) =>
        subtask.id === subtaskId ? response.subtask : subtask,
      )
      setSelectedTaskSubtasks(nextSubtasks)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSubtaskError(requestError.message)
      } else {
        setSubtaskError('تعذر إعادة تسمية المهمة الفرعية.')
      }
    } finally {
      setIsManagingSubtasks(false)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!selectedTask || !canEditSelectedTask) {
      return
    }

    setSubtaskError(null)
    setIsManagingSubtasks(true)

    try {
      await deleteTaskSubtask(selectedTask.id, subtaskId)
      const nextSubtasks = selectedTaskSubtasks.filter((subtask) => subtask.id !== subtaskId)
      setSelectedTaskSubtasks(nextSubtasks)
      syncParentSubtaskProgress(selectedTask.id, nextSubtasks)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSubtaskError(requestError.message)
      } else {
        setSubtaskError('تعذر حذف المهمة الفرعية.')
      }
    } finally {
      setIsManagingSubtasks(false)
    }
  }

  const handleRemoveProjectMember = async () => {
    setRemoveMemberError(null)

    if (!projectID || !user || !memberPendingRemoval) {
      return
    }

    const targetMembershipNumber = memberPendingRemoval.membershipNumber
    setIsRemovingMember(true)
    setRemovingMembershipNumber(targetMembershipNumber)

    try {
      await removeProjectMember(projectID, targetMembershipNumber, user.membershipNumber)
      const membersPayload = await fetchProjectMembers(projectID)
      setProjectMembers(membersPayload.projectMembers)
      setMemberPendingRemoval(null)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setRemoveMemberError(requestError.message)
      } else {
        setRemoveMemberError('تعذر إزالة العضو من المشروع.')
      }
    } finally {
      setIsRemovingMember(false)
      setRemovingMembershipNumber(null)
    }
  }

  const handleChangeMemberRole = async (member: VmsProjectMember, role: 'member' | 'manager') => {
    setRoleUpdateError(null)

    if (!projectID || !user || !isProjectOwner) {
      return
    }

    setUpdatingRoleMembershipNumber(member.membershipNumber)

    try {
      const response = await updateProjectMemberRole(projectID, member.membershipNumber, role)
      setProjectMembers((previous) =>
        previous.map((item) =>
          item.membershipNumber === response.projectMember.membershipNumber ? response.projectMember : item,
        ),
      )
    } catch (requestError) {
      if (requestError instanceof Error) {
        setRoleUpdateError(requestError.message)
      } else {
        setRoleUpdateError('تعذر تحديث دور العضو.')
      }
    } finally {
      setUpdatingRoleMembershipNumber(null)
    }
  }

  const handleLeaveProject = async () => {
    setLeaveError(null)

    if (!projectID || !user) {
      return
    }

    setIsLeavingProject(true)

    try {
      await leaveProject(projectID, user.membershipNumber)
      navigate('/dashboard/projects', { replace: true })
    } catch (requestError) {
      if (requestError instanceof Error) {
        setLeaveError(requestError.message)
      } else {
        setLeaveError('تعذر مغادرة المشروع.')
      }
    } finally {
      setIsLeavingProject(false)
    }
  }

  const handleSendTelegramInvite = async () => {
    setTelegramInviteError(null)
    setTelegramInviteSuccess(null)

    if (!project?.telegramGroupId || !user?.membershipNumber) {
      return
    }

    setIsSendingTelegramInvite(true)
    try {
      await requestTelegramGroupInvite(user.membershipNumber, {
        resourceType: 'project',
        resourceId: project.id,
      })
      setTelegramInviteSuccess('تم إرسال دعوة مجموعة التلغرام عبر البوت.')
    } catch (requestError) {
      if (requestError instanceof Error) {
        setTelegramInviteError(requestError.message)
      } else {
        setTelegramInviteError('تعذر إرسال دعوة مجموعة التلغرام.')
      }
    } finally {
      setIsSendingTelegramInvite(false)
    }
  }

  if (!projectID) {
    return <Navigate to="/dashboard/projects" replace />
  }

  if (notFound) {
    return <UnallowedAccessPage />
  }

  if (isLoading || !project) {
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل تفاصيل المشروع...</p>
      </section>
    )
  }

  const telegramInviteFeedback = telegramInviteError ?? telegramInviteSuccess

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
        clubsPath={`/dashboard/projects/${project.id}/clubs`}
        positionsPath={`/dashboard/projects/${project.id}/positions`}
        notesPath={`/dashboard/projects/${project.id}/notes`}
        subProjectsPath={`/dashboard/projects/${project.id}/sub-projects`}
        onOpenMembers={() => setIsMembersOpen(true)}
        onOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
        showTelegramInvite={Boolean(project.telegramGroupId)}
        isSendingTelegramInvite={isSendingTelegramInvite}
        onSendTelegramInvite={() => void handleSendTelegramInvite()}
        telegramInviteFeedback={telegramInviteFeedback}
        telegramInviteFeedbackIsError={Boolean(telegramInviteError)}
        canLeaveProject={canLeaveProject}
        onLeaveProject={() => {
          setLeaveError(null)
          setIsLeaveConfirmOpen(true)
        }}
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
          canRemindTask={canRemindSelectedTask}
          isUpdatingTask={isUpdatingTask}
          isRemindingTask={isRemindingTask}
          taskUpdateError={taskUpdateError}
          taskRemindError={taskRemindError}
          taskRemindSuccess={taskRemindSuccess}
          memberOptions={memberOptions}
          formatAssignee={formatAssignee}
          subtasks={selectedTaskSubtasks}
          isLoadingSubtasks={isLoadingSubtasks}
          isManagingSubtasks={isManagingSubtasks}
          subtaskError={subtaskError}
          onClose={closeTaskDetails}
          onUpdateTask={handleUpdateTask}
          onRemindTask={handleRemindTask}
          onCreateSubtask={handleCreateSubtask}
          onToggleSubtask={handleToggleSubtask}
          onRenameSubtask={handleRenameSubtask}
          onDeleteSubtask={handleDeleteSubtask}
        />
      ) : null}

      {isProjectSettingsOpen ? (
        <ProjectSettingsModal
          project={project}
          isProjectOwner={isProjectOwner}
          ownershipTransferOptions={ownershipTransferOptions}
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

      {isMembersOpen ? (
        <MembersModal
          projectMembers={projectMembers}
          projectOwnerMembershipNumber={project.owner}
          actorMembershipNumber={user?.membershipNumber ?? null}
          canManageMembers={canManageProjectMembers}
          isProjectOwner={isProjectOwner}
          removingMembershipNumber={removingMembershipNumber}
          updatingRoleMembershipNumber={updatingRoleMembershipNumber}
          roleUpdateError={roleUpdateError}
          onSelectMember={(member) => setMemberInfoTarget(member)}
          onRequestRemove={(member) => {
            setRemoveMemberError(null)
            setMemberPendingRemoval(member)
          }}
          onChangeMemberRole={(member, role) => void handleChangeMemberRole(member, role)}
          onClose={() => {
            if (!isRemovingMember && !updatingRoleMembershipNumber) {
              setIsMembersOpen(false)
              setMemberPendingRemoval(null)
              setRemoveMemberError(null)
              setRoleUpdateError(null)
            }
          }}
        />
      ) : null}

      {memberInfoTarget ? (
        <MemberInfoModal
          projectId={project.id}
          membershipNumber={memberInfoTarget.membershipNumber}
          displayName={memberInfoTarget.displayName}
          onClose={() => setMemberInfoTarget(null)}
        />
      ) : null}

      {memberPendingRemoval ? (
        <RemoveProjectMemberConfirmModal
          memberDisplayName={memberPendingRemoval.displayName}
          membershipNumber={memberPendingRemoval.membershipNumber}
          isRemoving={isRemovingMember}
          removeError={removeMemberError}
          onClose={() => {
            if (!isRemovingMember) {
              setMemberPendingRemoval(null)
              setRemoveMemberError(null)
            }
          }}
          onConfirm={() => void handleRemoveProjectMember()}
        />
      ) : null}

      {isLeaveConfirmOpen ? (
        <LeaveProjectConfirmModal
          projectName={project.name}
          isLeaving={isLeavingProject}
          leaveError={leaveError}
          onClose={() => {
            if (!isLeavingProject) {
              setIsLeaveConfirmOpen(false)
              setLeaveError(null)
            }
          }}
          onConfirm={() => void handleLeaveProject()}
        />
      ) : null}
    </section>
  )
}
