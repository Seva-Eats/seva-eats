import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Dimensions } from 'react-native';
import { PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
import { Extrapolate, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const SWIPE_THRESHOLD = 50; // Minimum horizontal distance to trigger navigation
const SWIPE_VELOCITY_THRESHOLD = 500; // Minimum velocity to force navigation

interface SwipeNavigationConfig {
  onSwipeLeft?: () => void; // Called when swiped left (forward)
  onSwipeRight?: () => void; // Called when swiped right (back)
  canSwipeLeft?: boolean; // Disable forward swipe at boundary
  canSwipeRight?: boolean; // Disable back swipe at boundary
  enableHaptics?: boolean; // Enable haptic feedback
}

export const useSwipeNavigation = (config: SwipeNavigationConfig = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    canSwipeLeft = true,
    canSwipeRight = true,
    enableHaptics = true,
  } = config;

  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;

  // Shared animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isGestureActive = useSharedValue(false);

  // Track gesture state
  const gestureStartX = useRef(0);
  const hasTriggeredNavigation = useRef(false);

  // Animated styles for visual feedback during swipe
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  // Handle pan gesture state changes
  const onGestureEvent = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      const { translationX, velocityX, state } = event.nativeEvent;

      switch (state) {
        case State.BEGAN:
          gestureStartX.current = 0;
          hasTriggeredNavigation.current = false;
          isGestureActive.value = true;
          if (enableHaptics) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          break;

        case State.ACTIVE:
          // Update translation while dragging
          translateX.value = translationX;
          // Opacity changes based on drag distance
          opacity.value = interpolate(
            Math.abs(translationX),
            [0, screenWidth * 0.3],
            [1, 0.7],
            Extrapolate.CLAMP
          );
          break;

        case State.END:
        case State.CANCELLED:
          isGestureActive.value = false;

          const isLeftSwipe = translationX < -SWIPE_THRESHOLD && velocityX < -SWIPE_VELOCITY_THRESHOLD / 2;
          const isRightSwipe = translationX > SWIPE_THRESHOLD && velocityX > SWIPE_VELOCITY_THRESHOLD / 2;
          const isLeftSwipeDistance = translationX < -SWIPE_THRESHOLD;
          const isRightSwipeDistance = translationX > SWIPE_THRESHOLD;

          if (!hasTriggeredNavigation.current) {
            if ((isLeftSwipe || isLeftSwipeDistance) && canSwipeLeft && onSwipeLeft) {
              hasTriggeredNavigation.current = true;
              if (enableHaptics) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              onSwipeLeft();
            } else if ((isRightSwipe || isRightSwipeDistance) && canSwipeRight && onSwipeRight) {
              hasTriggeredNavigation.current = true;
              if (enableHaptics) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              onSwipeRight();
            }
          }

          // Reset animation
          translateX.value = 0;
          opacity.value = 1;
          break;
      }
    },
    [
      enableHaptics,
      canSwipeLeft,
      canSwipeRight,
      onSwipeLeft,
      onSwipeRight,
      screenWidth,
      translateX,
      opacity,
      isGestureActive,
    ]
  );

  return {
    onGestureEvent,
    animatedStyle,
    translateX,
    opacity,
    isGestureActive,
    SWIPE_THRESHOLD,
    SWIPE_VELOCITY_THRESHOLD,
  };
};
