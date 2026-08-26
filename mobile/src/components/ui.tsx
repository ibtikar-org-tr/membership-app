import { StyleSheet, Text, TextInput, View } from 'react-native'
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

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <View style={styles.progressWrap}>
      {label ? (
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>{clamped}%</Text>
        </View>
      ) : null}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clamped}%` }]} />
      </View>
    </View>
  )
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string
  onChangeText: (value: string) => void
  placeholder: string
}) {
  return (
    <View style={styles.searchWrap}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
        textAlign="right"
      />
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
  progressWrap: { gap: 6 },
  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  progressValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    padding: 0,
  },
})
