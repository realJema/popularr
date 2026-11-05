import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import { AppText } from './AppText';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Reusable empty-state placeholder shown when a list/section has no results. */
export function EmptyState({ title, message, icon = 'sparkles-outline' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={34} color={COLORS.primaryLight} />
      </View>
      <AppText variant="subtitle" style={styles.title}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" style={styles.message}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
