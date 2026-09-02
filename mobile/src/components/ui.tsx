import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@/src/theme/colors'

export function ErrorBanner({ message }: { message: string }) {
  return <Text style={styles.error}>{message}</Text>
}

export function EmptyState({ message }: { message: string }) {
  return <Text style={styles.empty}>{message}</Text>
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

export function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}) {
  return (
    <View style={[styles.pill, toneStyles[tone]]}>
      <Text style={[styles.pillText, toneTextStyles[tone]]}>{label}</Text>
    </View>
  )
}

const toneStyles = {
  neutral: { backgroundColor: '#f8fafc', borderColor: colors.border },
  success: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  warning: { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  danger: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  info: { backgroundColor: '#ecfeff', borderColor: '#a5f3fc' },
} as const

const toneTextStyles = {
  neutral: { color: colors.textMuted },
  success: { color: '#047857' },
  warning: { color: '#b45309' },
  danger: { color: colors.danger },
  info: { color: colors.primary },
} as const

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
    textAlign: 'right',
    overflow: 'hidden',
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
  },
  section: {
    gap: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
    lineHeight: 20,
  },
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
})
