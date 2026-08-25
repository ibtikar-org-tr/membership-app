import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { fetchEvents } from '@/src/api/events'
import { fetchStats } from '@/src/api/stats'
import { useAuth } from '@/src/auth/AuthContext'
import { colors } from '@/src/theme/colors'
import type { MemberStats } from '@/src/types/stats'

export default function HomeScreen() {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [eventsCount, setEventsCount] = useState(0)
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
      const [statsPayload, eventsPayload] = await Promise.all([fetchStats(), fetchEvents()])
      setStats(statsPayload)
      setEventsCount(eventsPayload.events.length)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل البيانات.')
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

  const cards = [
    {
      label: 'إجمالي الأعضاء',
      value: (stats?.overview.totalMembers ?? 0).toLocaleString('en-US'),
    },
    {
      label: 'نشطون على التلغرام',
      value: (stats?.overview.telegramActive ?? 0).toLocaleString('en-US'),
    },
    {
      label: 'الفعاليات',
      value: eventsCount.toLocaleString('en-US'),
    },
    {
      label: 'الدول',
      value: (stats?.overview.countriesCount ?? 0).toLocaleString('en-US'),
    },
  ]

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.greeting}>مرحباً</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.membership}>رقم العضوية: {user?.membershipNumber}</Text>
        <Pressable onPress={() => void signOut()} style={styles.logout}>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>ملخص سريع</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.label} style={styles.card}>
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 20,
    padding: 20,
    gap: 6,
  },
  greeting: {
    color: '#a5f3fc',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  email: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  membership: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'right',
  },
  logout: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  cardValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
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
