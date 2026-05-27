import { Stack, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { SwipeProvider, useSwipeContext } from '../../hooks/use-swipe-context';
import { useSwipeNavigation } from '../../hooks/use-swipe-navigation';

function RequestsStackContent() {
  const router = useRouter();
  const segments = useSegments();
  const { setTotalScreens, setCurrentIndex, canSwipeLeft, canSwipeRight } = useSwipeContext();

  // Map route names to indices for requests tabs
  // active (0) <-> history (1)
  const screenMap: Record<string, number> = {
    active: 0,
    history: 1,
  };

  const currentScreen = segments[segments.length - 1] || 'active';
  const currentIndex = screenMap[currentScreen] ?? 0;
  const totalScreens = 2;

  // Update context when screen changes
  React.useEffect(() => {
    setTotalScreens(totalScreens);
    setCurrentIndex(currentIndex);
  }, [currentIndex, totalScreens, setTotalScreens, setCurrentIndex]);

  const { onGestureEvent } = useSwipeNavigation({
    onSwipeLeft: () => {
      // Navigate to history (right screen)
      if (currentIndex === 0) {
        router.push('/requests/history');
      }
    },
    onSwipeRight: () => {
      // Navigate to active (left screen)
      if (currentIndex === 1) {
        router.push('/requests/active');
      }
    },
    canSwipeLeft,
    canSwipeRight,
    enableHaptics: true,
  });

  return (
    <PanGestureHandler onHandlerStateChange={onGestureEvent}>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 220,
            animationTypeForReplace: 'pop',
            fullScreenGestureEnabled: false,
            gestureEnabled: false,
          }}
        >
          <Stack.Screen name="active" />
          <Stack.Screen name="history" />
        </Stack>
      </View>
    </PanGestureHandler>
  );
}

export default function RequestsLayout() {
  return (
    <SwipeProvider initialIndex={0} totalScreens={2}>
      <RequestsStackContent />
    </SwipeProvider>
  );
}
