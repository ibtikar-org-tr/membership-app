import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import type { ColorValue } from 'react-native'
import { colors } from '@/src/theme/colors'

type IconName = ComponentProps<typeof Ionicons>['name']

function tabIcon(name: IconName, focusedName: IconName) {
  return ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? focusedName : name} size={size} color={color} />
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
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarLabel: 'الرئيسية',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'المشاريع',
          headerShown: false,
          tabBarLabel: 'المشاريع',
          tabBarIcon: tabIcon('folder-outline', 'folder'),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'الفعاليات',
          headerShown: false,
          tabBarLabel: 'الفعاليات',
          tabBarIcon: tabIcon('calendar-outline', 'calendar'),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'المجتمع',
          headerShown: false,
          tabBarLabel: 'المجتمع',
          tabBarIcon: tabIcon('people-outline', 'people'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'الإعدادات',
          headerShown: false,
          tabBarLabel: 'الإعدادات',
          tabBarIcon: tabIcon('settings-outline', 'settings'),
        }}
      />
    </Tabs>
  )
}
