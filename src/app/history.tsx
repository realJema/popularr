import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/common/AppBar';
import { AppText } from '@/components/common/AppText';
import { CelebrityImage } from '@/components/common/CelebrityImage';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorPanel } from '@/components/common/ErrorPanel';
import { LoadingState } from '@/components/common/LoadingState';
import { Screen } from '@/components/common/Screen';
import { COLORS, RADII, SIZES, SPACING } from '@/constants/theme';
import { swipeRepository } from '@/database/queries';
import { HISTORY_QUERY_KEY, LIKES_QUERY_KEY } from '@/hooks/useDiscoverDeck';
import type { SwipeAction, SwipeHistoryEntry } from '@/types/models';
import { timeAgo } from '@/utils/celebrity';
import { tapSelection } from '@/utils/haptics';

type Filter = 'all' | SwipeAction;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'like', label: 'Liked' },
  { key: 'pass', label: 'Passed' },
];

/**
 * History — a chronological log of every swipe (likes and passes). Removing an
 * entry deletes the underlying swipe, so the celebrity becomes unseen again and
 * can reappear in the Discover deck.
 */
export default function HistoryScreen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');

  const { data, status, refetch, isRefetching } = useQuery({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: () => swipeRepository.getHistory(),
  });

  const entries = useMemo(() => {
    if (!data) return [];
    return filter === 'all' ? data : data.filter((entry) => entry.action === filter);
  }, [data, filter]);

  const openDetails = useCallback((id: string) => {
    tapSelection();
    router.push({ pathname: '/celebrity/[id]', params: { id } });
  }, []);

  const removeEntry = useCallback(
    async (id: string) => {
      tapSelection();
      await swipeRepository.removeSwipe(id);
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY });
    },
    [queryClient]
  );

  return (
    <Screen>
      <AppBar title="History" onBack={() => router.back()} />

      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <FilterTab
            key={item.key}
            label={item.label}
            active={filter === item.key}
            onPress={() => setFilter(item.key)}
          />
        ))}
      </View>

      {status === 'pending' ? (
        <LoadingState label="Loading your history…" />
      ) : status === 'error' ? (
        <ErrorPanel onRetry={() => void refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Nothing here yet"
          message={
            filter === 'all'
              ? 'Celebrities you swipe on will show up here.'
              : `No ${filter === 'like' ? 'likes' : 'passes'} recorded yet.`
          }
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => `${item.celebrity.id}-${item.action}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          renderItem={({ item }) => (
            <HistoryRow
              entry={item}
              onOpen={() => openDetails(item.celebrity.id)}
              onRemove={() => void removeEntry(item.celebrity.id)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function FilterTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterTab, active && styles.filterTabActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}>
      <AppText variant="label" color={active ? 'white' : 'secondary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

function HistoryRow({
  entry,
  onOpen,
  onRemove,
}: {
  entry: SwipeHistoryEntry;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const isLike = entry.action === 'like';
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onOpen}
      accessibilityRole="button">
      <CelebrityImage
        name={entry.celebrity.name}
        seed={entry.celebrity.id}
        imageUrl={entry.celebrity.imageUrl}
        round
        initialsFontSize={16}
        style={styles.avatar}
      />
      <View style={styles.rowBody}>
        <AppText variant="subtitle" numberOfLines={1}>
          {entry.celebrity.name}
        </AppText>
        <View style={styles.metaRow}>
          <Ionicons
            name={isLike ? 'heart' : 'close'}
            size={12}
            color={isLike ? COLORS.like : COLORS.pass}
          />
          <AppText variant="label" color={isLike ? 'success' : 'error'} style={styles.actionLabel}>
            {isLike ? 'Liked' : 'Passed'}
          </AppText>
          <AppText variant="label" color="muted" numberOfLines={1} style={styles.occupation}>
            · {entry.celebrity.occupation}
          </AppText>
        </View>
      </View>
      <View style={styles.rowRight}>
        <AppText variant="label" color="muted" style={styles.time}>
          {timeAgo(entry.createdAt)}
        </AppText>
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={styles.removeButton}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${entry.celebrity.name} from history`}>
          <Ionicons name="trash-outline" size={SIZES.iconMd} color={COLORS.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  filterTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xs,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowPressed: {
    backgroundColor: COLORS.surfaceSecondary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  rowBody: {
    flex: 1,
    gap: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionLabel: {},
  occupation: {
    flexShrink: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  time: {},
  removeButton: {
    padding: 2,
  },
});
