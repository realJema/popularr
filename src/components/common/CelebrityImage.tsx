import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { COLORS, WEIGHTS } from '@/constants/theme';
import { getAvatarGradient, getInitials } from '@/utils/celebrity';
import { AppText } from './AppText';

interface CelebrityImageProps {
  name: string;
  /** Stable seed for the placeholder gradient — usually the celebrity id. */
  seed: string;
  imageUrl?: string | null;
  style?: StyleProp<ViewStyle>;
  /** Circular crop for grid/list avatars. */
  round?: boolean;
  initialsFontSize?: number;
}

const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

/**
 * Renders a celebrity photo when a remote URL exists, otherwise a deterministic
 * gradient + initials placeholder. Everything is offline-friendly: no image is
 * invented or fetched from a third party, matching the local-first constraint.
 */
export function CelebrityImage({
  name,
  seed,
  imageUrl,
  style,
  round,
  initialsFontSize = 44,
}: CelebrityImageProps) {
  const containerStyle: StyleProp<ViewStyle> = [styles.base, round && styles.round, style];

  if (imageUrl) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.fill}
          contentFit="cover"
          recyclingKey={seed}
          transition={150}
        />
      </View>
    );
  }

  const [from, to] = getAvatarGradient(seed);
  return (
    <View style={containerStyle}>
      <LinearGradient colors={[from, to]} style={styles.fill} start={GRADIENT_START} end={GRADIENT_END}>
        <AppText
          style={[styles.initials, { fontSize: initialsFontSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {getInitials(name)}
        </AppText>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceSecondary,
  },
  round: {
    borderRadius: 9999,
    aspectRatio: 1,
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.text,
    fontWeight: WEIGHTS.extrabold,
    opacity: 0.92,
    letterSpacing: 1,
  },
});
