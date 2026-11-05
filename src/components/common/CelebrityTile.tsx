import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { CelebrityDetail } from '@/types/models';
import { AppText } from './AppText';
import { CelebrityImage } from './CelebrityImage';

interface CelebrityTileProps {
  celebrity: CelebrityDetail;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const ABSOLUTE_FILL = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;

/** Square-ish grid tile used by Explore (and any future browse surface). */
export function CelebrityTile({ celebrity, onPress, style }: CelebrityTileProps) {
  const country = celebrity.country;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${celebrity.name}`}>
      <View style={styles.imageWrap}>
        <CelebrityImage
          name={celebrity.name}
          seed={celebrity.id}
          imageUrl={celebrity.imageUrl}
          initialsFontSize={30}
          style={ABSOLUTE_FILL}
        />
        <View style={styles.scorePill}>
          <Ionicons name="star" size={11} color={COLORS.text} />
          <AppText variant="label" color="white" style={styles.scoreText}>
            {celebrity.popularityScore}
          </AppText>
        </View>
        {celebrity.isVerified ? (
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.primaryLight} />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <AppText variant="subtitle" numberOfLines={1} style={styles.name}>
          {celebrity.name}
        </AppText>
        <AppText variant="caption" color="secondary" numberOfLines={1}>
          {celebrity.occupation ?? 'Celebrity'}
        </AppText>
        {country ? (
          <View style={styles.countryRow}>
            <AppText style={styles.flag}>{country.flagEmoji ?? ''}</AppText>
            <AppText variant="label" color="muted" numberOfLines={1}>
              {country.name}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  pressed: {
    backgroundColor: COLORS.surfaceSecondary,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: COLORS.surfaceSecondary,
  },
  scorePill: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.overlay,
  },
  scoreText: {
    fontSize: 11,
  },
  verified: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  body: {
    padding: SPACING.md,
    gap: 2,
  },
  name: {
    fontSize: 15,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 2,
  },
  flag: {
    fontSize: 12,
  },
});
