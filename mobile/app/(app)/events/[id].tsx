import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchEventById } from '@/src/api/events'
import { ErrorBanner, StatusPill } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { VmsEvent } from '@/src/types/events'
import {
  formatEventDate,
  formatEventLocation,
  isEventUpcomingOrOngoing,
} from '@/src/utils/format'

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
        if (!cancelled) setEvent(payload.event)
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل الفعالية.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const links = useMemo(() => {
    if (!event?.associatedUrls || typeof event.associatedUrls !== 'object') {
      return [] as Array<{ label: string; url: string }>
    }

    return Object.entries(event.associatedUrls)
      .map(([label, value]) => ({
        label,
        url: typeof value === 'string' ? value : String(value ?? ''),
      }))
      .filter((item) => item.url.startsWith('http'))
  }, [event])

  const skillNames = event?.skills ? Object.keys(event.skills) : []
  const upcoming = event ? isEventUpcomingOrOngoing(event) : false

  return (
    <>
      <Stack.Screen options={{ title: event?.name ?? 'تفاصيل الفعالية' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <ErrorBanner message={error} /> : null}

        {event ? (
          <View style={styles.card}>
            {event.imageUrl ? (
              <Image source={{ uri: event.imageUrl }} style={styles.banner} resizeMode="cover" />
            ) : null}

            <View style={styles.headerRow}>
              <StatusPill label={upcoming ? 'قادمة / جارية' : 'منتهية'} tone={upcoming ? 'success' : 'neutral'} />
              <StatusPill
                label={event.status === 'public' ? 'عامة' : event.status === 'draft' ? 'مسودة' : event.status}
                tone={event.status === 'public' ? 'info' : 'warning'}
              />
            </View>

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

            {skillNames.length > 0 ? (
              <View style={styles.row}>
                <Text style={styles.label}>المهارات</Text>
                <Text style={styles.value}>{skillNames.join('، ')}</Text>
              </View>
            ) : null}

            {event.description ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.label}>الوصف</Text>
                <Text style={styles.description}>{event.description}</Text>
              </View>
            ) : null}

            {links.length > 0 ? (
              <View style={styles.linksBlock}>
                <Text style={styles.label}>روابط مرتبطة</Text>
                {links.map((link) => (
                  <Pressable key={`${link.label}-${link.url}`} onPress={() => void Linking.openURL(link.url)}>
                    <Text style={styles.link}>{link.label || link.url}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 32 },
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
  headerRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
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
  descriptionBlock: { marginTop: 4, gap: 6 },
  description: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
  },
  linksBlock: { gap: 8 },
  link: {
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'right',
    fontSize: 14,
  },
})
