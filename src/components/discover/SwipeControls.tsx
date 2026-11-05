import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { COLORS, SHADOWS, SIZES, SPACING } from '@/constants/theme';

interface SwipeControlsProps {
  onPass: () => void;
  onLike: () => void;
  disabled?: boolean;
}

/** The pass / like action bar at the bottom of the Discover screen. Undo and
 * more-info now live on the active card, so this bar stays minimal. */
export function SwipeControls({ onPass, onLike, disabled }: SwipeControlsProps) {
  return (
    <View style={styles.container}>
      <ControlButton
        icon="close"
        color={COLORS.pass}
        size={SIZES.controlButton}
        iconSize={SIZES.iconLg}
        onPress={onPass}
        disabled={disabled}
        testID="swipe-pass"
      />
      <ControlButton
        icon="heart"
        color={COLORS.like}
        size={SIZES.controlButton}
        iconSize={SIZES.iconLg}
        onPress={onLike}
        disabled={disabled}
        testID="swipe-like"
      />
    </View>
  );
}

interface ControlButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  iconSize?: number;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

function ControlButton({
  icon,
  color,
  size,
  iconSize = SIZES.iconMd,
  onPress,
  disabled,
  testID,
}: ControlButtonProps) {
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { width: size, height: size, borderColor: color, opacity: disabled ? 0.35 : 1 },
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxxl,
    paddingVertical: SPACING.lg,
  },
  button: {
    borderRadius: SIZES.controlButton,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.control,
  },
});
