import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY, ONBOARDING_TOKENS } from '@/constants/onboarding';
import { useUser } from '@/context';
import { getAuthRedirectUrl, getCurrentSession, hasSupabaseConfig, isNetworkTimeoutError, supabase } from '@/lib/supabase';

const ORANGE = ONBOARDING_COLORS.accent;
const CODE_LENGTH = 6;

export default function EmailVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; mode?: string }>();
  const email = typeof params.email === 'string' ? params.email.toLowerCase() : '';
  const mode = params.mode === 'signup' ? 'signup' : 'signin';
  const { mockSignIn, user } = useUser();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isBusy = isLoading || isResending || isVerified;

  const redirectTo = useMemo(() => getAuthRedirectUrl(), []);

  useEffect(() => {
    if (isVerified) return;
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timeout);
  }, [isVerified]);

  const finishEmailAuth = async (authUserOverride?: User | null) => {
    const session = authUserOverride ? null : await getCurrentSession();
    const authUser = authUserOverride ?? session?.user;
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

  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(cleaned);
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
    if (token.length !== CODE_LENGTH) {
      Alert.alert('Invalid code', 'Enter the verification code from your email.');
      return;
    }

    setIsLoading(true);
    try {
      let verifiedUser: User | null | undefined = null;
      const primaryType = mode === 'signup' ? 'signup' : 'email';
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: primaryType,
      });

      if (error) {
        if (primaryType !== 'email') {
          const emailFallback = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
          });
          if (!emailFallback.error) {
            verifiedUser = emailFallback.data?.user ?? null;
          }
        }

        if (!verifiedUser) {
          const magicFallback = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'magiclink',
          });

          if (magicFallback.error) {
            throw magicFallback.error;
          }
          verifiedUser = magicFallback.data?.user ?? null;
        }
      } else {
        verifiedUser = data?.user ?? null;
      }

      setIsVerified(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      await finishEmailAuth(verifiedUser ?? undefined);
    } catch (error) {
      setIsVerified(false);
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
        throw withRedirect.error;
      }

      Alert.alert('Email sent', 'A fresh verification email has been sent.');
      setCode('');
      setIsVerified(false);
    } catch (error) {
      if (isNetworkTimeoutError(error)) {
        Alert.alert(
          'Network error',
          'Could not reach the sign-in service. Check your connection, restart Expo, and try again.'
        );
        return;
      }
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
            <Text style={styles.subtitle}>Enter the 6-digit code sent to {email || 'your email'}.</Text>

            <View style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.codeContainer, pressed && !isBusy && styles.pressed]}
                onPress={() => inputRef.current?.focus()}
                disabled={isBusy}
              >
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={handleCodeChange}
                  onSubmitEditing={handleVerifyCode}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  textContentType="oneTimeCode"
                  editable={!isBusy}
                  style={styles.hiddenInput}
                />
                <View style={styles.codeRow}>
                  {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                    const character = code[index] ?? '';
                    const isActive = index === code.length && !isVerified;
                    return (
                      <View
                        key={`code-${index}`}
                        style={[
                          styles.codeCell,
                          isActive && styles.codeCellActive,
                          isVerified && styles.codeCellSuccess,
                        ]}
                      >
                        <Text style={styles.codeCellText}>{character}</Text>
                      </View>
                    );
                  })}
                </View>
              </Pressable>

              {isVerified ? (
                <View style={styles.successRow}>
                  <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                  <View style={styles.successTextWrap}>
                    <Text style={styles.successTitle}>Code verified</Text>
                    <Text style={styles.successSubtitle}>Signing you in securely...</Text>
                  </View>
                </View>
              ) : (
                <>
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
                </>
              )}
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
  codeContainer: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D1C7',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  codeCell: {
    width: 44,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7D1C7',
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCellActive: {
    borderColor: ORANGE,
  },
  codeCellSuccess: {
    borderColor: '#16A34A',
    backgroundColor: '#ECFDF3',
  },
  codeCellText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
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
  secondaryButton: {
    minHeight: 46,
    borderRadius: ONBOARDING_TOKENS.ctaRadius,
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
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successTextWrap: {
    flex: 1,
  },
  successTitle: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '700',
  },
  successSubtitle: {
    color: '#166534',
    fontSize: 12,
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
