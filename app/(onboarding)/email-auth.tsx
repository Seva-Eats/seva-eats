import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
import { ONBOARDING_COLORS, ONBOARDING_TOKENS } from '@/constants/onboarding';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const ORANGE = ONBOARDING_COLORS.accent;

export default function EmailAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode === 'signup' ? 'signup' : 'signin';
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = useMemo(() => {
    if (Constants.appOwnership === 'expo') {
      return Linking.createURL('auth-callback');
    }
    return 'sevaeats://auth-callback';
  }, []);

  const handleSendCode = async () => {
    if (!supabase || !hasSupabaseConfig) {
      Alert.alert(
        'Supabase not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.'
      );
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email address to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const withRedirect = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: mode === 'signup',
        },
      });

      if (withRedirect.error) {
        const withoutRedirect = await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            shouldCreateUser: mode === 'signup',
          },
        });

        if (withoutRedirect.error) {
          throw withoutRedirect.error;
        }
      }

      router.push({
        pathname: '/(onboarding)/email-verify',
        params: { email: trimmedEmail, mode },
      } as any);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (mode === 'signin' && message.includes('not') && message.includes('user')) {
        Alert.alert('No account found', 'Use Sign up with Email to create your account first.');
        return;
      }
      if (mode === 'signup' && (message.includes('already') || message.includes('exists'))) {
        Alert.alert('Account already exists', 'Use Continue with Email from the previous page.');
        return;
      }
      Alert.alert(
        'Unable to send email',
        error instanceof Error && error.message ? error.message : 'Please try again in a moment.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.nav}>
            <BackNavButton onPress={() => router.back()} />
            <View style={styles.navSpacer} />
          </View>

          <View style={styles.main}>
            <Text style={styles.badge}>EMAIL</Text>
            <Text style={styles.title}>{mode === 'signup' ? 'Create your account' : 'Sign in with email'}</Text>
            <Text style={styles.subtitle}>
              Enter your email and we will send a link and verification code.
            </Text>

            <View style={styles.card}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.emailInput}
                editable={!isLoading}
              />

              <Pressable
                style={({ pressed }) => [styles.primaryButton, (pressed || isLoading) && styles.pressed]}
                onPress={handleSendCode}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Sending email...' : 'Send verification email'}
                </Text>
              </Pressable>
            </View>
          </View>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navSpacer: {
    width: 40,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
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
    maxWidth: 340,
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
  primaryButton: {
    minHeight: 48,
    borderRadius: ONBOARDING_TOKENS.ctaRadius,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
