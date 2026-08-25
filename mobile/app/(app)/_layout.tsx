import { Tabs } from 'expo-router'
import { TelegramTabBar } from '@/src/components/TelegramTabBar'
import { colors, telegram } from '@/src/theme/colors'

export default function AppTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TelegramTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        sceneStyle: {
          backgroundColor: colors.background,
          paddingBottom: telegram.tabBarScenePadding,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarLabel: 'الرئيسية',
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'المشاريع',
          headerShown: false,
          tabBarLabel: 'المشاريع',
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'الفعاليات',
          headerShown: false,
          tabBarLabel: 'الفعاليات',
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'المجتمع',
          headerShown: false,
          tabBarLabel: 'المجتمع',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'الإعدادات',
          headerShown: false,
          tabBarLabel: 'الإعدادات',
        }}
      />
    </Tabs>
  )
}
