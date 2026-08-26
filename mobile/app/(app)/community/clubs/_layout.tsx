import { Stack } from 'expo-router'
import { colors } from '@/src/theme/colors'

export default function ClubsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'الأندية' }} />
      <Stack.Screen name="[id]" options={{ title: 'تفاصيل النادي' }} />
    </Stack>
  )
}
