import { Pressable, StyleSheet, View } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import { AppText } from './AppText';

interface ErrorPanelProps {
  onRetry: () => void;
  title?: string;
  message?: string;
}

/** Inline error state with a retry action (used by query-backed screens). */
export function ErrorPanel({ onRetry, title = 'Could not load', message }: ErrorPanelProps) {
  return (
    <View style={styles.container}>
      <AppText variant="subtitle" align="center">
        {title}
      </AppText>
      <AppText variant="body" color="secondary" align="center" style={styles.message}>
        {message ?? 'Something went wrong while loading your data. Please try again.'}
      </AppText>
      <Pressable
        onPress={onRetry}
        style={styles.retry}
        accessibilityRole="button"
        accessibilityLabel="Try again">
        <AppText variant="label" color="white">
          Try again
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  },
  message: {
    marginBottom: SPACING.xs,
  },
  retry: {
    minHeight: 44,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
