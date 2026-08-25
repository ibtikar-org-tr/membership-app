import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { login } from '@/src/api/auth'
import { useAuth } from '@/src/auth/AuthContext'
import { colors } from '@/src/theme/colors'
import { isTelegramActivationRequiredError } from '@/src/types/auth'

const TELEGRAM_BOT_URL = 'https://t.me/ibtikar_bot'

export default function LoginScreen() {
  const { refreshAuth } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [telegramRequired, setTelegramRequired] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    setTelegramRequired(false)

    const trimmedIdentifier = identifier.trim()
    if (!trimmedIdentifier || !password) {
      setError('يرجى إدخال البريد الإلكتروني أو رقم العضوية وكلمة المرور.')
      return
    }

    setIsSubmitting(true)
    try {
      await login({ identifier: trimmedIdentifier, password })
      await refreshAuth()
    } catch (requestError) {
      if (isTelegramActivationRequiredError(requestError)) {
        setTelegramRequired(true)
        setError(null)
        return
      }

      setError(requestError instanceof Error ? requestError.message : 'تعذر تسجيل الدخول.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.badge}>بوابة الأعضاء</Text>
          <Text style={styles.title}>تسجيل الدخول إلى حسابك</Text>
          <Text style={styles.subtitle}>
            استخدم بريدك الإلكتروني أو رقم العضوية وكلمة المرور للوصول إلى التطبيق.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>البريد الإلكتروني أو رقم العضوية</Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>كلمة المرور</Text>
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="password"
              style={[styles.input, styles.passwordInput]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.showButton}>
              <Text style={styles.showButtonText}>{showPassword ? 'إخفاء' : 'إظهار'}</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {telegramRequired ? (
            <View style={styles.telegramBox}>
              <Text style={styles.telegramText}>
                يجب تفعيل بوت تيليغرام قبل تسجيل الدخول. افتح البوت وأرسل /verify ثم أكمل التحقق.
              </Text>
              <Pressable onPress={() => void Linking.openURL(TELEGRAM_BOT_URL)}>
                <Text style={styles.telegramLink}>فتح بوت تيليغرام</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            onPress={() => void handleSubmit()}
            disabled={isSubmitting}
            style={[styles.submit, isSubmitting && styles.submitDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>تسجيل الدخول</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: 24,
    padding: 24,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#a5f3fc',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'right',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#f8fafc',
    textAlign: 'right',
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingLeft: 72,
  },
  showButton: {
    position: 'absolute',
    left: 10,
    top: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  showButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
    textAlign: 'right',
    overflow: 'hidden',
  },
  telegramBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    backgroundColor: '#fffbeb',
    padding: 12,
    gap: 8,
  },
  telegramText: {
    color: colors.text,
    textAlign: 'right',
    lineHeight: 22,
  },
  telegramLink: {
    color: colors.accent,
    fontWeight: '700',
    textAlign: 'right',
  },
  submit: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
