import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { COLORS, RADII, SIZES, SPACING, WEIGHTS } from '@/constants/theme';
import type { CelebrityDetail, SwipeAction } from '@/types/models';
import { AppText } from '../common/AppText';
import { CelebrityCard } from './CelebrityCard';

/** Signal from the parent to fly the active card out programmatically (buttons). */
export interface ExitSignal {
  token: number;
  action: SwipeAction;
}

interface DeckCardProps {
  celebrity: CelebrityDetail;
  /** 0 = top/active, 1 and 2 = stacked behind. */
  position: number;
  isActive: boolean;
  exit: ExitSignal | null;
  canUndo: boolean;
  onSwipe: (celebrity: CelebrityDetail, action: SwipeAction) => void;
  onRequestInfo: () => void;
  onUndo: () => void;
}

const STACK_OFFSET = 16;
const STACK_SCALE = 0.06;
const THROW_DURATION = 250;

const ABSOLUTE_FILL = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;

function Stamp({ label, icon, color }: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[styles.stamp, { borderColor: color }]}>
      <Ionicons name={icon} size={22} color={color} />
      <AppText style={[styles.stampText, { color }]}>{label}</AppText>
    </View>
  );
}

interface TopDotProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/** A round, on-card action button (undo / more-info). */
function TopDot({ icon, color, label, onPress, disabled }: TopDotProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.dot, pressed && styles.dotPressed, disabled && styles.dotDisabled]}>
      <Ionicons name={icon} size={SIZES.iconMd} color={color} />
    </Pressable>
  );
}

/**
 * A single draggable card. Owns its own Reanimated shared values and pan gesture;
 * only the active (top) card responds to input. Position-based transforms animate
 * smoothly when a card is promoted up the stack.
 */
export function DeckCard({ celebrity, position, isActive, exit, canUndo, onSwipe, onRequestInfo, onUndo }: DeckCardProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const progress = useSharedValue(position);
  const busy = useSharedValue(0);
  const cardWidth = useSharedValue(0);

  const onSwipeRef = useRef(onSwipe);
  useEffect(() => {
    onSwipeRef.current = onSwipe;
  }, [onSwipe]);

  const commit = useCallback(
    (action: SwipeAction) => {
      onSwipeRef.current(celebrity, action);
    },
    [celebrity]
  );

  // Animate this card's position whenever it is promoted/demoted in the stack.
  useEffect(() => {
    progress.value = withTiming(position, { duration: 220 });
    if (position !== 0) {
      x.value = withTiming(0);
      y.value = withTiming(0);
    }
  }, [position, progress, x, y]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      cardWidth.value = event.nativeEvent.layout.width;
    },
    [cardWidth]
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isActive)
        // Require a small horizontal drag before the swipe activates, so a simple
        // tap on the on-card undo / info buttons is released to their Pressables.
        .activeOffsetX([-15, 15])
        .onUpdate((event) => {
          if (!isActive || busy.value === 1) return;
          x.value = event.translationX;
          y.value = event.translationY;
        })
        .onEnd((event) => {
          if (!isActive || busy.value === 1) return;
          const width = cardWidth.value || 340;
          const reachedThreshold = Math.abs(x.value) > width * 0.3;
          const highVelocity = Math.abs(event.velocityX) > 900;

          if (!reachedThreshold && !highVelocity) {
            x.value = withSpring(0, { damping: 20, stiffness: 180, mass: 0.8 });
            y.value = withSpring(0, { damping: 20, stiffness: 180, mass: 0.8 });
            return;
          }

          const dir = x.value > 0 ? 1 : -1;
          const action: SwipeAction = dir === 1 ? 'like' : 'pass';
          busy.value = 1;
          x.value = withTiming(dir * width * 1.3, { duration: THROW_DURATION }, (finished) => {
            if (finished) runOnJS(commit)(action);
          });
          y.value = withTiming(dir === 1 ? -160 : 160, { duration: THROW_DURATION });
        }),
    [isActive, busy, cardWidth, commit, x, y]
  );

  // Handle button-triggered (programmatic) swipes for the active card.
  const handledToken = useRef(0);
  useEffect(() => {
    if (!isActive || !exit || exit.token === handledToken.current || busy.value === 1) return;
    handledToken.current = exit.token;
    busy.value = 1;
    const width = cardWidth.value || 340;
    const dir = exit.action === 'like' ? 1 : -1;
    x.value = withTiming(dir * width * 1.3, { duration: THROW_DURATION }, (finished) => {
      if (finished) runOnJS(commit)(exit.action);
    });
    y.value = withTiming(dir === 1 ? -160 : 160, { duration: THROW_DURATION });
  }, [exit, isActive, busy, cardWidth, commit, x, y]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value + progress.value * STACK_OFFSET },
      { scale: 1 - progress.value * STACK_SCALE },
      { rotate: `${interpolate(x.value, [-300, 300], [-16, 16], Extrapolation.CLAMP)}deg` },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [24, 110], [0, 1], Extrapolation.CLAMP),
    transform: [
      { rotate: '-14deg' },
      { scale: interpolate(x.value, [0, 110], [0.8, 1], Extrapolation.CLAMP) },
    ],
  }));

  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-110, -24], [1, 0], Extrapolation.CLAMP),
    transform: [
      { rotate: '14deg' },
      { scale: interpolate(x.value, [-110, 0], [1, 0.8], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={[styles.layer, { zIndex: 10 - position }]} pointerEvents={isActive ? 'auto' : 'none'}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.animatedCard, cardStyle]} onLayout={onLayout}>
          <CelebrityCard celebrity={celebrity} />

          {isActive ? (
            <View style={styles.topControls} pointerEvents="box-none">
              <TopDot
                icon="arrow-undo"
                color={COLORS.superLike}
                label="Undo last swipe"
                onPress={onUndo}
                disabled={!canUndo}
              />
              <TopDot
                icon="information-circle-outline"
                color={COLORS.text}
                label={`More info about ${celebrity.name}`}
                onPress={onRequestInfo}
              />
            </View>
          ) : null}

          <Animated.View style={[styles.stampLike, likeStyle]} pointerEvents="none">
            <Stamp label="LIKE" icon="heart" color={COLORS.like} />
          </Animated.View>
          <Animated.View style={[styles.stampPass, passStyle]} pointerEvents="none">
            <Stamp label="NOPE" icon="close" color={COLORS.pass} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...ABSOLUTE_FILL,
  },
  animatedCard: {
    ...ABSOLUTE_FILL,
    borderRadius: RADII.lg,
  },
  stampLike: {
    position: 'absolute',
    top: 84,
    left: SPACING.lg,
  },
  stampPass: {
    position: 'absolute',
    top: 84,
    right: SPACING.lg,
  },
  topControls: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(16,16,20,0.55)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPressed: {
    opacity: 0.7,
  },
  dotDisabled: {
    opacity: 0.3,
  },
  stamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 3,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(16,16,20,0.35)',
  },
  stampText: {
    fontSize: 22,
    fontWeight: WEIGHTS.extrabold,
    letterSpacing: 1,
  },
});
