import { Link, useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchDirectProjects } from '@/src/api/projects'
import { fetchTasks } from '@/src/api/tasks'
import { EmptyState, ErrorBanner, SearchField, StatusPill } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { VmsProject } from '@/src/types/projects'

type StatusFilter = 'all' | 'active' | 'completed' | 'archived'

function statusLabel(status: string) {
  if (status === 'active') return 'نشط'
  if (status === 'completed') return 'مكتمل'
  if (status === 'archived') return 'مؤرشف'
  return status
}

function statusTone(status: string): 'success' | 'info' | 'neutral' {
  if (status === 'active') return 'success'
  if (status === 'completed') return 'info'
  return 'neutral'
}

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'completed', label: 'مكتمل' },
  { key: 'archived', label: 'مؤرشف' },
]

export default function ProjectsListScreen() {
  const [projects, setProjects] = useState<VmsProject[]>([])
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    try {
      const [projectsPayload, tasksPayload] = await Promise.all([
        fetchDirectProjects(),
        fetchTasks({ statuses: ['open', 'in_progress'] }),
      ])

      const counts: Record<string, number> = {}
      for (const task of tasksPayload.tasks) {
        counts[task.projectId] = (counts[task.projectId] ?? 0) + 1
      }

      setProjects(projectsPayload.projects)
      setTaskCounts(counts)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل المشاريع.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return projects.filter((project) => {
      if (statusFilter !== 'all' && project.status !== statusFilter) return false
      if (!needle) return true
      return (
        project.name.toLowerCase().includes(needle) ||
        (project.description ?? '').toLowerCase().includes(needle) ||
        (project.ownerDisplayName ?? project.owner).toLowerCase().includes(needle)
      )
    })
  }, [projects, query, statusFilter])

  const stats = useMemo(() => {
    const active = projects.filter((project) => project.status === 'active').length
    const openTasks = Object.values(taskCounts).reduce((sum, count) => sum + count, 0)
    return { total: projects.length, active, openTasks }
  }, [projects, taskCounts])

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>مشاريع</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>نشطة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.openTasks}</Text>
            <Text style={styles.statLabel}>مهام مفتوحة</Text>
          </View>
        </View>

        <SearchField value={query} onChangeText={setQuery} placeholder="ابحث في المشاريع..." />

        <View style={styles.filters}>
          {FILTERS.map((filter) => (
            <Pressable
              key={filter.key}
              style={[styles.filterPill, statusFilter === filter.key && styles.filterPillActive]}
              onPress={() => setStatusFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} />}
          ListHeaderComponent={error ? <ErrorBanner message={error} /> : null}
          ListEmptyComponent={!error ? <EmptyState message="لا توجد مشاريع حالياً." /> : null}
          renderItem={({ item }) => {
            const parent = item.parentProjectId ? projectById.get(item.parentProjectId) : null
            const openCount = taskCounts[item.id] ?? 0
            const skillNames = item.skills ? Object.keys(item.skills).slice(0, 3) : []

            return (
              <Link href={`/projects/${item.id}`} asChild>
                <Pressable style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardBadges}>
                      <StatusPill label={statusLabel(item.status)} tone={statusTone(item.status)} />
                      {openCount > 0 ? (
                        <StatusPill label={`${openCount} مهمة`} tone="warning" />
                      ) : null}
                    </View>
                    <Text style={styles.name}>{item.name}</Text>
                  </View>

                  {parent ? (
                    <Text style={styles.parentText}>ضمن: {parent.name}</Text>
                  ) : null}

                  {item.description ? (
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  {skillNames.length > 0 ? (
                    <Text style={styles.skills}>{skillNames.join(' · ')}</Text>
                  ) : null}

                  <Text style={styles.meta}>المالك: {item.ownerDisplayName || item.owner}</Text>
                </Pressable>
              </Link>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 2,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
    fontWeight: '600',
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
  },
  filters: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    gap: 8,
  },
  cardBadges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
  },
  parentText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  skills: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
  },
  meta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
})
