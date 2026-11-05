import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';
import { AppText } from './AppText';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

/** Consistent title block used at the top of every tab screen. */
export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <AppText variant="display" style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    lineHeight: 38,
  },
  subtitle: {
    marginTop: SPACING.xs,
  },
  right: {
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
});
