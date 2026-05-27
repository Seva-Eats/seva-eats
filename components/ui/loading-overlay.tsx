import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Preparing your experience...' }: LoadingOverlayProps) {
  const colors = useThemeColors();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Background pulse
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1,
      false
    );
    
    scale.value = withRepeat(
      withSequence(
        withSpring(1.2),
        withSpring(1)
      ),
      -1,
      true
    );

    pulse.value = withRepeat(
      withTiming(1.5, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.5], [0.3, 0]),
  }));

  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  useEffect(() => {
    float1.value = withRepeat(
      withSequence(
        withDelay(0, withTiming(1, { duration: 1000 })),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
    float2.value = withRepeat(
      withSequence(
        withDelay(300, withTiming(1, { duration: 1200 })),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      true
    );
    float3.value = withRepeat(
      withSequence(
        withDelay(600, withTiming(1, { duration: 1400 })),
        withTiming(0, { duration: 1400 })
      ),
      -1,
      true
    );
  }, []);

  const createFloatStyle = (sharedValue: Animated.SharedValue<number>) => useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(sharedValue.value, [0, 1], [0, -20]) },
      { scale: interpolate(sharedValue.value, [0, 1], [0.8, 1.1]) }
    ],
    opacity: interpolate(sharedValue.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        {/* Decorative Floating Icons */}
        <Animated.View style={[styles.floatingIcon, { top: -60, left: -40 }, createFloatStyle(float1)]}>
          <MaterialIcons name="local-dining" size={24} color={colors.accent} />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, { top: -80, right: -20 }, createFloatStyle(float2)]}>
          <MaterialIcons name="favorite" size={20} color={colors.accent} />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, { bottom: -40, left: 10 }, createFloatStyle(float3)]}>
          <MaterialIcons name="people" size={22} color={colors.accent} />
        </Animated.View>

        {/* Central Animation */}
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.pulse, { backgroundColor: colors.accent }, pulseStyle]} />
          <Animated.View style={[styles.mainIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, iconStyle]}>
            <MaterialIcons name="restaurant" size={40} color={colors.accent} />
          </Animated.View>
        </View>

        <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  centerContent: {
    alignItems: 'center',
    padding: Spacing.xl,
    position: 'relative',
  },
  iconWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mainIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 2,
  },
  pulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: 1,
  },
  floatingIcon: {
    position: 'absolute',
    padding: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.md,
    letterSpacing: 0.5,
  },
});
