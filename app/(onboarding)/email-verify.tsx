import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';
import { useUser } from '@/context';
import { getCurrentSession, hasSupabaseConfig, supabase } from '@/lib/supabase';

const ORANGE = ONBOARDING_COLORS.accent;

export default function EmailVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; mode?: string }>();
  const email = typeof params.email === 'string' ? params.email.toLowerCase() : '';
  const mode = params.mode === 'signup' ? 'signup' : 'signin';
  const { mockSignIn, user } = useUser();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const redirectTo = useMemo(() => {
    if (Constants.appOwnership === 'expo') {
      return Linking.createURL('auth-callback');
    }
    return 'sevaeats://auth-callback';
  }, []);

  const finishEmailAuth = async () => {
    const session = await getCurrentSession();
    const authUser = session?.user;
    if (!authUser) {
      throw new Error('No active session after verification');
    }

    await mockSignIn('email', {
      name:
        typeof authUser.user_metadata?.full_name === 'string'
          ? authUser.user_metadata.full_name
          : authUser.email?.split('@')[0] ?? user?.name,
      email: authUser.email,
    });
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    router.replace('/request/location');
  };

  const handleVerifyCode = async () => {
    if (!supabase || !hasSupabaseConfig) {
      Alert.alert(
        'Supabase not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.'
      );
      return;
    }

    if (!email) {
      Alert.alert('Missing email', 'Go back and enter your email again.');
      return;
    }

    const token = code.trim().replace(/\s+/g, '');
    if (token.length < 6) {
      Alert.alert('Invalid code', 'Enter the verification code from your email.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        const fallback = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'magiclink',
        });

        if (fallback.error) {
          throw fallback.error;
        }
      }

      await finishEmailAuth();
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('expired') || message.includes('invalid') || message.includes('token')) {
        Alert.alert('Code expired', 'Request a new email and enter the newest verification code.');
      } else {
        Alert.alert('Could not verify code', 'Please try again in a moment.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!supabase || !hasSupabaseConfig) {
      Alert.alert(
        'Supabase not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.'
      );
      return;
    }

    if (!email) {
      Alert.alert('Missing email', 'Go back and enter your email again.');
      return;
    }

    setIsResending(true);
    try {
      const withRedirect = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: mode === 'signup',
        },
      });

      if (withRedirect.error) {
        const withoutRedirect = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: mode === 'signup',
          },
        });

        if (withoutRedirect.error) {
          throw withoutRedirect.error;
        }
      }

      Alert.alert('Email sent', 'A fresh verification email has been sent.');
    } catch (error) {
      Alert.alert(
        'Unable to resend',
        error instanceof Error && error.message ? error.message : 'Please try again in a moment.'
      );
    } finally {
      setIsResending(false);
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
            <Text style={styles.badge}>VERIFY</Text>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>Use the code sent to {email || 'your email'}.</Text>

            <View style={styles.card}>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="6-digit code"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={8}
                style={styles.codeInput}
                editable={!isLoading && !isResending}
              />

              <Pressable
                style={({ pressed }) => [styles.primaryButton, (pressed || isLoading) && styles.pressed]}
                onPress={handleVerifyCode}
                disabled={isLoading || isResending}
              >
                <Text style={styles.primaryButtonText}>{isLoading ? 'Verifying...' : 'Verify code'}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryButton, (pressed || isResending) && styles.pressed]}
                onPress={handleResend}
                disabled={isLoading || isResending}
              >
                <Text style={styles.secondaryButtonText}>
                  {isResending ? 'Resending...' : 'Resend verification email'}
                </Text>
              </Pressable>

              <Text style={styles.hint}>You can also tap the magic link in the same email.</Text>
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
  codeInput: {
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
    borderRadius: 12,
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
  secondaryButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
