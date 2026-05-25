import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';
import { useUser } from '@/context';
import { completeAuthFromUrl, getCurrentSession } from '@/lib/supabase';

function providerFromSession(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  const provider = session?.user.app_metadata?.provider;
  if (provider === 'apple' || provider === 'google' || provider === 'email') {
    return provider;
  }
  return 'email';
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const incomingUrl = Linking.useURL();
  const { mockSignIn } = useUser();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const handledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const finishSignIn = async () => {
      const url = incomingUrl ?? await Linking.getInitialURL();
      if (!url || handledUrlRef.current === url) return;

      handledUrlRef.current = url;

      try {
        const completed = await completeAuthFromUrl(url);
        if (!completed) throw new Error('Missing Supabase auth callback parameters');
        const session = await getCurrentSession();
        if (session?.user) {
          await mockSignIn(providerFromSession(session), {
            name:
              typeof session.user.user_metadata?.full_name === 'string'
                ? session.user.user_metadata.full_name
                : session.user.email?.split('@')[0],
            email: session.user.email,
          });
        }
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        if (isMounted) {
          setStatus('done');
          router.replace('/request/location');
        }
      } catch {
        if (isMounted) setStatus('error');
      }
    };

    void finishSignIn();

    return () => {
      isMounted = false;
    };
  }, [incomingUrl, mockSignIn, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {status === 'error' ? (
          <>
            <Text style={styles.title}>Link could not be verified</Text>
            <Text style={styles.subtitle}>
              Open the latest email from Seva Eats and try again. Verification links expire after they are used.
            </Text>
            <Pressable style={styles.button} onPress={() => router.replace('/(onboarding)/slide4' as any)}>
              <Text style={styles.buttonText}>Back to sign in</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color={ONBOARDING_COLORS.accent} size="large" />
            <Text style={styles.title}>{status === 'done' ? 'Verified' : 'Finishing sign in'}</Text>
            <Text style={styles.subtitle}>
              {status === 'done'
                ? 'Taking you into Seva Eats...'
                : 'Please wait while we securely connect your account.'}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
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
    maxWidth: 320,
  },
  button: {
    marginTop: 8,
    height: 50,
    minWidth: 180,
    borderRadius: 14,
    backgroundColor: ONBOARDING_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
