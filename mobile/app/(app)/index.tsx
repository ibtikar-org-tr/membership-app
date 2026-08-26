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
import { useFocusEffect, useRouter } from 'expo-router'
import { fetchEvents } from '@/src/api/events'
import { fetchDirectProjects } from '@/src/api/projects'
import { fetchStats } from '@/src/api/stats'
import { fetchTasks } from '@/src/api/tasks'
import { useAuth } from '@/src/auth/AuthContext'
import { ErrorBanner, SectionTitle } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { MemberStats } from '@/src/types/stats'

export default function HomeScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [projectsCount, setProjectsCount] = useState(0)
  const [eventsCount, setEventsCount] = useState(0)
  const [openTasksCount, setOpenTasksCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayName = useMemo(() => {
    return user?.email ?? user?.membershipNumber ?? 'عضو'
  }, [user])

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const [statsPayload, eventsPayload, projectsPayload, tasksPayload] = await Promise.all([
        fetchStats(),
        fetchEvents(),
        fetchDirectProjects(),
        fetchTasks({ statuses: ['open', 'in_progress'] }),
      ])
      setStats(statsPayload)
      setEventsCount(eventsPayload.events.filter((event) => event.status === 'public').length)
      setProjectsCount(projectsPayload.projects.length)
      setOpenTasksCount(tasksPayload.tasks.length)
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
      label: 'مشاريعي',
      value: projectsCount.toLocaleString('en-US'),
      onPress: () => router.push('/projects'),
    },
    {
      label: 'الفعاليات',
      value: eventsCount.toLocaleString('en-US'),
      onPress: () => router.push('/events'),
    },
    {
      label: 'مهامي المفتوحة',
      value: openTasksCount.toLocaleString('en-US'),
      onPress: () => router.push('/agenda'),
    },
    {
      label: 'الدول',
      value: (stats?.overview.countriesCount ?? 0).toLocaleString('en-US'),
    },
  ]

  const gender = stats?.genderDistribution

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.greeting}>مرحباً</Text>
        <Text style={styles.email}>{displayName}</Text>
        <Text style={styles.membership}>رقم العضوية: {user?.membershipNumber}</Text>
      </View>

      <View style={styles.quickLinks}>
        <Pressable style={styles.quickLink} onPress={() => router.push('/agenda')}>
          <Text style={styles.quickLinkText}>جدولي</Text>
        </Pressable>
        <Pressable style={styles.quickLink} onPress={() => router.push('/community/clubs')}>
          <Text style={styles.quickLinkText}>الأندية</Text>
        </Pressable>
        <Pressable style={styles.quickLink} onPress={() => router.push('/community')}>
          <Text style={styles.quickLinkText}>التطوع</Text>
        </Pressable>
      </View>

      <SectionTitle title="ملخص سريع" subtitle="بيانات مباشرة من الواجهة الخلفية." />

      {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.grid}>
        {cards.map((card) => (
          <Pressable
            key={card.label}
            style={styles.card}
            onPress={card.onPress}
            disabled={!card.onPress}
          >
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
          </Pressable>
        ))}
      </View>

      {gender ? (
        <View style={styles.genderCard}>
          <Text style={styles.genderTitle}>توزيع الجنس</Text>
          <View style={styles.genderRow}>
            <View style={styles.genderItem}>
              <Text style={styles.genderValue}>{gender.maleCount}</Text>
              <Text style={styles.genderLabel}>ذكور ({gender.malePercentage}%)</Text>
            </View>
            <View style={styles.genderItem}>
              <Text style={styles.genderValue}>{gender.femaleCount}</Text>
              <Text style={styles.genderLabel}>إناث ({gender.femalePercentage}%)</Text>
            </View>
          </View>
        </View>
      ) : null}
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
  quickLinks: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  quickLink: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickLinkText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
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
  genderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  genderTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'right',
  },
  genderRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  genderItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  genderValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
  },
  genderLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
})
