import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
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
  const { mockSignIn, user } = useUser();
  const [isLoading, setIsLoading] = useState<OAuthProvider | null>(null);
  const [email, setEmail] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const redirectTo = useMemo(
    () => Linking.createURL('auth-callback', { scheme: 'sevaeats' }),
    []
  );

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

  const handleEmailMagicLink = async () => {
    if (!supabase || !hasSupabaseConfig) {
      Alert.alert(
        'Supabase not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.'
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email to receive your sign-in link.');
      return;
    }

    setIsEmailLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: false,
        },
      });

      if (error) {
        throw error;
      }

      Alert.alert('Check your email', 'We sent a magic link to finish sign in.');
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('user') && message.includes('not')) {
        Alert.alert('No account found', 'Use "Sign up with Email" below to create a new account.');
      } else {
        Alert.alert('Unable to send link', 'Please try again in a moment.');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!supabase || !hasSupabaseConfig) {
      Alert.alert(
        'Supabase not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.'
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email to create your account.');
      return;
    }

    setIsEmailLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      Alert.alert('Check your email', 'We sent a verification link to create your account.');
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('already') || message.includes('exists')) {
        Alert.alert('Account already exists', 'Use "Continue with Email" to sign in.');
      } else {
        Alert.alert('Unable to sign up', 'Please try again in a moment.');
      }
    } finally {
      setIsEmailLoading(false);
    }
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
                Use Apple, Google, or email.
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
                disabled={isLoading !== null || isEmailLoading}
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
                disabled={isLoading !== null || isEmailLoading}
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

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.emailInput}
                editable={!isEmailLoading}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.emailButton,
                  (pressed || isEmailLoading) && styles.pressed,
                ]}
                onPress={handleEmailMagicLink}
                disabled={isEmailLoading || isLoading !== null}
              >
                <Text style={styles.emailButtonText}>
                  {isEmailLoading ? 'Sending link...' : 'Continue with Email'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.emailSecondaryTextWrap,
                  (pressed || isEmailLoading) && styles.textPressed,
                ]}
                onPress={handleEmailSignUp}
                disabled={isEmailLoading || isLoading !== null}
              >
                <Text style={styles.emailSecondaryText}>Sign up with Email</Text>
              </Pressable>
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
  emailInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: '#111827',
    fontSize: 15,
  },
  emailButton: {
    minHeight: 48,
    borderRadius: 12,
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
  emailSecondaryTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  emailSecondaryText: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  textPressed: {
    opacity: 0.7,
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
