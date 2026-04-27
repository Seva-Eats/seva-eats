import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProgressDots from '@/components/onboarding/ProgressDots';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';
import { useUser } from '@/context';

const MAX_NAME_LENGTH = 60;
const MAX_EMAIL_LENGTH = 100;

type AuthMode = 'sign-in' | 'sign-up';

const STEPS = [
  {
    title: 'Choose Your Meal',
    desc: 'Browse available meals from\nlocal donors and restaurants',
    icon: 'restaurant' as const,
  },
  {
    title: 'Confirm Delivery',
    desc: 'Set your preferred pickup\nlocation and time',
    icon: 'location-on' as const,
  },
  {
    title: 'Receive with Dignity',
    desc: 'Get your meal delivered with\ncare and respect',
    icon: 'volunteer-activism' as const,
  },
];

const ORANGE = ONBOARDING_COLORS.accent;
const CTA_BUTTON_HEIGHT = 50;
const CTA_BUTTON_RADIUS = 14;

export default function Slide3Screen() {
  const router = useRouter();
  const { mockSignIn } = useUser();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const modeTitle = useMemo(
    () => (mode === 'sign-up' ? 'Create your Seva account' : 'Sign in to continue'),
    [mode]
  );

  const modeSubtitle = useMemo(
    () =>
      mode === 'sign-up'
        ? 'Join to request meals and track deliveries in real-time.'
        : 'Pick a method below to get back to your request flow.',
    [mode]
  );

  const completeAuth = async (provider: 'google' | 'apple' | 'email') => {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (provider === 'email') {
      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        Alert.alert('Valid Email Required', 'Please enter a valid email address.');
        return;
      }
      if (mode === 'sign-up' && !trimmedName) {
        Alert.alert('Name Required', 'Please enter your full name to create your account.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await mockSignIn(provider, {
        name:
          provider === 'email'
            ? mode === 'sign-up'
              ? trimmedName
              : trimmedName || 'Seva User'
            : provider === 'google'
              ? 'Google User'
              : 'Apple User',
        email:
          provider === 'email'
            ? normalizedEmail
            : provider === 'google'
              ? 'demo.google@sevaeats.app'
              : 'demo.apple@privaterelay.appleid.com',
      });

      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      router.replace('/request/location');
    } catch {
      Alert.alert('Authentication Failed', 'Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nav bar */}
        <View style={styles.nav}>
          <View style={styles.navSpacer} />
          <ProgressDots total={3} current={2} />
          <View style={styles.navSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>FINAL STEP</Text>
          </View>

          <Text style={styles.headline}>How It Works</Text>
          <Text style={styles.subtitle}>Access nutritious meals in 3 easy steps, then sign in.</Text>

          <View style={styles.steps}>
            {STEPS.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNum}>{`0${i + 1}`}</Text>
                  </View>
                  {i < STEPS.length - 1 && <View style={styles.connector} />}
                </View>

                <View style={[styles.stepText, i < STEPS.length - 1 && styles.stepTextSpaced]}>
                  <View style={styles.stepHeaderRow}>
                    <View style={styles.iconWrap}>
                      <MaterialIcons name={step.icon} size={22} color={ORANGE} />
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </View>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.authCard}>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeButton, mode === 'sign-in' && styles.modeButtonActive]}
              onPress={() => setMode('sign-in')}
              disabled={isLoading}
            >
              <Text style={[styles.modeButtonText, mode === 'sign-in' && styles.modeButtonTextActive]}>
                Sign in
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeButton, mode === 'sign-up' && styles.modeButtonActive]}
              onPress={() => setMode('sign-up')}
              disabled={isLoading}
            >
              <Text style={[styles.modeButtonText, mode === 'sign-up' && styles.modeButtonTextActive]}>
                Sign up
              </Text>
            </Pressable>
          </View>

          <Text style={styles.authTitle}>{modeTitle}</Text>
          <Text style={styles.authSubtitle}>{modeSubtitle}</Text>

          {mode === 'sign-up' ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(value) => setName(value.slice(0, MAX_NAME_LENGTH))}
              placeholder="Full name"
              autoCapitalize="words"
              editable={!isLoading}
            />
          ) : null}

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(value) => setEmail(value.slice(0, MAX_EMAIL_LENGTH))}
            placeholder="name@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />

          <Pressable
            style={({ pressed }) => [styles.primaryButton, (pressed || isLoading) && styles.pressed]}
            onPress={() => completeAuth('email')}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Please wait...' : mode === 'sign-up' ? 'Create account with Email' : 'Continue with Email'}
            </Text>
          </Pressable>

          <View style={styles.providerRow}>
            <Pressable
              style={({ pressed }) => [styles.providerButton, pressed && styles.pressed]}
              onPress={() => completeAuth('google')}
              disabled={isLoading}
            >
              <MaterialIcons name="account-circle" size={19} color={ORANGE} />
              <Text style={styles.providerText}>Google</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.providerButton, pressed && styles.pressed]}
              onPress={() => completeAuth('apple')}
              disabled={isLoading}
            >
              <MaterialIcons name="apple" size={19} color={ORANGE} />
              <Text style={styles.providerText}>Apple</Text>
            </Pressable>
          </View>
        </View>
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
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navSpacer: {
    width: 40,
  },
  hero: {
    gap: 12,
  },
  labelWrap: {
    alignSelf: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: ORANGE,
    letterSpacing: 2,
  },
  headline: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.8,
    textAlign: 'center',
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  steps: {
    gap: 0,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepLeft: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
  },
  stepCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F6C48B',
    backgroundColor: ONBOARDING_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: ORANGE,
    fontSize: 18,
    fontWeight: '800',
  },
  connector: {
    position: 'absolute',
    left: 27,
    top: 64,
    width: 2,
    height: 64,
    backgroundColor: '#F6C48B',
  },
  stepText: {
    flex: 1,
    gap: 8,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FAEFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextSpaced: {
    marginBottom: 18,
  },
  stepTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1D2321',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    marginLeft: 62,
  },
  authCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3DBC3',
    backgroundColor: '#FFF7EF',
    padding: 14,
    gap: 10,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  modeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#F7E7D7',
    padding: 4,
    gap: 6,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 8,
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  modeButtonText: {
    color: '#8B5E3C',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#1D2321',
  },
  authTitle: {
    color: '#1D2321',
    fontSize: 18,
    fontWeight: '700',
  },
  authSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2D2C1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1D2321',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    marginTop: 2,
    height: CTA_BUTTON_HEIGHT,
    backgroundColor: ORANGE,
    borderRadius: CTA_BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  providerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F2CDAA',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
  },
  providerText: {
    color: '#1D2321',
    fontSize: 14,
    fontWeight: '600',
  },
});
