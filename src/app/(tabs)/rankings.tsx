import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { CelebrityImage } from '@/components/common/CelebrityImage';
import { Chip } from '@/components/common/Chip';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorPanel } from '@/components/common/ErrorPanel';
import { LoadingState } from '@/components/common/LoadingState';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { COLORS, RADII, SHADOWS, SPACING, WEIGHTS } from '@/constants/theme';
import { categoryRepository, countryRepository, rankingRepository } from '@/database/queries';
import type { RankedCelebrity } from '@/types/models';
import { tapSelection } from '@/utils/haptics';

const RANK_LIMIT = 50;

type Board = 'global' | 'trending' | 'country' | 'category';

const BOARDS: { key: Board; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'trending', label: 'Trending' },
  { key: 'country', label: 'Countries' },
  { key: 'category', label: 'Categories' },
];

interface ChipOption {
  id: string;
  label: string;
  leading?: string;
}

/**
 * Rankings — locally computed popularity boards over the SQLite catalogue. Four
 * views share one ranked-list renderer: Global and Trending (blends editorial
 * popularity with recent local likes), plus per-Country and per-Category boards
 * driven by a horizontal picker. Everything is cached with React Query.
 */
export default function RankingsScreen() {
  const router = useRouter();
  const [board, setBoard] = useState<Board>('global');
  const [selectedCountryId, setCountry] = useState<string | null>(null);
  const [selectedCategoryId, setCategory] = useState<string | null>(null);

  const countries = useQuery({ queryKey: ['countries'], queryFn: () => countryRepository.getAll() });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => categoryRepository.getAll() });

  const countryId = selectedCountryId ?? countries.data?.[0]?.id ?? null;
  const categoryId = selectedCategoryId ?? categories.data?.[0]?.id ?? null;

  const activeFilter = board === 'country' ? countryId : board === 'category' ? categoryId : null;
  const boardReady =
    board === 'global' ||
    board === 'trending' ||
    (board === 'country' && !!countryId) ||
    (board === 'category' && !!categoryId);

  const ranked = useQuery({
    queryKey: ['rankings', board, activeFilter],
    enabled: boardReady,
    queryFn: () => {
      if (board === 'global') return rankingRepository.getGlobal(RANK_LIMIT);
      if (board === 'trending') return rankingRepository.getTrending(RANK_LIMIT);
      if (board === 'country') return rankingRepository.getByCountry(countryId as string, RANK_LIMIT);
      return rankingRepository.getByCategory(categoryId as string, RANK_LIMIT);
    },
  });

  const openDetails = (id: string) => {
    tapSelection();
    router.push({ pathname: '/celebrity/[id]', params: { id } });
  };

  const subtitle =
    board === 'global'
      ? 'Top 50 worldwide'
      : board === 'trending'
        ? 'Rising from your recent activity'
        : board === 'country'
          ? (countries.data?.find((c) => c.id === countryId)?.name ?? 'Pick a country')
          : (categories.data?.find((c) => c.id === categoryId)?.name ?? 'Pick a category');

  const countryOptions: ChipOption[] = (countries.data ?? []).map((c) => ({
    id: c.id,
    label: c.name,
    leading: c.flagEmoji ?? undefined,
  }));
  const categoryOptions: ChipOption[] = (categories.data ?? []).map((c) => ({ id: c.id, label: c.name }));

  const showPicker = board === 'country' || board === 'category';
  const pickerLoading =
    showPicker && (board === 'country' ? countries.status === 'pending' : categories.status === 'pending');

  return (
    <Screen>
      <ScreenHeader title="Rankings" subtitle={subtitle} />

      <View style={styles.segment}>
        {BOARDS.map((item) => {
          const active = board === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                tapSelection();
                setBoard(item.key);
              }}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}>
              <AppText variant="label" color={active ? 'white' : 'muted'}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {showPicker && !pickerLoading ? (
        <ChipScroller
          options={board === 'country' ? countryOptions : categoryOptions}
          activeId={board === 'country' ? countryId : categoryId}
          onSelect={board === 'country' ? setCountry : setCategory}
        />
      ) : null}

      {ranked.status === 'pending' ? (
        <LoadingState label="Crunching numbers…" />
      ) : ranked.status === 'error' ? (
        <ErrorPanel onRetry={() => void ranked.refetch()} />
      ) : (
        <FlatList
          data={ranked.data ?? []}
          keyExtractor={(item) => item.celebrity.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={ranked.isRefetching}
          onRefresh={() => void ranked.refetch()}
          ListEmptyComponent={
            <EmptyState
              icon="trophy-outline"
              title="Nothing ranked yet"
              message="There aren't enough celebrities in this slice to build a board yet."
            />
          }
          renderItem={({ item }) => (
            <RankRow entry={item} onPress={() => openDetails(item.celebrity.id)} />
          )}
        />
      )}
    </Screen>
  );
}

function ChipScroller({
  options,
  activeId,
  onSelect,
}: {
  options: ChipOption[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.picker}
      contentContainerStyle={styles.pickerScroll}>
      {options.map((option) => (
        <Pressable
          key={option.id}
          onPress={() => {
            tapSelection();
            onSelect(option.id);
          }}
          accessibilityRole="button"
          accessibilityLabel={option.label}>
          <Chip label={option.label} leading={option.leading} active={option.id === activeId} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

function RankRow({ entry, onPress }: { entry: RankedCelebrity; onPress: () => void }) {
  const { rank, celebrity, score } = entry;
  const medal = rank <= 3;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${rank}, ${celebrity.name}`}>
      <View style={[styles.rank, medal && styles.rankMedal]}>
        <AppText variant="label" color={medal ? 'white' : 'muted'} style={styles.rankText}>
          {rank}
        </AppText>
      </View>

      <CelebrityImage
        name={celebrity.name}
        seed={celebrity.id}
        imageUrl={celebrity.imageUrl}
        round
        style={styles.avatar}
        initialsFontSize={20}
      />

      <View style={styles.info}>
        <AppText variant="bodyBold" numberOfLines={1}>
          {celebrity.name}
        </AppText>
        <AppText variant="caption" color="muted" numberOfLines={1}>
          {celebrity.occupation ?? celebrity.country?.name ?? 'Celebrity'}
        </AppText>
      </View>

      <View style={styles.score}>
        <Ionicons name="flame" size={13} color={COLORS.primary} />
        <AppText variant="label" color="primary">
          {Math.round(score)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: 4,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADII.pill,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: COLORS.primary,
  },
  picker: {
    flexGrow: 0,
    marginBottom: SPACING.sm,
  },
  pickerScroll: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingRight: SPACING.md,
    paddingLeft: SPACING.sm,
    ...SHADOWS.card,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankMedal: {
    backgroundColor: COLORS.primary,
  },
  rankText: {
    fontSize: 13,
    fontWeight: WEIGHTS.bold,
  },
  avatar: {
    width: 52,
    height: 52,
  },
  info: {
    flex: 1,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
  },
});
