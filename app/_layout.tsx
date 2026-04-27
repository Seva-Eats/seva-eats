import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';
import { ThemeProvider as CustomThemeProvider, LocationProvider, RequestProvider, UserProvider, useUser } from '@/context';
import { useTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { completeAuthFromUrl } from '@/lib/supabase';
import { configureNotificationsAsync } from '@/utils/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading: isUserLoading } = useUser();
  const [isReady, setIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const segmentKey = segments.join('/');

  // Determine effective color scheme based on theme mode
  const effectiveColorScheme = themeMode === 'system' ? systemColorScheme : themeMode;

  const refreshOnboarding = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      setHasOnboarded(value === 'true');
    } catch {
      setHasOnboarded(false);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    refreshOnboarding();
  }, [refreshOnboarding]);

  useEffect(() => {
    void configureNotificationsAsync();
  }, []);

  useEffect(() => {
    const redirectFromNotification = (notification: Notifications.Notification) => {
      const requestId = notification.request.content.data?.requestId;
      if (typeof requestId === 'string' && requestId.length > 0) {
        router.push(`/request/${requestId}` as any);
      }
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) {
      redirectFromNotification(lastResponse.notification);
    }

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirectFromNotification(response.notification);
    });

    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (!isReady) return;
    refreshOnboarding();
  }, [segmentKey, isReady, refreshOnboarding]);

  useEffect(() => {
    let isMounted = true;

    const processIncomingAuthUrl = async (incomingUrl: string) => {
      try {
        const completed = await completeAuthFromUrl(incomingUrl);
        if (!completed || !isMounted) return;
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      } catch {
        // no-op
      }
    };

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        void processIncomingAuthUrl(initialUrl);
      }
    }).catch(() => undefined);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void processIncomingAuthUrl(url);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isReady || hasOnboarded === null) return;
    const currentSegment = segments[0] as string | undefined;
    const inOnboarding = currentSegment === '(onboarding)';
    const isAuthenticated = !!user?.isAuthenticated;

    if (!hasOnboarded && !inOnboarding) {
      router.replace('/(onboarding)');
      return;
    }

    if (hasOnboarded && !isAuthenticated && currentSegment !== '(onboarding)') {
      router.replace('/(onboarding)/slide4' as any);
      return;
    }

    if (hasOnboarded && isAuthenticated && inOnboarding && segments.length > 1) {
      router.replace('/request/location');
    }
  }, [isReady, hasOnboarded, segments, router, user?.isAuthenticated, segmentKey]);

  if (!isReady || isUserLoading) {
    return null;
  }

  return (
    <ThemeProvider value={effectiveColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="request/location" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="request/new" options={{ headerShown: false }} />
        <Stack.Screen name="request/details" options={{ headerShown: false }} />
        <Stack.Screen name="request/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <UserProvider>
        <LocationProvider>
          <RequestProvider>
            <RootLayoutContent />
          </RequestProvider>
        </LocationProvider>
      </UserProvider>
    </CustomThemeProvider>
  );
}
