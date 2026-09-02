import { Stack } from 'expo-router'
import { colors } from '@/src/theme/colors'

export default function ProjectsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'المشاريع' }} />
      <Stack.Screen name="[id]" options={{ title: 'تفاصيل المشروع' }} />
    </Stack>
  )
}
