import { create } from 'zustand';

/**
 * Lightweight cross-screen app state that is awkward to model with React Query.
 *
 * `deckNonce` is bumped whenever the swipe catalogue changes in a way the
 * currently-mounted Discover deck must react to (e.g. "reset swipe history").
 * Discover subscribes to it and reloads; because swipes are persisted to SQLite
 * first, a reload always reflects the latest seen set.
 */
interface AppState {
  deckNonce: number;
  bumpDeck: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  deckNonce: 0,
  bumpDeck: () => set((state) => ({ deckNonce: state.deckNonce + 1 })),
}));
