import { Link, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchEvents } from '@/src/api/events'
import { colors } from '@/src/theme/colors'
import type { VmsEvent } from '@/src/types/events'
import { formatEventDate, formatEventLocation } from '@/src/utils/format'

export default function EventsListScreen() {
  const [events, setEvents] = useState<VmsEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const payload = await fetchEvents()
      const sorted = [...payload.events].sort((a, b) => {
        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0
        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0
        return bTime - aTime
      })
      setEvents(sorted)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل الفعاليات.')
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

  return (
    <View style={styles.flex}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} />}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          ListEmptyComponent={
            !error ? <Text style={styles.empty}>لا توجد فعاليات حالياً.</Text> : null
          }
          renderItem={({ item }) => (
            <Link href={`/events/${item.id}`} asChild>
              <Pressable style={styles.card}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{formatEventDate(item.startTime)}</Text>
                <Text style={styles.meta}>{formatEventLocation(item)}</Text>
                {item.projectName ? <Text style={styles.project}>{item.projectName}</Text> : null}
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'right',
  },
  project: {
    marginTop: 4,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
    textAlign: 'right',
    marginBottom: 8,
    overflow: 'hidden',
  },
})
