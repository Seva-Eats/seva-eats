import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProgressDots from '@/components/onboarding/ProgressDots';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';
import { useUser } from '@/context';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google' | 'apple';

const ORANGE = ONBOARDING_COLORS.accent;

const providerName: Record<OAuthProvider, string> = {
  google: 'Google',
  apple: 'Apple',
};

export default function Slide4Screen() {
  const router = useRouter();
  const { mockSignIn } = useUser();
  const [isLoading, setIsLoading] = useState<OAuthProvider | null>(null);

  const completeSession = async (provider: OAuthProvider) => {
    if (!supabase || !hasSupabaseConfig) {
      Alert.alert(
        'Supabase not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.'
      );
      return;
    }

    const redirectTo = Linking.createURL('/');
    setIsLoading(provider);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        throw error ?? new Error('Unable to start OAuth flow');
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== 'success' || !result.url) {
        return;
      }

      const callbackUrl = new URL(result.url);
      const code = callbackUrl.searchParams.get('code');

      if (!code) {
        throw new Error('Missing auth code');
      }

      const exchangeResult = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeResult.error) {
        throw exchangeResult.error;
      }

      const user = exchangeResult.data.user;
      await mockSignIn(provider, {
        name:
          typeof user?.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : `${providerName[provider]} User`,
        email: user?.email,
      });
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      router.replace('/request/location');
    } catch {
      Alert.alert('Sign up failed', 'Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.nav}>
          <View style={styles.navSpacer} />
          <ProgressDots total={4} current={3} />
          <View style={styles.navSpacer} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.badge}>ACCOUNT</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Continue with Apple or Google. If your account already exists, you will be signed in.
          </Text>
        </View>

        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [
              styles.oauthButton,
              styles.appleButton,
              (pressed || isLoading === 'apple') && styles.pressed,
            ]}
            onPress={() => completeSession('apple')}
            disabled={isLoading !== null}
          >
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <Text style={styles.appleButtonText}>
              {isLoading === 'apple' ? 'Please wait...' : 'Continue with Apple'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.oauthButton,
              styles.googleButton,
              (pressed || isLoading === 'google') && styles.pressed,
            ]}
            onPress={() => completeSession('google')}
            disabled={isLoading !== null}
          >
            <Ionicons name="logo-google" size={20} color="#111827" />
            <Text style={styles.googleButtonText}>
              {isLoading === 'google' ? 'Please wait...' : 'Continue with Google'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footnote}>
          By continuing, you agree to use Seva Eats respectfully and follow local community guidelines.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 20,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navSpacer: {
    width: 40,
  },
  hero: {
    gap: 10,
    alignItems: 'center',
  },
  badge: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 340,
  },
  card: {
    marginTop: 12,
    borderRadius: 28,
    backgroundColor: '#FFF7EF',
    borderWidth: 1,
    borderColor: '#F2DCC5',
    padding: 18,
    gap: 14,
  },
  oauthButton: {
    minHeight: 58,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  appleButton: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#111111',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  googleButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  footnote: {
    marginTop: 2,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
