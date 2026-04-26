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

  useEffect(() => {
    refreshOnboarding();
  }, [refreshOnboarding]);

  useEffect(() => {
    if (!isReady) return;
    refreshOnboarding();
  }, [segments.join('/'), isReady, refreshOnboarding]);

  useEffect(() => {
    if (!isReady || hasOnboarded === null) return;
    const inOnboarding = segments[0] === '(onboarding)';
    if (!hasOnboarded && !inOnboarding) {
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
