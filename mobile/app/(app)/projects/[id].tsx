import { Stack, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchProjectById, fetchProjectMembers } from '@/src/api/projects'
import { fetchTasks, updateTask } from '@/src/api/tasks'
import { ErrorBanner, SectionTitle, StatusPill } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { VmsProject, VmsProjectMember } from '@/src/types/projects'
import type { VmsTask } from '@/src/types/tasks'
import { taskPriorityLabel, taskStatusLabel } from '@/src/utils/labels'

const STATUS_COLUMNS: Array<{ key: VmsTask['status']; label: string; tone: 'info' | 'warning' | 'success' | 'neutral' }> = [
  { key: 'open', label: 'مفتوحة', tone: 'info' },
  { key: 'in_progress', label: 'قيد التنفيذ', tone: 'warning' },
  { key: 'completed', label: 'مكتملة', tone: 'success' },
]

function nextStatus(status: string): 'open' | 'in_progress' | 'completed' {
  if (status === 'open') return 'in_progress'
  if (status === 'in_progress') return 'completed'
  return 'open'
}

function statusLabel(status: string) {
  if (status === 'active') return 'نشط'
  if (status === 'completed') return 'مكتمل'
  if (status === 'archived') return 'مؤرشف'
  return status
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [project, setProject] = useState<VmsProject | null>(null)
  const [members, setMembers] = useState<VmsProjectMember[]>([])
  const [tasks, setTasks] = useState<VmsTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [taskError, setTaskError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setError('معرّف المشروع غير صالح.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [projectPayload, membersPayload, tasksPayload] = await Promise.all([
        fetchProjectById(id),
        fetchProjectMembers(id),
        fetchTasks({ statuses: ['open', 'in_progress', 'completed'] }),
      ])
      setProject(projectPayload.project)
      setMembers(membersPayload.projectMembers)
      setTasks(tasksPayload.tasks.filter((task) => task.projectId === id))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل المشروع.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const groupedTasks = useMemo(() => {
    const groups: Record<string, VmsTask[]> = {
      open: [],
      in_progress: [],
      completed: [],
    }

    for (const task of tasks) {
      if (groups[task.status]) {
        groups[task.status].push(task)
      }
    }

    return groups
  }, [tasks])

  const skillNames = project?.skills ? Object.keys(project.skills) : []

  const handleAdvanceTask = async (task: VmsTask) => {
    setUpdatingTaskId(task.id)
    setTaskError(null)

    try {
      const payload = await updateTask(task.id, { status: nextStatus(task.status) })
      setTasks((previous) =>
        previous.map((item) => (item.id === task.id ? payload.task : item)),
      )
    } catch (requestError) {
      setTaskError(requestError instanceof Error ? requestError.message : 'تعذر تحديث المهمة.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: project?.name ?? 'تفاصيل المشروع' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <ErrorBanner message={error} /> : null}

        {project ? (
          <>
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <StatusPill
                  label={statusLabel(project.status)}
                  tone={project.status === 'active' ? 'success' : project.status === 'completed' ? 'info' : 'neutral'}
                />
                <Text style={styles.title}>{project.name}</Text>
              </View>

              {project.description ? <Text style={styles.description}>{project.description}</Text> : null}

              <View style={styles.row}>
                <Text style={styles.label}>المالك</Text>
                <Text style={styles.value}>{project.ownerDisplayName || project.owner}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>عدد الأعضاء</Text>
                <Text style={styles.value}>{members.length.toLocaleString('en-US')}</Text>
              </View>

              {skillNames.length > 0 ? (
                <View style={styles.row}>
                  <Text style={styles.label}>المهارات</Text>
                  <Text style={styles.value}>{skillNames.join('، ')}</Text>
                </View>
              ) : null}

              {members.length > 0 ? (
                <View style={styles.membersBlock}>
                  <Text style={styles.label}>الأعضاء</Text>
                  {members.slice(0, 8).map((member) => (
                    <View key={`${member.projectId}-${member.membershipNumber}`} style={styles.memberRow}>
                      <StatusPill
                        label={
                          member.role === 'manager'
                            ? 'مدير'
                            : member.role === 'observer'
                              ? 'مراقب'
                              : 'عضو'
                        }
                        tone={member.role === 'manager' ? 'info' : 'neutral'}
                      />
                      <Text style={styles.memberName}>{member.displayName}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <SectionTitle title="لوحة المهام" subtitle="اضغط على مهمة لتحديث حالتها." />
            {taskError ? <ErrorBanner message={taskError} /> : null}

            {tasks.length === 0 ? (
              <Text style={styles.emptyTasks}>لا توجد مهام في هذا المشروع حالياً.</Text>
            ) : (
              STATUS_COLUMNS.map((column) => (
                <View key={column.key} style={styles.column}>
                  <View style={styles.columnHeader}>
                    <StatusPill label={column.label} tone={column.tone} />
                    <Text style={styles.columnCount}>{groupedTasks[column.key]?.length ?? 0}</Text>
                  </View>
                  {(groupedTasks[column.key] ?? []).map((task) => (
                    <Pressable
                      key={task.id}
                      style={styles.taskCard}
                      disabled={updatingTaskId === task.id}
                      onPress={() => void handleAdvanceTask(task)}
                    >
                      <Text style={styles.taskName}>{task.name}</Text>
                      <Text style={styles.taskMeta}>
                        {taskStatusLabel(task.status)} · {taskPriorityLabel(task.priority)}
                        {task.dueDate ? ` · ${task.dueDate.slice(0, 10)}` : ''}
                      </Text>
                      {task.subtaskProgress ? (
                        <Text style={styles.taskMeta}>
                          مهام فرعية: {task.subtaskProgress.completed}/{task.subtaskProgress.total}
                        </Text>
                      ) : null}
                      <Text style={styles.taskAction}>
                        {updatingTaskId === task.id ? 'جارٍ التحديث...' : 'اضغط لتقدّم الحالة'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'right',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  row: { gap: 4 },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  value: {
    color: colors.text,
    fontSize: 15,
    textAlign: 'right',
    lineHeight: 22,
  },
  membersBlock: { gap: 8, marginTop: 4 },
  memberRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberName: {
    flex: 1,
    color: colors.text,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
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
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
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
  taskAction: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyTasks: {
    color: colors.textMuted,
    textAlign: 'right',
    fontSize: 14,
  },
})
