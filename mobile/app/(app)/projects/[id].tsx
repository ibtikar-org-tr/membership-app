import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { fetchEvents } from '@/src/api/events'
import {
  fetchProjectById,
  fetchProjectClubs,
  fetchProjectMemberContact,
  fetchProjectMembers,
  fetchProjectNotes,
  fetchProjectPositions,
  fetchProjects,
  leaveProject,
  requestTelegramGroupInvite,
} from '@/src/api/projects'
import {
  createTask,
  fetchTaskSubtasks,
  fetchTasks,
  updateTask,
  updateTaskSubtask,
} from '@/src/api/tasks'
import { useAuth } from '@/src/auth/AuthContext'
import {
  ProjectHero,
  ProjectSectionNav,
  type ProjectSection,
} from '@/src/components/projects/ProjectHub'
import { EmptyState, ErrorBanner, StatusPill } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { VmsClub } from '@/src/types/clubs'
import type { VmsPosition } from '@/src/types/community'
import type { VmsEvent } from '@/src/types/events'
import type {
  VmsProject,
  VmsProjectMember,
  VmsProjectMemberContact,
  VmsProjectNote,
} from '@/src/types/projects'
import type { VmsTask, VmsTaskSubtask } from '@/src/types/tasks'
import { formatEventDateShort } from '@/src/utils/format'
import { taskPriorityLabel, taskStatusLabel } from '@/src/utils/labels'

const TASK_COLUMNS: Array<{ key: VmsTask['status']; label: string; tone: 'info' | 'warning' | 'success' }> = [
  { key: 'open', label: 'مفتوحة', tone: 'info' },
  { key: 'in_progress', label: 'قيد التنفيذ', tone: 'warning' },
  { key: 'completed', label: 'مكتملة', tone: 'success' },
]

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [project, setProject] = useState<VmsProject | null>(null)
  const [allProjects, setAllProjects] = useState<VmsProject[]>([])
  const [members, setMembers] = useState<VmsProjectMember[]>([])
  const [tasks, setTasks] = useState<VmsTask[]>([])
  const [events, setEvents] = useState<VmsEvent[]>([])
  const [clubs, setClubs] = useState<VmsClub[]>([])
  const [positions, setPositions] = useState<VmsPosition[]>([])
  const [notes, setNotes] = useState<VmsProjectNote[]>([])
  const [activeSection, setActiveSection] = useState<ProjectSection>('tasks')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [newTaskName, setNewTaskName] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const [selectedTask, setSelectedTask] = useState<VmsTask | null>(null)
  const [taskSubtasks, setTaskSubtasks] = useState<VmsTaskSubtask[]>([])
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false)

  const [selectedMember, setSelectedMember] = useState<VmsProjectMember | null>(null)
  const [memberContact, setMemberContact] = useState<VmsProjectMemberContact | null>(null)
  const [isLoadingContact, setIsLoadingContact] = useState(false)

  const [isLeaving, setIsLeaving] = useState(false)
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setError('معرّف المشروع غير صالح.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [
        projectPayload,
        membersPayload,
        tasksPayload,
        eventsPayload,
        clubsPayload,
        positionsPayload,
        notesPayload,
        projectsPayload,
      ] = await Promise.all([
        fetchProjectById(id),
        fetchProjectMembers(id),
        fetchTasks({ statuses: ['open', 'in_progress', 'completed'] }),
        fetchEvents(),
        fetchProjectClubs(id),
        fetchProjectPositions(id),
        fetchProjectNotes(id),
        fetchProjects(),
      ])

      setProject(projectPayload.project)
      setMembers(membersPayload.projectMembers)
      setTasks(tasksPayload.tasks.filter((task) => task.projectId === id))
      setEvents(eventsPayload.events.filter((event) => event.projectId === id))
      setClubs(clubsPayload.clubs)
      setPositions(positionsPayload.positions)
      setNotes(notesPayload.projectNotes)
      setAllProjects(projectsPayload.projects)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل المشروع.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const parentProject = useMemo(() => {
    if (!project?.parentProjectId) return null
    return allProjects.find((item) => item.id === project.parentProjectId) ?? null
  }, [allProjects, project?.parentProjectId])

  const childProjects = useMemo(() => {
    if (!id) return []
    return allProjects.filter((item) => item.parentProjectId === id)
  }, [allProjects, id])

  const myMembership = useMemo(
    () => members.find((member) => member.membershipNumber === user?.membershipNumber),
    [members, user?.membershipNumber],
  )

  const canCreateTask = Boolean(myMembership)
  const canLeave = Boolean(
    project &&
      user?.membershipNumber &&
      project.owner !== user.membershipNumber &&
      myMembership,
  )

  const openTasksCount = tasks.filter(
    (task) => task.status === 'open' || task.status === 'in_progress',
  ).length

  const groupedTasks = useMemo(() => {
    const groups: Record<string, VmsTask[]> = {
      open: [],
      in_progress: [],
      completed: [],
    }
    for (const task of tasks) {
      if (groups[task.status]) groups[task.status].push(task)
    }
    return groups
  }, [tasks])

  const handleCreateTask = async () => {
    if (!id || !user?.membershipNumber || !newTaskName.trim()) return

    setIsCreatingTask(true)
    setActionError(null)

    try {
      const payload = await createTask({
        projectId: id,
        name: newTaskName.trim(),
        createdBy: user.membershipNumber,
        status: 'open',
        priority: 'medium',
      })
      setTasks((previous) => [payload.task, ...previous])
      setNewTaskName('')
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'تعذر إنشاء المهمة.')
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleUpdateTaskStatus = async (
    task: VmsTask,
    status: 'open' | 'in_progress' | 'completed',
  ) => {
    setUpdatingTaskId(task.id)
    setActionError(null)

    try {
      const payload = await updateTask(task.id, { status })
      setTasks((previous) => previous.map((item) => (item.id === task.id ? payload.task : item)))
      setSelectedTask((previous) => (previous?.id === task.id ? payload.task : previous))
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'تعذر تحديث المهمة.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const openTaskModal = async (task: VmsTask) => {
    setSelectedTask(task)
    setIsLoadingSubtasks(true)
    setTaskSubtasks([])

    try {
      const payload = await fetchTaskSubtasks(task.id)
      setTaskSubtasks(payload.subtasks)
    } catch {
      setTaskSubtasks([])
    } finally {
      setIsLoadingSubtasks(false)
    }
  }

  const handleToggleSubtask = async (subtask: VmsTaskSubtask) => {
    if (!selectedTask) return

    const nextStatus = subtask.status === 'completed' ? 'open' : 'completed'
    try {
      const payload = await updateTaskSubtask(selectedTask.id, subtask.id, { status: nextStatus })
      setTaskSubtasks((previous) =>
        previous.map((item) => (item.id === subtask.id ? payload.subtask : item)),
      )
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'تعذر تحديث المهمة الفرعية.')
    }
  }

  const openMemberContact = async (member: VmsProjectMember) => {
    if (!id) return
    setSelectedMember(member)
    setMemberContact(null)
    setIsLoadingContact(true)

    try {
      const payload = await fetchProjectMemberContact(id, member.membershipNumber)
      setMemberContact(payload.contact)
    } catch {
      setMemberContact(null)
    } finally {
      setIsLoadingContact(false)
    }
  }

  const handleTelegramInvite = async () => {
    if (!project) return
    setIsSendingInvite(true)
    setInviteMessage(null)

    try {
      const payload = await requestTelegramGroupInvite({
        resourceType: 'project',
        resourceId: project.id,
      })
      setInviteMessage(payload.detail ?? 'تم إرسال الدعوة عبر بوت التلغرام.')
    } catch (requestError) {
      setInviteMessage(requestError instanceof Error ? requestError.message : 'تعذر إرسال الدعوة.')
    } finally {
      setIsSendingInvite(false)
    }
  }

  const handleLeaveProject = () => {
    if (!id || !user?.membershipNumber) return

    Alert.alert('مغادرة المشروع', 'هل أنت متأكد من مغادرة هذا المشروع؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'مغادرة',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setIsLeaving(true)
            setActionError(null)
            try {
              await leaveProject(id, user.membershipNumber)
              router.replace('/projects')
            } catch (requestError) {
              setActionError(
                requestError instanceof Error ? requestError.message : 'تعذر مغادرة المشروع.',
              )
            } finally {
              setIsLeaving(false)
            }
          })()
        },
      },
    ])
  }

  const renderTasksSection = () => (
    <View style={styles.section}>
      {canCreateTask ? (
        <View style={styles.createTaskRow}>
          <TextInput
            value={newTaskName}
            onChangeText={setNewTaskName}
            placeholder="مهمة جديدة..."
            placeholderTextColor={colors.textMuted}
            style={styles.createTaskInput}
            textAlign="right"
          />
          <Pressable
            style={[styles.createTaskButton, isCreatingTask && styles.disabled]}
            disabled={isCreatingTask || !newTaskName.trim()}
            onPress={() => void handleCreateTask()}
          >
            <Text style={styles.createTaskButtonText}>{isCreatingTask ? '...' : 'إضافة'}</Text>
          </Pressable>
        </View>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState message="لا توجد مهام في هذا المشروع." />
      ) : (
        TASK_COLUMNS.map((column) => (
          <View key={column.key} style={styles.column}>
            <View style={styles.columnHeader}>
              <StatusPill label={column.label} tone={column.tone} />
              <Text style={styles.columnCount}>{groupedTasks[column.key]?.length ?? 0}</Text>
            </View>
            {(groupedTasks[column.key] ?? []).map((task) => (
              <Pressable
                key={task.id}
                style={styles.taskCard}
                onPress={() => void openTaskModal(task)}
              >
                <Text style={styles.taskName}>{task.name}</Text>
                <Text style={styles.taskMeta}>
                  {taskPriorityLabel(task.priority)}
                  {task.dueDate ? ` · ${task.dueDate.slice(0, 10)}` : ''}
                </Text>
                {task.subtaskProgress ? (
                  <Text style={styles.taskMeta}>
                    فرعية: {task.subtaskProgress.completed}/{task.subtaskProgress.total}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ))
      )}
    </View>
  )

  const renderEventsSection = () => (
    <View style={styles.section}>
      {events.length === 0 ? (
        <EmptyState message="لا توجد فعاليات مرتبطة بهذا المشروع." />
      ) : (
        events.map((event) => (
          <Pressable
            key={event.id}
            style={styles.listCard}
            onPress={() => router.push(`/events/${event.id}`)}
          >
            <Text style={styles.listTitle}>{event.name}</Text>
            <Text style={styles.listMeta}>{formatEventDateShort(event.startTime)}</Text>
            <StatusPill
              label={event.status === 'public' ? 'عامة' : event.status}
              tone={event.status === 'public' ? 'success' : 'neutral'}
            />
          </Pressable>
        ))
      )}
    </View>
  )

  const renderClubsSection = () => (
    <View style={styles.section}>
      {clubs.length === 0 ? (
        <EmptyState message="لا توجد أندية في هذا المشروع." />
      ) : (
        clubs.map((club) => (
          <Pressable
            key={club.id}
            style={styles.listCard}
            onPress={() => router.push(`/community/clubs/${club.id}`)}
          >
            <Text style={styles.listTitle}>{club.name}</Text>
            {club.description ? (
              <Text style={styles.listMeta} numberOfLines={2}>
                {club.description}
              </Text>
            ) : null}
          </Pressable>
        ))
      )}
    </View>
  )

  const renderPositionsSection = () => (
    <View style={styles.section}>
      {positions.length === 0 ? (
        <EmptyState message="لا توجد فرص تطوعية في هذا المشروع." />
      ) : (
        positions.map((position) => (
          <View key={position.id} style={styles.listCard}>
            <Text style={styles.listTitle}>{position.name}</Text>
            {position.description ? (
              <Text style={styles.listMeta} numberOfLines={2}>
                {position.description}
              </Text>
            ) : null}
            <Text style={styles.listMeta}>
              المقاعد: {position.acceptedApplicationsCount}/{position.seats}
            </Text>
          </View>
        ))
      )}
    </View>
  )

  const renderMembersSection = () => (
    <View style={styles.section}>
      {members.map((member) => (
        <Pressable
          key={member.membershipNumber}
          style={styles.memberCard}
          onPress={() => void openMemberContact(member)}
        >
          <StatusPill
            label={
              member.role === 'owner'
                ? 'مالك'
                : member.role === 'manager'
                  ? 'مدير'
                  : member.role === 'observer'
                    ? 'مراقب'
                    : 'عضو'
            }
            tone={member.role === 'owner' || member.role === 'manager' ? 'info' : 'neutral'}
          />
          <Text style={styles.memberName}>{member.displayName}</Text>
        </Pressable>
      ))}
    </View>
  )

  const renderChildrenSection = () => (
    <View style={styles.section}>
      {childProjects.length === 0 ? (
        <EmptyState message="لا توجد مشاريع فرعية." />
      ) : (
        childProjects.map((child) => (
          <Pressable
            key={child.id}
            style={styles.listCard}
            onPress={() => router.push(`/projects/${child.id}`)}
          >
            <Text style={styles.listTitle}>{child.name}</Text>
            <StatusPill
              label={
                child.status === 'active'
                  ? 'نشط'
                  : child.status === 'completed'
                    ? 'مكتمل'
                    : child.status === 'archived'
                      ? 'مؤرشف'
                      : child.status
              }
              tone={
                child.status === 'active'
                  ? 'success'
                  : child.status === 'completed'
                    ? 'info'
                    : 'neutral'
              }
            />
          </Pressable>
        ))
      )}
    </View>
  )

  const renderNotesSection = () => (
    <View style={styles.section}>
      {notes.length === 0 ? (
        <EmptyState message="لا توجد ملاحظات في هذا المشروع." />
      ) : (
        notes.map((note) => (
          <View key={note.id} style={styles.listCard}>
            <Text style={styles.listTitle}>{note.title}</Text>
            <Text style={styles.listMeta}>
              {note.createdByDisplayName ?? note.createdBy} · {note.updatedAt.slice(0, 10)}
            </Text>
            <Text style={styles.notePreview}>
              {note.contentPreview ?? note.content.slice(0, 180)}
            </Text>
          </View>
        ))
      )}
    </View>
  )

  const sectionContent: Record<ProjectSection, () => React.ReactNode> = {
    tasks: renderTasksSection,
    events: renderEventsSection,
    clubs: renderClubsSection,
    positions: renderPositionsSection,
    members: renderMembersSection,
    children: renderChildrenSection,
    notes: renderNotesSection,
  }

  return (
    <>
      <Stack.Screen options={{ title: project?.name ?? 'تفاصيل المشروع' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {actionError ? <ErrorBanner message={actionError} /> : null}

        {project ? (
          <>
            <ProjectHero
              project={project}
              parentProjectName={parentProject?.name ?? null}
              members={members}
              openTasksCount={openTasksCount}
              canLeave={canLeave}
              isLeaving={isLeaving}
              isSendingInvite={isSendingInvite}
              inviteMessage={inviteMessage}
              onLeave={handleLeaveProject}
              onTelegramInvite={() => void handleTelegramInvite()}
            />

            <ProjectSectionNav active={activeSection} onChange={setActiveSection} />
            {sectionContent[activeSection]()}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(selectedTask)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedTask ? (
              <>
                <Text style={styles.modalTitle}>{selectedTask.name}</Text>
                {selectedTask.description ? (
                  <Text style={styles.modalBody}>{selectedTask.description}</Text>
                ) : null}
                <Text style={styles.modalMeta}>
                  {taskStatusLabel(selectedTask.status)} · {taskPriorityLabel(selectedTask.priority)}
                </Text>

                <View style={styles.statusButtons}>
                  {(['open', 'in_progress', 'completed'] as const).map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.statusButton,
                        selectedTask.status === status && styles.statusButtonActive,
                      ]}
                      disabled={updatingTaskId === selectedTask.id}
                      onPress={() => void handleUpdateTaskStatus(selectedTask, status)}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          selectedTask.status === status && styles.statusButtonTextActive,
                        ]}
                      >
                        {taskStatusLabel(status)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.subtasksTitle}>المهام الفرعية</Text>
                {isLoadingSubtasks ? (
                  <ActivityIndicator color={colors.primary} />
                ) : taskSubtasks.length === 0 ? (
                  <Text style={styles.modalMeta}>لا توجد مهام فرعية.</Text>
                ) : (
                  taskSubtasks.map((subtask) => (
                    <Pressable
                      key={subtask.id}
                      style={styles.subtaskRow}
                      onPress={() => void handleToggleSubtask(subtask)}
                    >
                      <StatusPill
                        label={subtask.status === 'completed' ? 'مكتملة' : 'مفتوحة'}
                        tone={subtask.status === 'completed' ? 'success' : 'neutral'}
                      />
                      <Text style={styles.subtaskName}>{subtask.name}</Text>
                    </Pressable>
                  ))
                )}

                <Pressable style={styles.closeButton} onPress={() => setSelectedTask(null)}>
                  <Text style={styles.closeButtonText}>إغلاق</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(selectedMember)} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedMember ? (
              <>
                <Text style={styles.modalTitle}>{selectedMember.displayName}</Text>
                {isLoadingContact ? (
                  <ActivityIndicator color={colors.primary} />
                ) : memberContact ? (
                  <View style={styles.contactBlock}>
                    <Text style={styles.contactRow}>البريد: {memberContact.email}</Text>
                    {memberContact.phoneNumber ? (
                      <Pressable onPress={() => void Linking.openURL(`tel:${memberContact.phoneNumber}`)}>
                        <Text style={styles.contactLink}>الهاتف: {memberContact.phoneNumber}</Text>
                      </Pressable>
                    ) : null}
                    {memberContact.telegramUsername ? (
                      <Text style={styles.contactRow}>تلغرام: @{memberContact.telegramUsername}</Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.modalMeta}>تعذر تحميل بيانات التواصل.</Text>
                )}
                <Pressable
                  style={styles.closeButton}
                  onPress={() => {
                    setSelectedMember(null)
                    setMemberContact(null)
                  }}
                >
                  <Text style={styles.closeButtonText}>إغلاق</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 40, gap: 14 },
  section: { gap: 10 },
  column: { gap: 8 },
  columnHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  columnCount: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  createTaskRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
  },
  createTaskInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  createTaskButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createTaskButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  taskName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'right',
  },
  taskMeta: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },
  listTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'right',
  },
  listMeta: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
  },
  notePreview: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  memberCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  memberName: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'right',
  },
  disabled: { opacity: 0.7 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
  },
  modalBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  modalMeta: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  statusButtons: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  subtasksTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 4,
  },
  subtaskRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  subtaskName: {
    flex: 1,
    color: colors.text,
    textAlign: 'right',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  contactBlock: { gap: 8 },
  contactRow: {
    color: colors.text,
    textAlign: 'right',
    fontSize: 14,
  },
  contactLink: {
    color: colors.primary,
    textAlign: 'right',
    fontWeight: '700',
    fontSize: 14,
  },
})
