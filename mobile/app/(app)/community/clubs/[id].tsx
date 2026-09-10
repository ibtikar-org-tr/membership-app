import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchClubById, fetchClubMembers, joinClub } from '@/src/api/clubs'
import { useAuth } from '@/src/auth/AuthContext'
import { ErrorBanner, StatusPill } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { VmsClub, VmsClubMember } from '@/src/types/clubs'
import { joinPolicyLabel } from '@/src/utils/labels'

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const [club, setClub] = useState<VmsClub | null>(null)
  const [members, setMembers] = useState<VmsClubMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const myMembership = user?.membershipNumber
    ? members.find((member) => member.membershipNumber === user.membershipNumber)
    : undefined

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) {
        setError('معرّف النادي غير صالح.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const [clubPayload, membersPayload] = await Promise.all([
          fetchClubById(id),
          fetchClubMembers(id),
        ])
        if (!cancelled) {
          setClub(clubPayload.club)
          setMembers(membersPayload.clubMembers)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل النادي.')
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

  const handleJoin = async () => {
    if (!id || !user?.membershipNumber) return
    setIsJoining(true)
    setActionError(null)

    try {
      const payload = await joinClub(id, user.membershipNumber)
      setMembers((previous) => [...previous, payload.clubMember])
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'تعذر الانضمام.')
    } finally {
      setIsJoining(false)
    }
  }

  const activeMembers = members.filter((member) => member.status === 'active')

  return (
    <>
      <Stack.Screen options={{ title: club?.name ?? 'تفاصيل النادي' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <ErrorBanner message={error} /> : null}

        {club ? (
          <View style={styles.card}>
            {club.imageUrl ? (
              <Image source={{ uri: club.imageUrl }} style={styles.banner} resizeMode="cover" />
            ) : null}

            <View style={styles.headerRow}>
              <StatusPill label={joinPolicyLabel(club.joinPolicy)} tone="info" />
              <Text style={styles.title}>{club.name}</Text>
            </View>

            {club.description ? <Text style={styles.description}>{club.description}</Text> : null}

            <View style={styles.row}>
              <Text style={styles.label}>الأعضاء النشطون</Text>
              <Text style={styles.value}>{activeMembers.length}</Text>
            </View>

            {club.country ? (
              <View style={styles.row}>
                <Text style={styles.label}>الموقع</Text>
                <Text style={styles.value}>
                  {[club.country, club.region, club.city].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ) : null}

            {actionError ? <ErrorBanner message={actionError} /> : null}

            {!myMembership && club.joinPolicy !== 'invite_only' ? (
              <Pressable
                style={[styles.joinButton, isJoining && styles.joinDisabled]}
                disabled={isJoining}
                onPress={() => void handleJoin()}
              >
                <Text style={styles.joinText}>
                  {isJoining
                    ? 'جارٍ الإرسال...'
                    : club.joinPolicy === 'auto_approve'
                      ? 'انضم الآن'
                      : 'طلب انضمام'}
                </Text>
              </Pressable>
            ) : null}

            {myMembership ? (
              <StatusPill
                label={
                  myMembership.status === 'active'
                    ? 'عضو نشط'
                    : myMembership.status === 'pending'
                      ? 'طلب قيد المراجعة'
                      : myMembership.status
                }
                tone={myMembership.status === 'active' ? 'success' : 'warning'}
              />
            ) : null}

            {activeMembers.length > 0 ? (
              <View style={styles.membersBlock}>
                <Text style={styles.label}>الأعضاء</Text>
                {activeMembers.slice(0, 15).map((member) => (
                  <Text key={member.membershipNumber} style={styles.memberName}>
                    {member.displayName}
                  </Text>
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
    height: 160,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
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
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinDisabled: { opacity: 0.7 },
  joinText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  membersBlock: { gap: 6, marginTop: 4 },
  memberName: {
    color: colors.text,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
})
