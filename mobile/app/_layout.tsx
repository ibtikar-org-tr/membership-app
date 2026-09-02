import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, type ReactNode } from 'react'
import { ActivityIndicator, I18nManager, StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/src/auth/AuthContext'
import { colors } from '@/src/theme/colors'

if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true)
  I18nManager.forceRTL(true)
}

function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    const onLogin = segments[0] === 'login'

    if (status === 'signedOut' && !onLogin) {
      router.replace('/login')
      return
    }

    if (status === 'signedIn' && onLogin) {
      router.replace('/')
    }
  }, [router, segments, status])

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
