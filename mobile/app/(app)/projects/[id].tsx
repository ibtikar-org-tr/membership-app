import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchProjectById, fetchProjectMembers } from '@/src/api/projects'
import { ErrorBanner, StatusPill } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { VmsProject, VmsProjectMember } from '@/src/types/projects'

function statusLabel(status: string) {
  if (status === 'active') return 'نشط'
  if (status === 'completed') return 'مكتمل'
  if (status === 'archived') return 'مؤرشف'
  return status
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [project, setProject] = useState<VmsProject | null>(null)
  const [members, setMembers] = useState<VmsProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) {
        setError('معرّف المشروع غير صالح.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const [projectPayload, membersPayload] = await Promise.all([
          fetchProjectById(id),
          fetchProjectMembers(id),
        ])
        if (!cancelled) {
          setProject(projectPayload.project)
          setMembers(membersPayload.projectMembers)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل المشروع.')
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

  const skillNames = project?.skills ? Object.keys(project.skills) : []

  return (
    <>
      <Stack.Screen options={{ title: project?.name ?? 'تفاصيل المشروع' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <ErrorBanner message={error} /> : null}

        {project ? (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <StatusPill
                label={statusLabel(project.status)}
                tone={project.status === 'active' ? 'success' : project.status === 'completed' ? 'info' : 'neutral'}
              />
              <Text style={styles.title}>{project.name}</Text>
            </View>

            {project.description ? <Text style={styles.description}>{project.description}</Text> : null}

            <View style={styles.row}>
              <Text style={styles.label}>المالك</Text>
              <Text style={styles.value}>{project.ownerDisplayName || project.owner}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>عدد الأعضاء</Text>
              <Text style={styles.value}>{members.length.toLocaleString('en-US')}</Text>
            </View>

            {skillNames.length > 0 ? (
              <View style={styles.row}>
                <Text style={styles.label}>المهارات</Text>
                <Text style={styles.value}>{skillNames.join('، ')}</Text>
              </View>
            ) : null}

            {members.length > 0 ? (
              <View style={styles.membersBlock}>
                <Text style={styles.label}>الأعضاء</Text>
                {members.slice(0, 12).map((member) => (
                  <View key={`${member.projectId}-${member.membershipNumber}`} style={styles.memberRow}>
                    <StatusPill
                      label={
                        member.role === 'manager'
                          ? 'مدير'
                          : member.role === 'observer'
                            ? 'مراقب'
                            : 'عضو'
                      }
                      tone={member.role === 'manager' ? 'info' : 'neutral'}
                    />
                    <Text style={styles.memberName}>{member.displayName}</Text>
                  </View>
                ))}
                {members.length > 12 ? (
                  <Text style={styles.more}>و {members.length - 12} آخرين...</Text>
                ) : null}
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
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    lineHeight: 22,
  },
  membersBlock: { gap: 8, marginTop: 4 },
  memberRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberName: {
    flex: 1,
    color: colors.text,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
  more: {
    color: colors.textMuted,
    textAlign: 'right',
    fontSize: 12,
  },
})
