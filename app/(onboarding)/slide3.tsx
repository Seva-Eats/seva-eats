import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
import ProgressDots from '@/components/onboarding/ProgressDots';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';

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

  const finish = async () => {
    try {
      // Mark onboarding as completed and ensure it's persisted
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      // Small delay to ensure storage is committed before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      // Replace to onboarding flow - this completes the onboarding
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still navigate even if storage fails
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Nav bar */}
        <View style={styles.nav}>
          <BackNavButton onPress={() => router.replace('/(onboarding)/slide2')} />
          <ProgressDots total={3} current={2} />
          <Pressable onPress={finish} hitSlop={12} style={styles.navBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>SIMPLE PROCESS</Text>
          </View>

          <Text style={styles.headline}>How It Works</Text>
          <Text style={styles.subtitle}>Access nutritious meals in 3 easy steps</Text>

          {/* Steps */}
          <View style={styles.steps}>
            {STEPS.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                {/* Number + connector column */}
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

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
          onPress={finish}
        >
          <Text style={styles.ctaText}>Next</Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  navBtn: {
    width: 40,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  body: {
    flex: 1,
    gap: 16,
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
    fontSize: 50,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.8,
    textAlign: 'center',
    lineHeight: 58,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  steps: {
    gap: 0,
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
    marginBottom: 28,
  },
  stepTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1D2321',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
    marginLeft: 62,
  },
  ctaBtn: {
    height: CTA_BUTTON_HEIGHT,
    backgroundColor: ORANGE,
    borderRadius: CTA_BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  ctaText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
