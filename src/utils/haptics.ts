import * as Haptics from 'expo-haptics';

/**
 * Lightweight haptic feedback helpers. Every call is fire-and-forget and swallows
 * errors so devices/simulators without a taptic engine never surface a failure.
 */

const noop = () => {};

export function tapSelection(): void {
  Haptics.selectionAsync().catch(noop);
}

export function swipeLike(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(noop);
}

export function swipePass(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(noop);
}

export function undoSwipe(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(noop);
}
