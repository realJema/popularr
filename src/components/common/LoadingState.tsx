import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';
import { AppText } from './AppText';

interface LoadingStateProps {
  label?: string;
  full?: boolean;
}

/** Centered spinner with an optional label for async / loading boundaries. */
export function LoadingState({ label, full = true }: LoadingStateProps) {
  return (
    <View style={[styles.container, !full && styles.inline]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {label ? (
        <AppText variant="caption" style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  inline: {
    flex: 0,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.transparent,
  },
  label: {
    marginTop: SPACING.md,
  },
});
