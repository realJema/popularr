import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    type ListRenderItem,
} from 'react-native';

import { AppBar } from '@/components/common/AppBar';
import { AppText } from '@/components/common/AppText';
import { CelebrityTile } from '@/components/common/CelebrityTile';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorPanel } from '@/components/common/ErrorPanel';
import { LoadingState } from '@/components/common/LoadingState';
import { Screen } from '@/components/common/Screen';
import { SearchBar } from '@/components/common/SearchBar';
import { FilterSheet, type FilterValues } from '@/components/explore/FilterSheet';
import { COLORS, RADII, SIZES, SPACING } from '@/constants/theme';
import { categoryRepository, celebrityRepository, countryRepository, preferencesRepository } from '@/database/queries';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getRecommendedForYou, hasPreferences } from '@/services/recommendations';
import type { CelebrityDetail } from '@/types/models';
import { tapSelection } from '@/utils/haptics';

const RESULT_LIMIT = 200;

/**
 * Explore — free-text search plus category / country / popularity filters over
 * the local catalogue. Reached from the Discover header's search icon (pushed as
 * a stack screen, so it has a back affordance). When no filters are active and
 * the user has saved preferences, a personalised "Recommended for you" rail shows
 * above the full browse grid.
 */
export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [filters, setFilters] = useState<FilterValues>({ categoryIds: [], countryIds: [] });
  const [sheetOpen, setSheetOpen] = useState(false);

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => categoryRepository.getAll() });
  const countries = useQuery({ queryKey: ['countries'], queryFn: () => countryRepository.getAll() });

  const trimmed = debouncedQuery.trim();
  const hasFilters =
    trimmed.length > 0 ||
    filters.categoryIds.length > 0 ||
    filters.countryIds.length > 0 ||
    filters.minPopularity !== undefined;

  const results = useQuery({
    queryKey: ['explore', trimmed, filters.categoryIds, filters.countryIds, filters.minPopularity ?? 0],
    queryFn: () =>
      celebrityRepository.filter({
        query: trimmed || undefined,
        categoryIds: filters.categoryIds.length ? filters.categoryIds : undefined,
        countryIds: filters.countryIds.length ? filters.countryIds : undefined,
        minPopularity: filters.minPopularity,
        limit: RESULT_LIMIT,
      }),
  });

  const recommended = useQuery({
    queryKey: ['explore-recommended'],
    enabled: !hasFilters,
    queryFn: () => getRecommendedForYou(16),
  });

  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesRepository.get(),
  });
  const prefsSaved = useMemo(
    () => (preferencesQuery.data ? hasPreferences(preferencesQuery.data) : false),
    [preferencesQuery.data]
  );

  const openDetails = useCallback((id: string) => {
    tapSelection();
    router.push({ pathname: '/celebrity/[id]', params: { id } });
  }, []);

  const renderItem: ListRenderItem<CelebrityDetail> = ({ item, index }) => (
    <CelebrityTile
      celebrity={item}
      onPress={() => openDetails(item.id)}
      style={index % 2 === 1 ? styles.tileRight : styles.tileLeft}
    />
  );

  const activeChips: ActiveChip[] = [];
  for (const id of filters.categoryIds) {
    const category = (categories.data ?? []).find((item) => item.id === id);
    if (!category) continue;
    activeChips.push({
      key: `cat-${id}`,
      label: category.name,
      onRemove: () => setFilters((prev) => ({ ...prev, categoryIds: prev.categoryIds.filter((v) => v !== id) })),
    });
  }
  for (const id of filters.countryIds) {
    const country = (countries.data ?? []).find((item) => item.id === id);
    if (!country) continue;
    activeChips.push({
      key: `country-${id}`,
      label: country.name,
      leading: country.flagEmoji ?? undefined,
      onRemove: () => setFilters((prev) => ({ ...prev, countryIds: prev.countryIds.filter((v) => v !== id) })),
    });
  }
  if (filters.minPopularity !== undefined) {
    activeChips.push({
      key: 'popularity',
      label: `${filters.minPopularity}+ popularity`,
      onRemove: () => setFilters((prev) => ({ ...prev, minPopularity: undefined })),
    });
  }

  const showRecommended = !hasFilters && prefsSaved && recommended.status === 'success' && !!recommended.data?.length;

  return (
    <Screen>
      <AppBar
        title="Explore"
        onBack={() => router.back()}
        right={
          <FiltersButton
            count={filters.categoryIds.length + filters.countryIds.length + (filters.minPopularity !== undefined ? 1 : 0)}
            onPress={() => {
              tapSelection();
              setSheetOpen(true);
            }}
          />
        }
      />

      <SearchBar value={query} onChangeText={setQuery} placeholder="Search by name, country, category…" />

      {activeChips.length > 0 ? (
        <View style={styles.activeRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeScroll}>
            {activeChips.map((chip) => (
              <Pressable key={chip.key} onPress={chip.onRemove} accessibilityRole="button">
                <View style={styles.activeChip}>
                  {chip.leading ? <AppText style={styles.activeFlag}>{chip.leading}</AppText> : null}
                  <AppText variant="label" color="primary">
                    {chip.label}
                  </AppText>
                  <Ionicons name="close" size={13} color={COLORS.primary} />
                </View>
              </Pressable>
            ))}
            <Pressable onPress={() => setFilters({ categoryIds: [], countryIds: [] })} accessibilityRole="button">
              <AppText variant="label" color="muted" style={styles.clearAll}>
                Clear all
              </AppText>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}

      {results.status === 'pending' ? (
        <LoadingState label="Searching…" />
      ) : results.status === 'error' ? (
        <ErrorPanel onRetry={() => void results.refetch()} />
      ) : (
        <FlatList
          data={results.data ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            showRecommended ? (
              <RecommendedRail
                celebrities={recommended.data ?? []}
                onSelect={(id) => openDetails(id)}
              />
            ) : (
              <View style={styles.resultsHeader}>
                <AppText variant="overline">
                  {hasFilters ? 'Results' : 'Popular right now'}
                </AppText>
                <AppText variant="label" color="muted">
                  {results.data?.length ?? 0}
                </AppText>
              </View>
            )
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No matches"
              message="Try a different name, or loosen your filters."
            />
          }
          renderItem={renderItem}
        />
      )}

      <FilterSheet
        visible={sheetOpen}
        categories={categories.data ?? []}
        countries={countries.data ?? []}
        initial={filters}
        onClose={() => setSheetOpen(false)}
        onApply={setFilters}
      />
    </Screen>
  );
}

interface ActiveChip {
  key: string;
  label: string;
  leading?: string;
  onRemove: () => void;
}

function FiltersButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.filtersButton, pressed && styles.filtersButtonPressed]}
      accessibilityRole="button"
      accessibilityLabel="Open filters">
      <Ionicons name="options-outline" size={SIZES.iconSm} color={COLORS.text} />
      <AppText variant="label">Filters</AppText>
      {count > 0 ? (
        <View style={styles.filtersBadge}>
          <AppText variant="label" color="white" style={styles.filtersBadgeText}>
            {count}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

function RecommendedRail({ celebrities, onSelect }: { celebrities: CelebrityDetail[]; onSelect: (id: string) => void }) {
  return (
    <View style={styles.recommended}>
      <AppText variant="overline" style={styles.recommendedLabel}>
        Recommended for you
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railScroll}>
        {celebrities.map((celebrity) => (
          <CelebrityTile
            key={celebrity.id}
            celebrity={celebrity}
            onPress={() => onSelect(celebrity.id)}
            style={styles.railTile}
          />
        ))}
      </ScrollView>
      <AppText variant="overline" style={styles.railSectionLabel}>
        Popular right now
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  activeRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  activeScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activeFlag: {
    fontSize: 12,
  },
  clearAll: {
    paddingHorizontal: SPACING.sm,
    textDecorationLine: 'underline',
  },
  columnWrapper: {
    gap: SPACING.md,
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  tileLeft: {
    marginBottom: 0,
  },
  tileRight: {
    marginBottom: 0,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  recommended: {
    marginBottom: SPACING.sm,
  },
  recommendedLabel: {
    marginBottom: SPACING.sm,
  },
  railScroll: {
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  railTile: {
    width: 150,
    flexGrow: 0,
  },
  railSectionLabel: {
    marginTop: SPACING.xs,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filtersButtonPressed: {
    backgroundColor: COLORS.surfaceSecondary,
  },
  filtersBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersBadgeText: {
    fontSize: 11,
  },
});
