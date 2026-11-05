import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import { AppText } from '../common/AppText';

/**
 * Structural subset of React Navigation's bottom-tab bar props. Declaring it
 * locally avoids depending on the internal `@react-navigation/bottom-tabs`
 * package (not a direct dependency). The `tabBar` render prop in the Tabs layout
 * passes a fully-typed props object that satisfies this shape.
 */
interface TabDescriptor {
  options: {
    title?: string;
    tabBarIcon?: (args: { focused: boolean; color: ColorValue; size: number }) => ReactNode;
  };
}

interface FloatingTabBarProps {
  state: { routes: { key: string; name: string }[]; index: number };
  descriptors: Record<string, TabDescriptor>;
  navigateToTab: (routeKey: string) => void;
}

/**
 * A floating, pill-shaped tab bar that replaces the default bottom bar. Only the
 * three primary destinations live here; secondary surfaces (Explore, Likes) are
 * pushed as stack screens. The active tab is a filled violet pill.
 */
export function FloatingTabBar({ state, navigateToTab, descriptors }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { marginBottom: insets.bottom + SPACING.md }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route: { key: string; name: string }, index: number) => {
          const descriptor = descriptors[route.key];
          const focused = state.index === index;
          const title = descriptor?.options.title ?? route.name;
          const tint = focused ? COLORS.text : COLORS.textMuted;
          const icon = descriptor?.options.tabBarIcon?.({ focused, color: tint, size: 22 });

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                if (!focused) navigateToTab(route.key);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={title}
              style={[styles.tab, focused && styles.tabActive]}>
              {icon}
              <AppText variant="label" color={focused ? 'white' : 'muted'} style={styles.label}>
                {title}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.xl,
  },
  bar: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xs + 2,
    gap: SPACING.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADII.pill,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: 13,
  },
});
