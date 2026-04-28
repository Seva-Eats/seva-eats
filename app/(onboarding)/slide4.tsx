import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
import ProgressDots from '@/components/onboarding/ProgressDots';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY, ONBOARDING_TOKENS } from '@/constants/onboarding';
import { useUser } from '@/context';
import { hasSupabaseConfig, isNetworkTimeoutError, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google' | 'apple';

const ORANGE = ONBOARDING_COLORS.accent;

const providerName: Record<OAuthProvider, string> = {
  google: 'Google',
  apple: 'Apple',
};

export default function Slide4Screen() {
  const router = useRouter();
  const { mockSignIn, user } = useUser();
  const [isLoading, setIsLoading] = useState<OAuthProvider | null>(null);

  const redirectTo = useMemo(() => {
    if (Constants.appOwnership === 'expo') {
      return Linking.createURL('auth-callback');
    }
    return 'sevaeats://auth-callback';
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(onboarding)/slide3');
  };

  useEffect(() => {
    if (user?.isAuthenticated) {
      router.replace('/request/location');
    }
  }, [router, user?.isAuthenticated]);

  const completeSession = async (provider: OAuthProvider) => {
    if (!supabase || !hasSupabaseConfig) {
      Alert.alert(
        'Supabase not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.'
      );
      return;
    }

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

      const authUser = exchangeResult.data.user;
      await mockSignIn(provider, {
        name:
          typeof authUser?.user_metadata?.full_name === 'string'
            ? authUser.user_metadata.full_name
            : `${providerName[provider]} User`,
        email: authUser?.email,
      });
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      router.replace('/request/location');
    } catch (error) {
      if (isNetworkTimeoutError(error)) {
        Alert.alert(
          'Network error',
          'Could not reach the sign-in service. Check your connection, restart Expo, and try again.'
        );
        return;
      }
      Alert.alert('Sign in failed', 'Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const openEmailPage = (mode: 'signin' | 'signup') => {
    router.push({ pathname: '/(onboarding)/email-auth', params: { mode } } as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          style={styles.container}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.nav}>
            <BackNavButton onPress={handleBack} />
            <ProgressDots total={4} current={3} />
            <View style={styles.navSpacer} />
          </View>

          <View style={styles.main}>
            <View style={styles.hero}>
              <Text style={styles.badge}>ACCOUNT</Text>
              <Text style={styles.title}>Sign in to continue</Text>
              <Text style={styles.subtitle}>
                Choose Apple, Google, or continue with email.
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
                <Ionicons name="logo-apple" size={18} color="#FFFFFF" style={styles.oauthIcon} />
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
                <Ionicons name="logo-google" size={18} color="#111111" style={styles.oauthIcon} />
                <Text style={styles.googleButtonText}>
                  {isLoading === 'google' ? 'Please wait...' : 'Continue with Google'}
                </Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or email</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.emailButton,
                  (pressed || isLoading !== null) && styles.pressed,
                ]}
                onPress={() => openEmailPage('signin')}
                disabled={isLoading !== null}
              >
                <Text style={styles.emailButtonText}>Continue with Email</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.signupButton,
                  (pressed || isLoading !== null) && styles.pressed,
                ]}
                onPress={() => openEmailPage('signup')}
                disabled={isLoading !== null}
              >
                <Text style={styles.signupButtonText}>Sign up with Email</Text>
              </Pressable>

              <Text style={styles.emailHint}>Verification code entry opens on the next page.</Text>
            </View>
          </View>

          <Text style={styles.footnote}>
            By continuing, you agree to use Seva Eats respectfully and follow local community guidelines.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navSpacer: {
    width: 40,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  hero: {
    gap: 6,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  badge: {
    color: ORANGE,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#F7F4EF',
    borderWidth: 1,
    borderColor: '#E8E3DA',
    padding: 14,
    gap: 10,
  },
  oauthButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    position: 'relative',
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
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  googleButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  oauthIcon: {
    position: 'absolute',
    left: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    flex: 1,
  },
  dividerText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emailButton: {
    minHeight: 48,
    borderRadius: ONBOARDING_TOKENS.ctaRadius,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  signupButton: {
    minHeight: 46,
    borderRadius: ONBOARDING_TOKENS.ctaRadius,
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  signupButtonText: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emailHint: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 4,
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
