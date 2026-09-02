import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '@/src/auth/AuthContext'
import { colors } from '@/src/theme/colors'

export default function SettingsScreen() {
  const { user, signOut } = useAuth()

  return (
    <View style={styles.flex}>
      <View style={styles.card}>
        <Text style={styles.label}>الحساب</Text>
        <Text style={styles.value}>{user?.email}</Text>
        <Text style={styles.meta}>رقم العضوية: {user?.membershipNumber}</Text>
      </View>

      <Link href="/settings/profile" asChild>
        <Pressable style={styles.row}>
          <Text style={styles.chevron}>‹</Text>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>الملف الشخصي</Text>
            <Text style={styles.rowSubtitle}>عرض وتعديل بياناتك الشخصية</Text>
          </View>
        </Pressable>
      </Link>

      <Pressable style={styles.logout} onPress={() => void signOut()}>
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  label: {
    color: '#a5f3fc',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  meta: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'right',
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 28,
    lineHeight: 28,
  },
  logout: {
    marginTop: 8,
    backgroundColor: colors.dangerBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 15,
  },
})
