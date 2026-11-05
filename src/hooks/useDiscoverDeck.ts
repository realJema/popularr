import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { celebrityRepository, preferencesRepository, swipeRepository } from '@/database/queries';
import { rankByAffinity } from '@/services/recommendations';
import { useAppStore } from '@/store/useAppStore';
import type { CelebrityDetail, SwipeAction } from '@/types/models';

/** Shared query keys so a like/unlike refreshes the Likes list everywhere. */
export const LIKES_QUERY_KEY = ['likes'] as const;
/** Shared query key for the full swipe history (History screen + resets). */
export const HISTORY_QUERY_KEY = ['history'] as const;

const VISIBLE_COUNT = 3;
const MAX_DECK = 1000;

interface SwipeEntry {
  celebrity: CelebrityDetail;
  action: SwipeAction;
}

export type DeckStatus = 'loading' | 'ready' | 'error';

/**
 * Owns the Discover session: the queue of not-yet-seen celebrities and a pointer
 * that advances on each swipe. Swipes are persisted immediately; `undo` removes the
 * exact action for the restored card (not just the global last), so the deck and
 * the Likes list stay consistent. Uses plain state (not React Query) because the
 * deck is a highly interactive, session-scoped cursor.
 */
export function useDiscoverDeck() {
  const queryClient = useQueryClient();
  const [deck, setDeck] = useState<CelebrityDetail[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<DeckStatus>('loading');

  const history = useRef<SwipeEntry[]>([]);
  const [undoDepth, setUndoDepth] = useState(0);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [all, seen, prefs] = await Promise.all([
        celebrityRepository.getAll(MAX_DECK),
        swipeRepository.getSeenCelebrityIds(),
        preferencesRepository.get(),
      ]);
      const unseen = all.filter((celebrity) => !seen.has(celebrity.id));
      history.current = [];
      setUndoDepth(0);
      setDeck(rankByAffinity(unseen, prefs));
      setIndex(0);
      setStatus('ready');
    } catch (error) {
      console.warn('Failed to load discovery deck', error);
      setStatus('error');
    }
  }, []);

  // Reload when the swipe catalogue changes elsewhere (e.g. reset history).
  const deckNonce = useAppStore((state) => state.deckNonce);

  useEffect(() => {
    void load();
  }, [load, deckNonce]);

  const swipe = useCallback(
    async (celebrity: CelebrityDetail, action: SwipeAction) => {
      history.current.push({ celebrity, action });
      setUndoDepth((depth) => depth + 1);
      setIndex((i) => i + 1);
      try {
        await swipeRepository.saveSwipe(celebrity.id, action);
        if (action === 'like') {
          queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY });
        }
      } catch (error) {
        console.warn('Failed to persist swipe', error);
      }
    },
    [queryClient]
  );

  const undo = useCallback(async () => {
    const last = history.current.pop();
    if (!last) return;
    setUndoDepth((depth) => Math.max(0, depth - 1));
    setIndex((i) => Math.max(0, i - 1));
    try {
      await swipeRepository.removeSwipe(last.celebrity.id);
      if (last.action === 'like') {
        queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY });
      }
    } catch (error) {
      console.warn('Failed to undo swipe', error);
    }
  }, [queryClient]);

  const visible = useMemo(() => deck.slice(index, index + VISIBLE_COUNT), [deck, index]);

  return {
    status,
    visible,
    remaining: Math.max(0, deck.length - index),
    canUndo: undoDepth > 0,
    isExhausted: status === 'ready' && index >= deck.length,
    swipe,
    undo,
    refresh: load,
  };
}
