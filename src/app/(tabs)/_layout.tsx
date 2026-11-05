import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(focusedName: IconName) {
  const outlineName = `${focusedName}-outline` as IconName;
  return ({ focused, color }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? focusedName : outlineName} size={22} color={color as string} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: tabIcon('flame') }} />
      <Tabs.Screen name="rankings" options={{ title: 'Rankings', tabBarIcon: tabIcon('trophy') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
