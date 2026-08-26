import { Ionicons } from '@expo/vector-icons'
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import type { ComponentProps } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { telegram } from '@/src/theme/colors'

type IconName = ComponentProps<typeof Ionicons>['name']

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  agenda: { active: 'calendar', inactive: 'calendar-outline' },
  projects: { active: 'folder', inactive: 'folder-outline' },
  events: { active: 'ticket', inactive: 'ticket-outline' },
  community: { active: 'people', inactive: 'people-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
}

function getTabKey(routeName: string): string {
  if (routeName === 'index') return 'index'
  if (routeName.startsWith('agenda')) return 'agenda'
  if (routeName.startsWith('projects')) return 'projects'
  if (routeName.startsWith('events')) return 'events'
  if (routeName.startsWith('community')) return 'community'
  if (routeName.startsWith('settings')) return 'settings'
  return routeName
}

export function TelegramTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0)

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingHorizontal: telegram.tabBarHorizontalMargin,
          paddingBottom: bottomInset + telegram.tabBarBottomGap,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.barShell}>
        <BlurView
          intensity={telegram.tabBarBlurIntensity}
          tint={telegram.tabBarBlurTint}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />

        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key]
            const rawLabel = options.tabBarLabel ?? options.title ?? route.name
            const label = typeof rawLabel === 'string' ? rawLabel : route.name

            const isFocused = state.index === index
            const tabKey = getTabKey(route.name)
            const icons = TAB_ICONS[tabKey] ?? TAB_ICONS.index
            const iconName = isFocused ? icons.active : icons.inactive
            const color = isFocused ? telegram.tabActive : telegram.tabInactive

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params)
              }
            }

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              })
            }

            return (
              <View key={route.key} style={styles.tab}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  android_ripple={{
                    color: isFocused
                      ? 'rgba(51, 144, 236, 0.14)'
                      : 'rgba(0, 0, 0, 0.06)',
                    borderless: false,
                  }}
                  style={({ pressed }) => [
                    styles.tabInner,
                    isFocused && styles.tabInnerActive,
                    pressed && styles.tabInnerPressed,
                  ]}
                >
                  <Ionicons name={iconName} size={telegram.tabIconSize} color={color} />
                  <Text
                    style={[
                      styles.label,
                      { color },
                      isFocused ? styles.labelActive : styles.labelInactive,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {label}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  barShell: {
    minHeight: telegram.tabBarContentHeight,
    borderRadius: telegram.tabBarRadius,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: telegram.tabBarBorder,
    backgroundColor: telegram.tabBarBackground,
    ...Platform.select({
      ios: {
        shadowColor: telegram.tabBarShadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    minHeight: telegram.tabBarContentHeight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    minHeight: 46,
    marginHorizontal: 1,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        borderCurve: 'continuous',
      },
      default: {},
    }),
  },
  tabInnerActive: {
    backgroundColor: telegram.tabActivePill,
    paddingHorizontal: 10,
  },
  tabInnerPressed: {
    opacity: 0.88,
  },
  label: {
    fontSize: telegram.tabLabelSize,
    textAlign: 'center',
    maxWidth: 64,
  },
  labelActive: {
    fontWeight: '700',
  },
  labelInactive: {
    fontWeight: '500',
  },
})
