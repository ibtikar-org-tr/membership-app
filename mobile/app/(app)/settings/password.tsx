import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { changePassword } from '@/src/api/auth'
import { ErrorBanner } from '@/src/components/ui'
import { colors } from '@/src/theme/colors'

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('يرجى تعبئة جميع الحقول.')
      return
    }

    if (newPassword.length < 8) {
      setError('يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('تأكيد كلمة المرور غير متطابق.')
      return
    }

    if (currentPassword === newPassword) {
      setError('يجب أن تختلف كلمة المرور الجديدة عن الحالية.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await changePassword({ currentPassword, newPassword })
      setSuccess(payload.message || 'تم تحديث كلمة المرور بنجاح.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحديث كلمة المرور.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>تغيير كلمة المرور</Text>
        <Text style={styles.subtitle}>أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة.</Text>
      </View>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <Text style={styles.label}>كلمة المرور الحالية</Text>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>كلمة المرور الجديدة</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>تأكيد كلمة المرور الجديدة</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />

        <Pressable
          style={[styles.submit, isSubmitting && styles.submitDisabled]}
          disabled={isSubmitting}
          onPress={() => void handleSubmit()}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>تحديث كلمة المرور</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 12,
  },
  successText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    textAlign: 'right',
    backgroundColor: colors.background,
    fontSize: 15,
  },
  submit: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
})
