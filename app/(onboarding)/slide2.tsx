import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
import ProgressDots from '@/components/onboarding/ProgressDots';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY, ONBOARDING_TOKENS } from '@/constants/onboarding';

const ORANGE = ONBOARDING_COLORS.accent;

export default function Slide2Screen() {
  const router = useRouter();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const skip = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    router.replace('/(onboarding)/slide4' as any);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(onboarding)/slide1');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.nav}>
          <BackNavButton onPress={handleBack} />
          <ProgressDots total={4} current={1} />
          <Pressable onPress={skip} hitSlop={12} style={styles.navBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.labelWrap}>
            <Text style={styles.label}>DID YOU KNOW</Text>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.headline}>The Tradition{`\n`}of Langar</Animated.Text>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.quoteCard}>
            <View style={styles.cardAccent} />
            <View style={styles.cardContent}>
              <Text style={styles.quoteOpen}>{'\u201C'}</Text>
              <Text style={styles.quoteText}>
                For over 500 years, Sikh gurdwaras have served langar - a free community kitchen
                open to everyone, regardless of caste, creed, religion, or background. No one
                leaves hungry.
              </Text>

              <View style={styles.quoteAttrib}>
                <View style={styles.attribLine} />
                <Text style={styles.attribText}>The Sikh tradition of Langar</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(400).springify()} style={styles.outro}>We bring this 500-year-old tradition to your doorstep with care.</Animated.Text>

          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.pillRow}>
            <Pill icon="people" label="Community" floatValue={float} />
            <Pill icon="volunteer-activism" label="Selfless Service" floatValue={float} />
            <Pill icon="lock-open" label="Open to all" floatValue={float} />
          </Animated.View>

          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
            onPress={() => router.push('/(onboarding)/slide3')}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Pill({ 
  icon, 
  label, 
  floatValue 
}: { 
  icon: ComponentProps<typeof MaterialIcons>['name']; 
  label: string; 
  floatValue: Animated.SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value * -4 }],
  }));

  return (
    <Animated.View style={[styles.pill, animatedStyle]}>
      <MaterialIcons name={icon} size={15} color={ORANGE} />
      <Text style={styles.pillText}>{label}</Text>
    </Animated.View>
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
  },
  bodyContent: {
    gap: 14,
    paddingBottom: 8,
  },
  labelWrap: {
    alignSelf: 'flex-start',
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
    lineHeight: ONBOARDING_TOKENS.titleLineHeight,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ONBOARDING_TOKENS.cardRadius,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardAccent: {
    width: 5,
    backgroundColor: ORANGE,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    gap: 10,
  },
  quoteOpen: {
    fontSize: 46,
    color: ORANGE,
    lineHeight: 36,
    fontWeight: '900',
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4A4A4A',
    fontStyle: 'italic',
  },
  quoteAttrib: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  attribLine: {
    width: 20,
    height: 2,
    backgroundColor: ORANGE,
    borderRadius: 1,
  },
  attribText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  outro: {
    fontSize: ONBOARDING_TOKENS.subtitleSize,
    lineHeight: ONBOARDING_TOKENS.subtitleLineHeight,
    color: '#1A1A1A',
    fontWeight: '600',
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF4EC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 13,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  ctaBtn: {
    marginTop: 10,
    height: ONBOARDING_TOKENS.smallCtaHeight,
    backgroundColor: ORANGE,
    borderRadius: ONBOARDING_TOKENS.ctaRadius,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  ctaText: {
    color: '#FFF',
    fontSize: ONBOARDING_TOKENS.ctaTextSize,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
