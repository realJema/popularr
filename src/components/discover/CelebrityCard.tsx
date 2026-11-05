import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { COLORS, RADII, SIZES, SPACING, WEIGHTS } from '@/constants/theme';
import type { CelebrityDetail } from '@/types/models';
import { getAge, popularityTier } from '@/utils/celebrity';
import { AppText } from '../common/AppText';
import { CelebrityImage } from '../common/CelebrityImage';
import { Chip } from '../common/Chip';

interface CelebrityCardProps {
  celebrity: CelebrityDetail;
}

/** Full-bleed content of a Discover card. Presentational only (no gestures). */
export function CelebrityCard({ celebrity }: CelebrityCardProps) {
  const age = getAge(celebrity.dateOfBirth);
  const tier = popularityTier(celebrity.popularityScore);
  const location = celebrity.country
    ? `${celebrity.country.flagEmoji ? `${celebrity.country.flagEmoji} ` : ''}${celebrity.country.name}`
    : celebrity.birthplace;

  return (
    <View style={styles.card}>
      <CelebrityImage
        name={celebrity.name}
        seed={celebrity.id}
        imageUrl={celebrity.imageUrl}
        style={styles.image}
      />

      <LinearGradient
        colors={['rgba(16,16,20,0)', 'rgba(16,16,20,0.55)', 'rgba(16,16,20,0.95)']}
        locations={[0.45, 0.72, 1]}
        style={styles.scrim}
      />

      {/* Floating popularity badge */}
      <View style={styles.scoreBadge}>
        <AppText variant="label" color="textSecondary" style={styles.scoreCaption}>
          POPULARITY
        </AppText>
        <View style={styles.scoreRow}>
          <AppText variant="title" style={styles.scoreValue}>
            {celebrity.popularityScore}
          </AppText>
          <View style={[styles.tierPill, { backgroundColor: `${tier.color}22` }]}>
            <AppText variant="label" style={{ color: tier.color, fontWeight: WEIGHTS.bold }}>
              {tier.label}
            </AppText>
          </View>
        </View>
      </View>

      {celebrity.isVerified ? (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={SIZES.iconLg} color={COLORS.primary} />
        </View>
      ) : null}

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <AppText variant="display" numberOfLines={1} style={styles.name}>
            {celebrity.name}
          </AppText>
          {age ? <AppText variant="title" color="textSecondary">{`, ${age}`}</AppText> : null}
        </View>

        {celebrity.occupation ? (
          <AppText variant="bodyBold" color="primaryLight" style={styles.occupation} numberOfLines={1}>
            {celebrity.occupation}
          </AppText>
        ) : null}

        {location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
            <AppText variant="caption" style={styles.location}>
              {location}
            </AppText>
          </View>
        ) : null}

        {celebrity.shortDescription ? (
          <AppText variant="body" style={styles.description} numberOfLines={3}>
            {celebrity.shortDescription}
          </AppText>
        ) : null}

        {celebrity.categories.length > 0 ? (
          <View style={styles.chips}>
            {celebrity.categories.slice(0, 3).map((category) => (
              <Chip key={category.id} label={category.name} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: SIZES.cardRadius,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  scoreBadge: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    backgroundColor: 'rgba(27,27,35,0.78)',
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreCaption: {
    marginBottom: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scoreValue: {
    lineHeight: 26,
  },
  tierPill: {
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: 'rgba(27,27,35,0.78)',
    borderRadius: RADII.pill,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  body: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  name: {
    flexShrink: 1,
    lineHeight: 40,
  },
  occupation: {
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  location: {
    color: COLORS.textSecondary,
  },
  description: {
    marginTop: SPACING.md,
    color: COLORS.text,
    opacity: 0.92,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
});
