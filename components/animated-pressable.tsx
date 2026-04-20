/**
 * AnimatedPressable - A reusable pressable component with smooth animations
 * Features:
 * - Scale animation on press (configurable)
 * - Optional opacity effect
 * - Optional haptic feedback
 * - Uses react-native-reanimated for 60fps animations
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Platform, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale factor when pressed (default: 0.97) */
  pressScale?: number;
  /** Whether to trigger haptic feedback on press (default: true on iOS) */
  hapticFeedback?: boolean;
  /** Type of haptic feedback (default: Light) */
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional callback for long press */
  onLongPress?: () => void;
  /** Long press duration in ms (default: 500) */
  longPressDuration?: number;
};

const springConfig = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

export function AnimatedPressable({
  children,
  style,
  pressScale = 0.97,
  hapticFeedback = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  disabled = false,
  onPress,
  onLongPress,
  longPressDuration = 500,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const isPressed = useSharedValue(false);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && Platform.OS === 'ios') {
      Haptics.impactAsync(hapticStyle);
    }
  }, [hapticFeedback, hapticStyle]);

  const handlePress = useCallback(() => {
    if (!disabled && onPress) {
      onPress({} as any);
    }
  }, [disabled, onPress]);

  const handleLongPress = useCallback(() => {
    if (!disabled && onLongPress) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onLongPress();
    }
  }, [disabled, onLongPress]);

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      'worklet';
      scale.value = withSpring(pressScale, springConfig);
      isPressed.value = true;
      runOnJS(triggerHaptic)();
    })
    .onFinalize(() => {
      'worklet';
      scale.value = withSpring(1, springConfig);
      isPressed.value = false;
    })
    .onEnd(() => {
      'worklet';
      runOnJS(handlePress)();
    });

  const longPressGesture = Gesture.LongPress()
    .enabled(!disabled && !!onLongPress)
    .minDuration(longPressDuration)
    .onStart(() => {
      'worklet';
      runOnJS(handleLongPress)();
    });

  const composedGesture = Gesture.Race(tapGesture, longPressGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[style, animatedStyle]} {...props}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

