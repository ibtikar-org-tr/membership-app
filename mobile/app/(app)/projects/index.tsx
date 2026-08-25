import { Link, useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { fetchDirectProjects } from '@/src/api/projects'
import { EmptyState, ErrorBanner, StatusPill } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { VmsProject } from '@/src/types/projects'

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

export default function ProjectsListScreen() {
  const [projects, setProjects] = useState<VmsProject[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    try {
      const payload = await fetchDirectProjects()
      setProjects(payload.projects)
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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return projects
    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(needle) ||
        (project.description ?? '').toLowerCase().includes(needle) ||
        (project.ownerDisplayName ?? project.owner).toLowerCase().includes(needle)
      )
    })
  }, [projects, query])

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث في المشاريع..."
          placeholderTextColor={colors.textMuted}
          style={styles.search}
        />
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
          renderItem={({ item }) => (
            <Link href={`/projects/${item.id}`} asChild>
              <Pressable style={styles.card}>
                <View style={styles.cardHeader}>
                  <StatusPill label={statusLabel(item.status)} tone={statusTone(item.status)} />
                  <Text style={styles.name}>{item.name}</Text>
                </View>
                {item.description ? (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={styles.meta}>المالك: {item.ownerDisplayName || item.owner}</Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    textAlign: 'right',
    color: colors.text,
    fontSize: 15,
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  meta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
})
