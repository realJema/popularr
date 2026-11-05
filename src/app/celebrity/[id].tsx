import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { CelebrityImage } from '@/components/common/CelebrityImage';
import { Chip } from '@/components/common/Chip';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { Screen } from '@/components/common/Screen';
import { COLORS, RADII, SIZES, SPACING, WEIGHTS } from '@/constants/theme';
import { celebrityRepository, swipeRepository } from '@/database/queries';
import { LIKES_QUERY_KEY } from '@/hooks/useDiscoverDeck';
import type { CelebrityDetail } from '@/types/models';
import { formatDate, getAge, popularityTier } from '@/utils/celebrity';
import { tapSelection } from '@/utils/haptics';

/**
 * Celebrity details — full profile for one person, resolved from SQLite. Shows the
 * curated popularity score, known facts, biography and similar celebrities, and lets
 * the user like / unlike (which writes to the same swipe log as Discover).
 */
export default function CelebrityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: celebrity, status } = useQuery({
    queryKey: ['celebrity', id],
    queryFn: () => celebrityRepository.getById(id),
    enabled: Boolean(id),
  });

  const { data: similar = [] } = useQuery({
    queryKey: ['celebrity', id, 'similar'],
    queryFn: () => celebrityRepository.getSimilar(id, 12),
    enabled: Boolean(id),
  });

  const { data: action } = useQuery({
    queryKey: ['celebrity', id, 'action'],
    queryFn: () => swipeRepository.hasAction(id),
    enabled: Boolean(id),
  });

  const toggleLike = async () => {
    if (!celebrity) return;
    tapSelection();
    if (action === 'like') {
      await swipeRepository.removeSwipe(celebrity.id);
    } else {
      await swipeRepository.saveSwipe(celebrity.id, 'like');
    }
    await queryClient.invalidateQueries({ queryKey: ['celebrity', id, 'action'] });
    await queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY });
  };

  if (status === 'pending') {
    return (
      <Screen>
        <LoadingState label="Loading profile…" />
      </Screen>
    );
  }

  if (status === 'error' || !celebrity) {
    return (
      <Screen>
        <Header onBack={() => router.back()} />
        <EmptyState
          icon="person-outline"
          title="Profile unavailable"
          message="We couldn't find this celebrity in your local data."
        />
      </Screen>
    );
  }

  const age = getAge(celebrity.dateOfBirth);
  const birth = formatDate(celebrity.dateOfBirth);

  return (
    <Screen>
      <Header onBack={() => router.back()} liked={action === 'like'} onToggleLike={toggleLike} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <CelebrityImage
            name={celebrity.name}
            seed={celebrity.id}
            imageUrl={celebrity.imageUrl}
            style={styles.heroImage}
            initialsFontSize={72}
          />
          <LinearGradient
            colors={['rgba(16,16,20,0)', 'rgba(16,16,20,0.9)']}
            locations={[0.5, 1]}
            style={styles.heroScrim}
          />
          <View style={styles.heroText}>
            <View style={styles.nameRow}>
              <AppText variant="display" style={styles.heroName} numberOfLines={2}>
                {celebrity.name}
              </AppText>
              {celebrity.isVerified ? (
                <Ionicons name="checkmark-circle" size={SIZES.iconLg} color={COLORS.primary} />
              ) : null}
            </View>
            {celebrity.occupation ? (
              <AppText variant="bodyBold" color="primaryLight">
                {celebrity.occupation}
              </AppText>
            ) : null}
          </View>
        </View>

        <PopularityMeter score={celebrity.popularityScore} />

        {celebrity.categories.length > 0 ? (
          <View style={styles.chips}>
            {celebrity.categories.map((category) => (
              <Chip key={category.id} label={category.name} active />
            ))}
          </View>
        ) : null}

        <Section title="About">
          <AppText variant="body" style={styles.bio}>
            {celebrity.biography ?? celebrity.shortDescription ?? 'No biography available yet.'}
          </AppText>
        </Section>

        {celebrity.accomplishments.length > 0 ? (
          <Section title="Notable accomplishments">
            <View style={styles.accomplishments}>
              {celebrity.accomplishments.map((item, index) => (
                <View key={`${celebrity.id}-ac-${index}`} style={styles.accomplishment}>
                  <Ionicons
                    name="ribbon-outline"
                    size={SIZES.iconMd}
                    color={COLORS.primary}
                    style={styles.accomplishmentIcon}
                  />
                  <AppText variant="body" style={styles.accomplishmentText}>
                    {item}
                  </AppText>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Profile">
          <InfoRow icon="flag-outline" label="Country" value={celebrity.country?.name ?? '—'} leadingEmoji={celebrity.country?.flagEmoji} />
          <InfoRow icon="calendar-outline" label="Born" value={birth ?? 'Unknown'} />
          {age != null ? <InfoRow icon="hourglass-outline" label="Age" value={`${age} years`} /> : null}
          <InfoRow icon="pin-outline" label="Birthplace" value={celebrity.birthplace ?? '—'} />
          {celebrity.knownFor ? (
            <InfoRow icon="star-outline" label="Known for" value={celebrity.knownFor} />
          ) : null}
        </Section>

        {similar.length > 0 ? (
          <Section title="Similar celebrities">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarRow}>
              {similar.map((item) => (
                <SimilarTile
                  key={item.id}
                  celebrity={item}
                  onPress={() => router.push({ pathname: '/celebrity/[id]', params: { id: item.id } })}
                />
              ))}
            </ScrollView>
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

interface HeaderProps {
  onBack: () => void;
  liked?: boolean;
  onToggleLike?: () => void;
}

function Header({ onBack, liked, onToggleLike }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={SIZES.iconMd} color={COLORS.text} />
      </Pressable>
      <AppText variant="subtitle" style={styles.headerTitle} numberOfLines={1}>
        Profile
      </AppText>
      {onToggleLike ? (
        <Pressable onPress={onToggleLike} hitSlop={10} style={styles.headerButton} accessibilityRole="button" accessibilityLabel={liked ? 'Unlike' : 'Like'}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={SIZES.iconMd}
            color={liked ? COLORS.like : COLORS.text}
          />
        </Pressable>
      ) : (
        <View style={styles.headerButton} />
      )}
    </View>
  );
}

function PopularityMeter({ score }: { score: number }) {
  const tier = popularityTier(score);
  return (
    <View style={styles.meter}>
      <View style={styles.meterTop}>
        <AppText variant="overline">Popularity index</AppText>
        <AppText variant="subtitle" style={{ color: tier.color }}>
          {score}/100 · {tier.label}
        </AppText>
      </View>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: tier.color }]} />
      </View>
      <AppText variant="caption" color="textMuted" style={styles.meterNote}>
        A curated editorial index (0–100), not a live follower count.
      </AppText>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  leadingEmoji?: string | null;
}

function InfoRow({ icon, label, value, leadingEmoji }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={SIZES.iconMd} color={COLORS.textMuted} style={styles.infoIcon} />
      <AppText variant="caption" color="textMuted" style={styles.infoLabel}>
        {label}
      </AppText>
      <View style={styles.infoValueWrap}>
        {leadingEmoji ? <AppText style={styles.infoEmoji}>{leadingEmoji}</AppText> : null}
        <AppText variant="bodyBold" style={styles.infoValue} numberOfLines={2}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

interface SimilarTileProps {
  celebrity: CelebrityDetail;
  onPress: () => void;
}

function SimilarTile({ celebrity, onPress }: SimilarTileProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.similarTile, pressed && styles.pressed]}>
      <CelebrityImage
        name={celebrity.name}
        seed={celebrity.id}
        imageUrl={celebrity.imageUrl}
        style={styles.similarImage}
        initialsFontSize={22}
      />
      <AppText variant="label" numberOfLines={1} style={styles.similarName}>
        {celebrity.name}
      </AppText>
      <AppText variant="caption" color="textMuted" numberOfLines={1}>
        {celebrity.popularityScore}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  hero: {
    height: 320,
    borderRadius: SIZES.cardRadius,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  heroImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  heroText: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  heroName: {
    flexShrink: 1,
    lineHeight: 40,
  },
  meter: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  meterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meterTrack: {
    marginTop: SPACING.md,
    height: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSecondary,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  meterNote: {
    marginTop: SPACING.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  bio: {
    color: COLORS.text,
    lineHeight: 22,
  },
  accomplishments: {
    gap: SPACING.md,
  },
  accomplishment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  accomplishmentIcon: {
    marginTop: 2,
  },
  accomplishmentText: {
    flex: 1,
    color: COLORS.text,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  infoIcon: {
    marginRight: SPACING.md,
  },
  infoLabel: {
    width: 92,
  },
  infoValueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoEmoji: {
    fontSize: 16,
  },
  infoValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontWeight: WEIGHTS.medium,
  },
  similarRow: {
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  similarTile: {
    width: 108,
  },
  pressed: {
    opacity: 0.8,
  },
  similarImage: {
    width: 108,
    height: 108,
    borderRadius: RADII.lg,
    marginBottom: SPACING.sm,
  },
  similarName: {
    color: COLORS.text,
  },
});
