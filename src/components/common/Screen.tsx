import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';

interface ScreenProps {
  children: ReactNode;
  /** Apply safe-area padding on these edges. Defaults to top + bottom. */
  edges?: Edge[];
  /** When true the header is not padded by the safe area (used with custom headers). */
  transparent?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Base full-screen container that paints the app background and respects the
 * device safe areas. Every route screen wraps its content in <Screen>.
 */
export function Screen({ children, edges = ['top', 'bottom'], transparent, style }: ScreenProps) {
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, transparent && styles.transparent, style]}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  transparent: {
    backgroundColor: COLORS.transparent,
  },
  content: {
    flex: 1,
  },
});
