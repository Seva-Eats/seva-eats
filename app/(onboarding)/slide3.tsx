import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
import ProgressDots from '@/components/onboarding/ProgressDots';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY, ONBOARDING_TOKENS } from '@/constants/onboarding';

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

export default function Slide3Screen() {
  const router = useRouter();

  const skip = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    router.replace('/(onboarding)/slide4' as any);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(onboarding)/slide2');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.nav}>
          <BackNavButton onPress={handleBack} />
          <ProgressDots total={4} current={2} />
          <Pressable onPress={skip} hitSlop={12} style={styles.navBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.labelWrap}>
            <Text style={styles.label}>SIMPLE PROCESS</Text>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.headline}>How It Works</Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300).springify()} style={styles.subtitle}>Access nutritious meals in 3 easy steps</Animated.Text>

          <View style={styles.steps}>
            {STEPS.map((step, i) => (
              <Animated.View 
                key={i} 
                entering={FadeInRight.delay(400 + (i * 150)).springify()} 
                style={styles.stepRow}
              >
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
              </Animated.View>
            ))}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
          onPress={() => router.push('/(onboarding)/slide4' as any)}
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
    paddingHorizontal: ONBOARDING_TOKENS.horizontalPadding,
    paddingTop: ONBOARDING_TOKENS.topPadding,
    paddingBottom: ONBOARDING_TOKENS.bottomPadding,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ONBOARDING_TOKENS.navBottom,
  },
  navBtn: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  body: {
    flex: 1,
    gap: 14,
  },
  labelWrap: {
    alignSelf: 'center',
    backgroundColor: '#FFE8D4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: ORANGE,
    letterSpacing: 1.4,
  },
  headline: {
    fontSize: ONBOARDING_TOKENS.titleSize,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.8,
    textAlign: 'center',
    lineHeight: ONBOARDING_TOKENS.titleLineHeight,
  },
  subtitle: {
    fontSize: ONBOARDING_TOKENS.subtitleSize,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: ONBOARDING_TOKENS.subtitleLineHeight,
    marginBottom: 8,
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
    height: ONBOARDING_TOKENS.smallCtaHeight,
    backgroundColor: ORANGE,
    borderRadius: ONBOARDING_TOKENS.ctaRadius,
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
    fontSize: ONBOARDING_TOKENS.ctaTextSize,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
