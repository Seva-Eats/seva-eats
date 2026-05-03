import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';
import { ThemeProvider as CustomThemeProvider, LocationProvider, RequestProvider, UserProvider } from '@/context';
import { useTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { configureNotificationsAsync } from '@/utils/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

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

  // Initialize onboarding state on mount
  useEffect(() => {
    refreshOnboarding();
  }, []);

  // Configure notifications
  useEffect(() => {
    void configureNotificationsAsync();
  }, []);

  // Handle navigation based on onboarding state
  useEffect(() => {
    if (!isReady || hasOnboarded === null) return;
    
    const inOnboarding = segments[0] === '(onboarding)';
    const inRequestFlow = segments[0] === 'request' || segments[0] === 'requests';
    
    // Only redirect to onboarding if not onboarded AND not already in onboarding/request flows
    if (!hasOnboarded && !inOnboarding && !inRequestFlow) {
      router.replace('/(onboarding)');
    }
  }, [isReady, hasOnboarded, segments, router]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider value={effectiveColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="request" options={{ headerShown: false }} />
        <Stack.Screen name="requests" options={{ headerShown: false }} />
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
