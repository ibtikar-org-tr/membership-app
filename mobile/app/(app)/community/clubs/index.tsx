import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchClubsDashboard } from '@/src/api/clubs'
import { EmptyState, ErrorBanner, SectionTitle, StatusPill } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { VmsClubDashboard } from '@/src/types/clubs'
import { joinPolicyLabel } from '@/src/utils/labels'

function ClubCard({ club, onPress }: { club: VmsClubDashboard; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {club.imageUrl ? (
        <Image source={{ uri: club.imageUrl }} style={styles.banner} resizeMode="cover" />
      ) : null}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <StatusPill label={club.isJoined ? 'منضم' : 'اكتشف'} tone={club.isJoined ? 'success' : 'info'} />
          <Text style={styles.cardTitle}>{club.name}</Text>
        </View>
        {club.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {club.description}
          </Text>
        ) : null}
        <Text style={styles.cardMeta}>
          {club.projectName || 'مشروع'} · {club.membersCount} عضو · {joinPolicyLabel(club.joinPolicy)}
        </Text>
        {club.country ? <Text style={styles.cardMeta}>{club.country}{club.region ? ` · ${club.region}` : ''}</Text> : null}
      </View>
    </Pressable>
  )
}

export default function ClubsScreen() {
  const router = useRouter()
  const [clubs, setClubs] = useState<VmsClubDashboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { joined, discover } = useMemo(() => {
    const publicClubs = clubs.filter((club) => club.visibility === 'public')
    return {
      joined: publicClubs.filter((club) => club.isJoined),
      discover: publicClubs.filter((club) => !club.isJoined),
    }
  }, [clubs])

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    try {
      const payload = await fetchClubsDashboard()
      setClubs(payload.clubs)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل الأندية.')
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
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} />}
    >
      <SectionTitle title="الأندية" subtitle="الأندية العامة التي انضممت إليها أو يمكنك اكتشافها." />

      {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!isLoading && !error ? (
        <>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>أنديتي ({joined.length})</Text>
            {joined.length === 0 ? (
              <EmptyState message="لم تنضم إلى أي نادي بعد." />
            ) : (
              joined.map((club) => (
                <ClubCard key={club.id} club={club} onPress={() => router.push(`/community/clubs/${club.id}`)} />
              ))
            )}
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>اكتشف أندية ({discover.length})</Text>
            {discover.length === 0 ? (
              <EmptyState message="لا توجد أندية جديدة للاكتشاف حالياً." />
            ) : (
              discover.map((club) => (
                <ClubCard key={club.id} club={club} onPress={() => router.push(`/community/clubs/${club.id}`)} />
              ))
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  block: { gap: 10 },
  blockTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'right',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  banner: {
    width: '100%',
    height: 120,
    backgroundColor: '#e2e8f0',
  },
  cardBody: { padding: 14, gap: 8 },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'right',
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
})
