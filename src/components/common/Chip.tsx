import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Leading emoji (e.g. a country flag) rendered before the label. */
  leading?: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Compact pill used for categories, countries and filter tags. */
export function Chip({ label, icon, leading, active, style }: ChipProps) {
  return (
    <View style={[styles.chip, active && styles.active, style]}>
      {leading ? <AppText style={styles.leading}>{leading}</AppText> : null}
      {icon ? (
        <Ionicons
          name={icon}
          size={13}
          color={active ? COLORS.primary : COLORS.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <AppText variant="label" color={active ? 'primary' : 'textSecondary'}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  active: {
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    borderColor: COLORS.primary,
  },
  leading: {
    marginRight: SPACING.xs,
    fontSize: 13,
  },
  icon: {
    marginRight: SPACING.xs,
  },
});
