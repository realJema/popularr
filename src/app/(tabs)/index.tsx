import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { DeckCard, type ExitSignal } from '@/components/discover/DeckCard';
import { SwipeControls } from '@/components/discover/SwipeControls';
import { COLORS, RADII, SIZES, SPACING } from '@/constants/theme';
import { useDiscoverDeck } from '@/hooks/useDiscoverDeck';
import type { CelebrityDetail, SwipeAction } from '@/types/models';
import { swipeLike, swipePass, tapSelection, undoSwipe } from '@/utils/haptics';

/**
 * Discover — the Tinder-style swipe deck. Renders a small stack of unseen
 * celebrities; each committed swipe is written to SQLite and the Likes list is
 * invalidated so the two screens never disagree.
 */
export default function DiscoverScreen() {
  const router = useRouter();
  const { status, visible, remaining, canUndo, isExhausted, swipe, undo, refresh } =
    useDiscoverDeck();
  const [exit, setExit] = useState<ExitSignal | null>(null);

  const handleSwipe = useCallback(
    (celebrity: CelebrityDetail, action: SwipeAction) => {
      if (action === 'like') swipeLike();
      else swipePass();
      setExit(null);
      void swipe(celebrity, action);
    },
    [swipe]
  );

  const triggerButtonSwipe = useCallback(
    (action: SwipeAction) => {
      if (visible.length === 0) return;
      setExit((prev) => ({ token: (prev?.token ?? 0) + 1, action }));
    },
    [visible.length]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undoSwipe();
    void undo();
  }, [canUndo, undo]);

  const openDetails = useCallback(
    (id: string) => {
      tapSelection();
      router.push({ pathname: '/celebrity/[id]', params: { id } });
    },
    [router]
  );

  const openSearch = useCallback(() => {
    tapSelection();
    router.push('/explore');
  }, [router]);

  const hasDeck = status === 'ready' && visible.length > 0;

  return (
    <Screen>
      <ScreenHeader
        title="Discover"
        subtitle="Swipe right to like, left to pass"
        right={
          <View style={styles.headerRight}>
            {status === 'ready' ? (
              <View style={styles.remaining}>
                <AppText variant="label" color="primary">
                  {remaining}
                </AppText>
                <AppText variant="label" color="textMuted">
                  left
                </AppText>
              </View>
            ) : null}
            <Pressable
              onPress={openSearch}
              hitSlop={8}
              style={styles.searchBtn}
              accessibilityRole="button"
              accessibilityLabel="Search celebrities">
              <Ionicons name="search" size={SIZES.iconMd} color={COLORS.text} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.deckArea}>
        {status === 'loading' ? (
          <LoadingState label="Finding celebrities…" />
        ) : status === 'error' ? (
          <ErrorPanel onRetry={refresh} />
        ) : isExhausted ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="You're all caught up"
            message="You've seen every celebrity for now. Check back after exploring more categories."
          />
        ) : (
          <>
            {visible.map((celebrity, position) => (
              <DeckCard
                key={celebrity.id}
                celebrity={celebrity}
                position={position}
                isActive={position === 0}
                exit={exit}
                canUndo={canUndo}
                onSwipe={handleSwipe}
                onRequestInfo={() => openDetails(celebrity.id)}
                onUndo={handleUndo}
              />
            ))}
          </>
        )}
      </View>

      <SwipeControls
        onPass={() => triggerButtonSwipe('pass')}
        onLike={() => triggerButtonSwipe('like')}
        disabled={!hasDeck}
      />
    </Screen>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.errorPanel}>
      <EmptyState
        icon="cloud-offline-outline"
        title="Couldn't load celebrities"
        message="Something went wrong reading your local data."
      />
      <Pressable onPress={onRetry} style={styles.retry} android_ripple={{ color: COLORS.primaryDark }}>
        <Ionicons name="refresh" size={16} color={COLORS.text} />
        <AppText variant="bodyBold" style={styles.retryText}>
          Try again
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  deckArea: {
    flex: 1,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remaining: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADII.pill,
  },
  retryText: {
    color: COLORS.text,
  },
});
