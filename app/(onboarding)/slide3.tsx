import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProgressDots from '@/components/onboarding/ProgressDots';

const ONBOARDING_KEY = 'onboarding-completed';
const BG = '#FAF3EB';
const ORANGE = '#F07B2A';

const STEPS = [
  {
    icon: 'restaurant-menu' as const,
    title: 'Choose Your Meal',
    desc: 'Browse available langar meals from local gurdwaras and community kitchens.',
  },
  {
    icon: 'check-circle-outline' as const,
    title: 'Confirm Delivery',
    desc: 'Enter your location and any needs. A volunteer will be matched to you.',
  },
  {
    icon: 'favorite-border' as const,
    title: 'Receive with Dignity',
    desc: 'Your warm meal arrives — no judgment, no paperwork, just care.',
  },
];

export default function Slide3Screen() {
  const router = useRouter();

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Nav bar */}
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.navBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#4A4A4A" />
          </Pressable>
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

          {/* Steps */}
          <View style={styles.steps}>
            {STEPS.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                {/* Number + connector column */}
                <View style={styles.stepLeft}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  {i < STEPS.length - 1 && <View style={styles.connector} />}
                </View>

                {/* Step card */}
                <View style={[styles.stepCard, i < STEPS.length - 1 && styles.stepCardSpaced]}>
                  <View style={styles.stepIconWrap}>
                    <MaterialIcons name={step.icon} size={20} color={ORANGE} />
                  </View>
                  <View style={styles.stepText}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
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
          <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
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
    gap: 18,
  },
  labelWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE8D4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: ORANGE,
    letterSpacing: 1.4,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  steps: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stepLeft: {
    alignItems: 'center',
    width: 40,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepNum: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: '#FFD4B8',
    marginVertical: 2,
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepCardSpaced: {
    marginBottom: 12,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    gap: 3,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  ctaBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
