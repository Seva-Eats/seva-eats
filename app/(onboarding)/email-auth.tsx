import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY, ONBOARDING_TOKENS } from '@/constants/onboarding';
import { useUser } from '@/context';
import { hasSupabaseConfig, isNetworkTimeoutError, supabase } from '@/lib/supabase';

const ORANGE = ONBOARDING_COLORS.accent;

export default function EmailAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode === 'signup' ? 'signup' : 'signin';
  const { mockSignIn } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailPasswordAuth = async () => {
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

    if (password.trim().length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password.trim(),
        });

        if (error) {
          throw error;
        }

        const authUser = data.user;
        if (!data.session) {
          Alert.alert('Verify your email', 'Check your inbox to confirm your account before signing in.');
          return;
        }

        await mockSignIn('email', {
          name:
            typeof authUser?.user_metadata?.full_name === 'string'
              ? authUser.user_metadata.full_name
              : authUser?.email?.split('@')[0],
          email: authUser?.email ?? trimmedEmail,
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password.trim(),
        });

        if (error) {
          throw error;
        }

        const authUser = data.user;
        await mockSignIn('email', {
          name:
            typeof authUser?.user_metadata?.full_name === 'string'
              ? authUser.user_metadata.full_name
              : authUser?.email?.split('@')[0],
          email: authUser?.email ?? trimmedEmail,
        });
      }

      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      router.replace('/request/location');
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (
        mode === 'signin' &&
        (message.includes('invalid') || message.includes('credentials') || message.includes('login'))
      ) {
        Alert.alert('Incorrect details', 'Check your email and password and try again.');
        return;
      }
      if (mode === 'signup' && (message.includes('already') || message.includes('exists'))) {
        Alert.alert('Account already exists', 'Use Continue with Email to sign in.');
        return;
      }
      if (isNetworkTimeoutError(error)) {
        Alert.alert(
          'Network error',
          'Could not reach the sign-in service. Check your connection, restart Expo, and try again.'
        );
        return;
      }
      Alert.alert(
        mode === 'signup' ? 'Unable to sign up' : 'Unable to sign in',
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
            <Text style={styles.subtitle}>Enter your email and password to continue.</Text>

            <View style={styles.card}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                style={styles.emailInput}
                editable={!isLoading}
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                style={styles.emailInput}
                editable={!isLoading}
              />

              <Pressable
                style={({ pressed }) => [styles.primaryButton, (pressed || isLoading) && styles.pressed]}
                onPress={handleEmailPasswordAuth}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading
                    ? mode === 'signup'
                      ? 'Creating account...'
                      : 'Signing in...'
                    : mode === 'signup'
                      ? 'Create account'
                      : 'Sign in'}
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
