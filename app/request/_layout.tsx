import { Stack, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { SwipeProvider, useSwipeContext } from '../../hooks/use-swipe-context';
import { useSwipeNavigation } from '../../hooks/use-swipe-navigation';

function RequestStackContent() {
  const router = useRouter();
  const segments = useSegments();
  const { setTotalScreens, setCurrentIndex, canSwipeLeft, canSwipeRight } = useSwipeContext();

  // Map route names to indices for the request flow
  // location (0) -> new (1) -> details (2) -> [id] (3)
  const screenMap: Record<string, number> = {
    location: 0,
    new: 1,
    details: 2,
    '[id]': 3,
  };

  const currentScreen = segments[segments.length - 1] || 'location';
  const currentIndex = screenMap[currentScreen] ?? 0;
  const totalScreens = 4;

  // Update context when screen changes
  React.useEffect(() => {
    setTotalScreens(totalScreens);
    setCurrentIndex(currentIndex);
  }, [currentIndex, totalScreens, setTotalScreens, setCurrentIndex]);

  const { onGestureEvent } = useSwipeNavigation({
    onSwipeLeft: () => {
      // Navigate forward in request flow
      const nextRoutes: Record<number, string> = {
        0: 'new',
        1: 'details',
        2: '[id]',
      };
      const nextRoute = nextRoutes[currentIndex];
      if (nextRoute) {
        router.push(`/request/${nextRoute}`);
      }
    },
    onSwipeRight: () => {
      // Navigate backward in request flow
      if (currentIndex === 0) return;
      if (router.canGoBack()) {
        router.back();
        return;
      }
      const prevRoutes: Record<number, string> = {
        1: 'location',
        2: 'new',
        3: 'details',
      };
      const prevRoute = prevRoutes[currentIndex];
      if (prevRoute) {
        router.replace(`/request/${prevRoute}`);
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
          <Stack.Screen name="location" />
          <Stack.Screen name="new" />
          <Stack.Screen name="details" />
          <Stack.Screen name="[id]" />
        </Stack>
      </View>
    </PanGestureHandler>
  );
}

export default function RequestLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SwipeProvider initialIndex={0} totalScreens={4}>
        <RequestStackContent />
      </SwipeProvider>
    </GestureHandlerRootView>
  );
}
