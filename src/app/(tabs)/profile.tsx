import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { COLORS, RADII, SIZES, SPACING } from '@/constants/theme';
import { preferencesRepository, swipeRepository } from '@/database/queries';
import { HISTORY_QUERY_KEY, LIKES_QUERY_KEY } from '@/hooks/useDiscoverDeck';
import { useAppStore } from '@/store/useAppStore';
import { tapSelection } from '@/utils/haptics';

const STATS_QUERY_KEY = ['swipe-stats'] as const;
const PREFERENCES_QUERY_KEY = ['preferences'] as const;

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Profile / Settings — local activity summary plus entry points to Likes,
 * History and Preferences. All data is read from and written to SQLite; there
 * is no account or network layer.
 */
export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const bumpDeck = useAppStore((state) => state.bumpDeck);

  const stats = useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: async () => {
      const [likes, passes] = await Promise.all([
        swipeRepository.countByAction('like'),
        swipeRepository.countByAction('pass'),
      ]);
      return { likes, passes };
    },
  });

  const prefs = useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: () => preferencesRepository.get(),
  });

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
  }, [queryClient]);

  const resetHistory = useCallback(() => {
    Alert.alert(
      'Reset swipe history?',
      'This clears every like and pass. Liked celebrities and history will be emptied, and everyone can appear in Discover again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            tapSelection();
            await swipeRepository.clearHistory();
            refreshAll();
            bumpDeck();
          },
        },
      ]
    );
  }, [refreshAll, bumpDeck]);

  const resetPreferences = useCallback(() => {
    Alert.alert(
      'Reset preferences?',
      'This clears your favourite categories and countries.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            tapSelection();
            await preferencesRepository.update({ preferredCategories: [], preferredCountries: [] });
            queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY });
          },
        },
      ]
    );
  }, [queryClient]);

  const likes = stats.data?.likes ?? 0;
  const passes = stats.data?.passes ?? 0;
  const total = likes + passes;

  const categoryCount = prefs.data?.preferredCategories.length ?? 0;
  const countryCount = prefs.data?.preferredCountries.length ?? 0;
  const prefsSummary =
    categoryCount === 0 && countryCount === 0
      ? 'Not set'
      : `${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'} · ${countryCount} ${
          countryCount === 1 ? 'country' : 'countries'
        }`;

  return (
    <Screen>
      <ScreenHeader title="Profile" subtitle="Settings, stats & history" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsCard}>
          <StatItem value={likes} label="Likes" icon="heart" color={COLORS.like} />
          <View style={styles.statDivider} />
          <StatItem value={passes} label="Passes" icon="close" color={COLORS.pass} />
          <View style={styles.statDivider} />
          <StatItem value={total} label="Swiped" icon="layers" color={COLORS.primary} />
        </View>

        <SectionLabel label="Your activity" />
        <View style={styles.group}>
          <SettingsRow
            icon="heart"
            title="Liked celebrities"
            value={String(likes)}
            onPress={() => router.push('/likes')}
          />
          <SettingsRow
            icon="time-outline"
            title="Swipe history"
            value={String(total)}
            onPress={() => router.push('/history')}
          />
        </View>

        <SectionLabel label="Discovery" />
        <View style={styles.group}>
          <SettingsRow
            icon="options-outline"
            title="Preferences"
            subtitle="Favourite categories & countries"
            value={prefsSummary}
            onPress={() => router.push('/preferences')}
          />
        </View>

        <SectionLabel label="Data & storage" />
        <View style={styles.group}>
          <SettingsRow
            icon="refresh-outline"
            title="Reset preferences"
            subtitle="Clear favourite categories and countries"
            danger
            onPress={resetPreferences}
          />
          <SettingsRow
            icon="trash-outline"
            title="Reset swipe history"
            subtitle="Delete all likes and passes"
            danger
            onPress={resetHistory}
          />
        </View>

        <AppText variant="caption" color="muted" align="center" style={styles.footer}>
          Popularr · a local-first demo. Everything stays on your device.
        </AppText>
      </ScrollView>
    </Screen>
  );
}

function StatItem({
  value,
  label,
  icon,
  color,
}: {
  value: number;
  label: string;
  icon: IconName;
  color: string;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={SIZES.iconMd} color={color} />
      <AppText variant="title">{value}</AppText>
      <AppText variant="label" color="muted">
        {label}
      </AppText>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <AppText variant="overline" style={styles.sectionLabel}>
      {label}
    </AppText>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  danger,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tapSelection();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button">
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={SIZES.iconMd} color={danger ? COLORS.danger : COLORS.primary} />
      </View>
      <View style={styles.rowBody}>
        <AppText variant="bodyBold" color={danger ? 'error' : 'text'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="label" color="muted" style={styles.rowValue} numberOfLines={1}>
          {value}
        </AppText>
      ) : null}
      <Ionicons name="chevron-forward" size={SIZES.iconMd} color={COLORS.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: COLORS.border,
  },
  sectionLabel: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  rowPressed: {
    backgroundColor: COLORS.surfaceSecondary,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowValue: {
    maxWidth: 130,
    textAlign: 'right',
  },
  footer: {
    marginTop: SPACING.xl,
  },
});
