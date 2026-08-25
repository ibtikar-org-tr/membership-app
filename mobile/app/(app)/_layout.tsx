import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { colors } from '@/src/theme/colors'

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '700' }}>
      {label}
    </Text>
  )
}

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerTitleAlign: 'center',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarLabel: ({ focused }) => <TabLabel label="الرئيسية" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'الفعاليات',
          headerShown: false,
          tabBarLabel: ({ focused }) => <TabLabel label="الفعاليات" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
