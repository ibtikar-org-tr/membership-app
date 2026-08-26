import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchAgenda } from '@/src/api/agenda'
import { EmptyState, ErrorBanner, SectionTitle, StatusPill } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { AgendaEventItem, AgendaTaskItem } from '@/src/types/agenda'
import {
  formatAgendaDayLabel,
  getMonthRange,
  shiftMonth,
  toDateKey,
} from '@/src/utils/agenda'
import { taskPriorityLabel, taskStatusLabel } from '@/src/utils/labels'

type DayGroup = {
  dateKey: string
  tasks: AgendaTaskItem[]
  events: AgendaEventItem[]
}

function groupAgendaByDay(tasks: AgendaTaskItem[], events: AgendaEventItem[]): DayGroup[] {
  const map = new Map<string, DayGroup>()

  for (const task of tasks) {
    if (!task.dueDate || task.status === 'completed' || task.status === 'archived') continue
    const dateKey = toDateKey(task.dueDate)
    const group = map.get(dateKey) ?? { dateKey, tasks: [], events: [] }
    group.tasks.push(task)
    map.set(dateKey, group)
  }

  for (const event of events) {
    if (!event.startTime) continue
    const dateKey = toDateKey(event.startTime)
    const group = map.get(dateKey) ?? { dateKey, tasks: [], events: [] }
    group.events.push(event)
    map.set(dateKey, group)
  }

  return Array.from(map.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey))
}

export default function AgendaScreen() {
  const router = useRouter()
  const [monthDate, setMonthDate] = useState(() => new Date())
  const [tasks, setTasks] = useState<AgendaTaskItem[]>([])
  const [events, setEvents] = useState<AgendaEventItem[]>([])
  const [unscheduledTasks, setUnscheduledTasks] = useState<AgendaTaskItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const monthRange = useMemo(() => getMonthRange(monthDate), [monthDate])
  const dayGroups = useMemo(() => groupAgendaByDay(tasks, events), [tasks, events])

  const load = useCallback(
    async (refreshing = false) => {
      if (refreshing) setIsRefreshing(true)
      else setIsLoading(true)
      setError(null)

      try {
        const payload = await fetchAgenda({
          from: monthRange.from,
          to: monthRange.to,
          includeUnscheduled: true,
        })
        setTasks(payload.tasks)
        setEvents(payload.events)
        setUnscheduledTasks(payload.unscheduledTasks)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل الجدول.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [monthRange.from, monthRange.to],
  )

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} />}
    >
      <SectionTitle
        title="جدولي"
        subtitle="مهامك وفعالياتك خلال الشهر المحدد."
      />

      <View style={styles.monthNav}>
        <Pressable style={styles.monthButton} onPress={() => setMonthDate((prev) => shiftMonth(prev, 1))}>
          <Text style={styles.monthButtonText}>التالي ›</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{monthRange.label}</Text>
        <Pressable style={styles.monthButton} onPress={() => setMonthDate((prev) => shiftMonth(prev, -1))}>
          <Text style={styles.monthButtonText}>‹ السابق</Text>
        </Pressable>
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!isLoading && !error ? (
        <>
          {dayGroups.length === 0 ? (
            <EmptyState message="لا توجد مهام أو فعاليات مجدولة لهذا الشهر." />
          ) : (
            dayGroups.map((group) => (
              <View key={group.dateKey} style={styles.dayCard}>
                <Text style={styles.dayTitle}>{formatAgendaDayLabel(group.dateKey)}</Text>

                {group.events.map((event) => (
                  <Pressable
                    key={`event-${event.id}`}
                    style={styles.itemCard}
                    onPress={() => router.push(`/events/${event.id}`)}
                  >
                    <View style={styles.itemHeader}>
                      <StatusPill label="فعالية" tone="info" />
                      <Text style={styles.itemTitle}>{event.name}</Text>
                    </View>
                    {event.projectName ? (
                      <Text style={styles.itemMeta}>{event.projectName}</Text>
                    ) : null}
                  </Pressable>
                ))}

                {group.tasks.map((task) => (
                  <Pressable
                    key={`task-${task.id}`}
                    style={styles.itemCard}
                    onPress={() => router.push(`/projects/${task.projectId}`)}
                  >
                    <View style={styles.itemHeader}>
                      <StatusPill label="مهمة" tone="warning" />
                      <Text style={styles.itemTitle}>{task.name}</Text>
                    </View>
                    <Text style={styles.itemMeta}>
                      {task.projectName || 'مشروع'} · {taskStatusLabel(task.status)} ·{' '}
                      {taskPriorityLabel(task.priority)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))
          )}

          {unscheduledTasks.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>مهام بدون موعد</Text>
              {unscheduledTasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={styles.itemCard}
                  onPress={() => router.push(`/projects/${task.projectId}`)}
                >
                  <Text style={styles.itemTitle}>{task.name}</Text>
                  <Text style={styles.itemMeta}>
                    {task.projectName || 'مشروع'} · {taskStatusLabel(task.status)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  monthNav: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  monthButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  monthButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  monthLabel: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  dayTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'right',
  },
  itemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  itemHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'right',
    fontSize: 14,
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  block: { gap: 10, marginTop: 4 },
  blockTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'right',
  },
})
