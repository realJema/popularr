import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/common/AppBar';
import { AppText } from '@/components/common/AppText';
import { CelebrityImage } from '@/components/common/CelebrityImage';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { Screen } from '@/components/common/Screen';
import { SearchBar } from '@/components/common/SearchBar';
import { COLORS, RADII, SHADOWS, SPACING } from '@/constants/theme';
import { swipeRepository } from '@/database/queries';
import { LIKES_QUERY_KEY } from '@/hooks/useDiscoverDeck';
import type { CelebrityDetail } from '@/types/models';
import { tapSelection } from '@/utils/haptics';

/**
 * Likes — locally persisted favourites. Backed by React Query so it stays in sync
 * with the Discover deck (like/undo invalidate this key). Reached from Profile and
 * pushed as a stack screen (so it has a back affordance). Supports search and
 * removing a like; each tile deep-links to the celebrity's detail screen.
 */
export default function LikesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');

  const { data, status, refetch, isRefetching } = useQuery({
    queryKey: LIKES_QUERY_KEY,
    queryFn: () => swipeRepository.getLikedCelebrities(),
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.occupation ?? '').toLowerCase().includes(term)
    );
  }, [data, query]);

  const removeLike = async (id: string) => {
    tapSelection();
    await swipeRepository.removeSwipe(id);
    await queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY });
  };

  const openDetails = (id: string) => {
    router.push({ pathname: '/celebrity/[id]', params: { id } });
  };

  return (
    <Screen>
      <AppBar
        title="Likes"
        onBack={() => router.back()}
        right={
          data && data.length > 0 ? (
            <View style={styles.count}>
              <AppText variant="label" color="primary">
                {data.length}
              </AppText>
            </View>
          ) : null
        }
      />

      {status === 'pending' ? (
        <LoadingState label="Loading your likes…" />
      ) : status === 'error' ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load likes"
          message="Your saved likes couldn't be read from local storage."
        />
      ) : data && data.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No likes yet"
          message="Swipe right on celebrities in Discover and they'll be saved here."
        />
      ) : (
        <>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search your likes" />
          <FlatList
            data={filtered}
            numColumns={2}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            refreshing={isRefetching}
            onRefresh={refetch}
            ListEmptyComponent={
              <EmptyState
                icon="search-outline"
                title="No matches"
                message="No liked celebrity matches your search."
              />
            }
            renderItem={({ item }) => (
              <LikeTile
                celebrity={item}
                onOpen={() => openDetails(item.id)}
                onRemove={() => removeLike(item.id)}
              />
            )}
          />
        </>
      )}
    </Screen>
  );
}

interface LikeTileProps {
  celebrity: CelebrityDetail;
  onOpen: () => void;
  onRemove: () => void;
}

function LikeTile({ celebrity, onOpen, onRemove }: LikeTileProps) {
  return (
    <Pressable style={({ pressed }) => [styles.tile, pressed && styles.pressed]} onPress={onOpen}>
      <CelebrityImage
        name={celebrity.name}
        seed={celebrity.id}
        imageUrl={celebrity.imageUrl}
        style={styles.tileImage}
        initialsFontSize={30}
      />
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        style={styles.removeButton}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${celebrity.name}`}>
        <Ionicons name="close" size={16} color={COLORS.text} />
      </Pressable>

      <View style={styles.tileBody}>
        <AppText variant="bodyBold" numberOfLines={1}>
          {celebrity.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} color="textMuted">
          {celebrity.occupation ?? celebrity.country?.name ?? 'Celebrity'}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  count: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADII.pill,
    minWidth: 34,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    gap: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  tile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  pressed: {
    opacity: 0.85,
  },
  tileImage: {
    width: '100%',
    aspectRatio: 1,
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBody: {
    padding: SPACING.md,
  },
});
