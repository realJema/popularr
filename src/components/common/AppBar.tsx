import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { COLORS, RADII, SIZES, SPACING } from '@/constants/theme';
import { AppText } from './AppText';

interface AppBarProps {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}

/** Compact back-and-title bar for pushed (non-tab) screens. */
export function AppBar({ title, onBack, right }: AppBarProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={SIZES.iconMd} color={COLORS.text} />
      </Pressable>

      <AppText variant="title" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>

      {right ? <View style={styles.right}>{right}</View> : <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  spacer: {
    width: 40,
  },
});
