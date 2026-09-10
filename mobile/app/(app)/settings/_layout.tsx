import { Stack } from 'expo-router'
import { colors } from '@/src/theme/colors'

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerTintColor: colors.primary,
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'الإعدادات' }} />
      <Stack.Screen name="profile" options={{ title: 'الملف الشخصي' }} />
      <Stack.Screen name="password" options={{ title: 'تغيير كلمة المرور' }} />
    </Stack>
  )
}
