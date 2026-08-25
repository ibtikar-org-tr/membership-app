import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchEventById } from '@/src/api/events'
import { colors } from '@/src/theme/colors'
import type { VmsEvent } from '@/src/types/events'
import { formatEventDate, formatEventLocation } from '@/src/utils/format'

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [event, setEvent] = useState<VmsEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) {
        setError('معرّف الفعالية غير صالح.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const payload = await fetchEventById(id)
        if (!cancelled) {
          setEvent(payload.event)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل الفعالية.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <>
      <Stack.Screen options={{ title: event?.name ?? 'تفاصيل الفعالية' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {event ? (
          <View style={styles.card}>
            {event.imageUrl ? (
              <Image source={{ uri: event.imageUrl }} style={styles.banner} resizeMode="cover" />
            ) : null}

            <Text style={styles.title}>{event.name}</Text>

            <View style={styles.row}>
              <Text style={styles.label}>البداية</Text>
              <Text style={styles.value}>{formatEventDate(event.startTime)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>النهاية</Text>
              <Text style={styles.value}>{formatEventDate(event.endTime)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>الموقع</Text>
              <Text style={styles.value}>{formatEventLocation(event)}</Text>
            </View>

            {event.address ? (
              <View style={styles.row}>
                <Text style={styles.label}>العنوان</Text>
                <Text style={styles.value}>{event.address}</Text>
              </View>
            ) : null}

            {event.projectName ? (
              <View style={styles.row}>
                <Text style={styles.label}>المشروع</Text>
                <Text style={styles.value}>{event.projectName}</Text>
              </View>
            ) : null}

            {event.description ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.label}>الوصف</Text>
                <Text style={styles.description}>{event.description}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    overflow: 'hidden',
  },
  banner: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'right',
  },
  row: {
    gap: 4,
  },
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
  descriptionBlock: {
    marginTop: 4,
    gap: 6,
  },
  description: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
  },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
    textAlign: 'right',
    overflow: 'hidden',
  },
})
