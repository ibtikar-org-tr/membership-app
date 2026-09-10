import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { StatusPill } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'
import type { VmsProject, VmsProjectMember } from '@/src/types/projects'

function statusLabel(status: string) {
  if (status === 'active') return 'نشط'
  if (status === 'completed') return 'مكتمل'
  if (status === 'archived') return 'مؤرشف'
  return status
}

function memberInitials(name: string, membershipNumber: string) {
  const source = name.trim() || membershipNumber
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

type ProjectHeroProps = {
  project: VmsProject
  parentProjectName: string | null
  members: VmsProjectMember[]
  openTasksCount: number
  canLeave: boolean
  isLeaving: boolean
  isSendingInvite: boolean
  inviteMessage: string | null
  onLeave: () => void
  onTelegramInvite: () => void
}

export function ProjectHero({
  project,
  parentProjectName,
  members,
  openTasksCount,
  canLeave,
  isLeaving,
  isSendingInvite,
  inviteMessage,
  onLeave,
  onTelegramInvite,
}: ProjectHeroProps) {
  const router = useRouter()
  const previewMembers = members.slice(0, 4)
  const hiddenCount = Math.max(0, members.length - previewMembers.length)
  const skillNames = project.skills ? Object.keys(project.skills) : []

  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.badges}>
          <StatusPill
            label={statusLabel(project.status)}
            tone={project.status === 'active' ? 'success' : project.status === 'completed' ? 'info' : 'neutral'}
          />
          <StatusPill
            label={project.parentProjectId ? `فرعي • ${parentProjectName ?? '...'}` : 'مشروع رئيسي'}
            tone="neutral"
          />
          <StatusPill label={`${members.length} عضو`} tone="info" />
          <StatusPill label={`${openTasksCount} مهمة مفتوحة`} tone="warning" />
        </View>

        <Text style={styles.kicker}>لوحة المشروع</Text>
        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.description}>
          {project.description ?? 'لا يوجد وصف للمشروع حالياً.'}
        </Text>

        {skillNames.length > 0 ? (
          <View style={styles.skillsRow}>
            {skillNames.slice(0, 6).map((skill) => (
              <View key={skill} style={styles.skillPill}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.heroFooter}>
        <View style={styles.ownerCard}>
          <Text style={styles.ownerLabel}>المسؤول</Text>
          <Text style={styles.ownerValue}>{project.ownerDisplayName || project.owner}</Text>
          {project.telegramGroupId ? (
            <Pressable
              style={[styles.inviteButton, isSendingInvite && styles.disabled]}
              disabled={isSendingInvite}
              onPress={onTelegramInvite}
            >
              <Text style={styles.inviteText}>
                {isSendingInvite ? 'جارٍ الإرسال...' : 'دعوة تلغرام'}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.telegramHint}>لا توجد مجموعة تلغرام مرتبطة</Text>
          )}
          {inviteMessage ? <Text style={styles.inviteMessage}>{inviteMessage}</Text> : null}
        </View>

        <View style={styles.membersPreview}>
          <View style={styles.avatarRow}>
            {previewMembers.map((member) => (
              <View key={member.membershipNumber} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {memberInitials(member.displayName, member.membershipNumber)}
                </Text>
              </View>
            ))}
            {hiddenCount > 0 ? (
              <View style={[styles.avatar, styles.avatarMore]}>
                <Text style={styles.avatarMoreText}>+{hiddenCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.backButton} onPress={() => router.push('/projects')}>
          <Text style={styles.backText}>العودة للمشاريع</Text>
        </Pressable>
        {canLeave ? (
          <Pressable
            style={[styles.leaveButton, isLeaving && styles.disabled]}
            disabled={isLeaving}
            onPress={onLeave}
          >
            <Text style={styles.leaveText}>{isLeaving ? 'جارٍ المغادرة...' : 'مغادرة المشروع'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

export type ProjectSection =
  | 'tasks'
  | 'events'
  | 'clubs'
  | 'positions'
  | 'members'
  | 'children'
  | 'notes'

const SECTIONS: Array<{ key: ProjectSection; label: string }> = [
  { key: 'tasks', label: 'المهام' },
  { key: 'events', label: 'الفعاليات' },
  { key: 'clubs', label: 'الأندية' },
  { key: 'positions', label: 'التطوع' },
  { key: 'members', label: 'الأعضاء' },
  { key: 'children', label: 'الفرعية' },
  { key: 'notes', label: 'الملاحظات' },
]

export function ProjectSectionNav({
  active,
  onChange,
}: {
  active: ProjectSection
  onChange: (section: ProjectSection) => void
}) {
  return (
    <View style={navStyles.wrap}>
      {SECTIONS.map((section) => {
        const isActive = section.key === active
        return (
          <Pressable
            key={section.key}
            style={[navStyles.pill, isActive && navStyles.pillActive]}
            onPress={() => onChange(section.key)}
          >
            <Text style={[navStyles.pillText, isActive && navStyles.pillTextActive]}>
              {section.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: 24,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  heroTop: { gap: 8 },
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  kicker: {
    color: '#a5f3fc',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
  },
  description: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  skillsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  skillPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skillText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  heroFooter: {
    flexDirection: 'row-reverse',
    gap: 10,
    alignItems: 'flex-start',
  },
  ownerCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  ownerLabel: {
    color: '#a5f3fc',
    fontSize: 11,
    textAlign: 'right',
  },
  ownerValue: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'right',
  },
  telegramHint: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'right',
  },
  inviteButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.35)',
  },
  inviteText: {
    color: '#cffafe',
    fontSize: 11,
    fontWeight: '700',
  },
  inviteMessage: {
    color: '#86efac',
    fontSize: 11,
    textAlign: 'right',
  },
  membersPreview: {
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0e7490',
    borderWidth: 2,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  avatarMore: {
    backgroundColor: '#334155',
  },
  avatarMoreText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  leaveButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  leaveText: {
    color: '#fecaca',
    fontWeight: '700',
    fontSize: 12,
  },
  disabled: { opacity: 0.7 },
})

const navStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  pillTextActive: {
    color: '#fff',
  },
})
