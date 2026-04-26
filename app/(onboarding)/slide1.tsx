import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
import ProgressDots from '@/components/onboarding/ProgressDots';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';

const ORANGE = ONBOARDING_COLORS.accent;
const CTA_BUTTON_HEIGHT = 50;
const CTA_BUTTON_RADIUS = 14;

export default function Slide1Screen() {
  const router = useRouter();
  const steam = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    steam.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse, steam]);

  const steamStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(steam.value, [0, 1], [0, -8]) }, { rotate: '-10deg' }],
    opacity: interpolate(steam.value, [0, 1], [0.45, 1]),
  }));

  const steamStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(steam.value, [0, 1], [1, -10]) }],
    opacity: interpolate(steam.value, [0, 1], [0.4, 1]),
  }));

  const steamStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(steam.value, [0, 1], [0, -7]) }, { rotate: '10deg' }],
    opacity: interpolate(steam.value, [0, 1], [0.45, 1]),
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.9, 1.15]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0.9]),
  }));

  const skip = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Nav bar */}
        <View style={styles.nav}>
          <BackNavButton onPress={() => router.back()} />
          <ProgressDots total={3} current={0} />
          <Pressable onPress={skip} hitSlop={12} style={styles.navBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headline}>Access food{`\n`}without barriers</Text>
          <Text style={styles.subtext}>Warm, authentic meals delivered with dignity.</Text>

          <View style={styles.heroCard}>
            <View style={styles.heroCircle}>
              <Animated.View style={[styles.sparkle, styles.sparkleTopLeft, sparkleStyle]} />
              <Animated.View style={[styles.sparkle, styles.sparkleTopRight, sparkleStyle]} />
              <Animated.View style={[styles.sparkle, styles.sparkleBottomLeft, sparkleStyle]} />
              <Animated.View style={[styles.sparkle, styles.sparkleBottomRight, sparkleStyle]} />

              <View style={styles.steamRow}>
                <Animated.View style={[styles.steamStick, steamStyle1]} />
                <Animated.View style={[styles.steamStick, steamStyle2]} />
                <Animated.View style={[styles.steamStick, steamStyle3]} />
              </View>

              <View style={styles.foodLid} />
              <View style={styles.foodTub}>
                <Ionicons name="heart-outline" size={18} color={ORANGE} />
              </View>
            </View>

            <Text style={styles.cardTitle}>Access to meals</Text>
            <View style={styles.cardUnderline} />

            <View style={styles.cardMetaRow}>
              <View style={styles.cardMetaItem}>
                <Ionicons name="car-outline" size={18} color={ORANGE} />
                <Text style={styles.cardMetaText}>Free delivery</Text>
              </View>
              <View style={styles.cardMetaDivider} />
              <View style={styles.cardMetaItem}>
                <Ionicons name="heart-outline" size={18} color={ORANGE} />
                <Text style={styles.cardMetaText}>Made with care</Text>
              </View>
            </View>
          </View>

          <View style={styles.ruleList}>
            <RuleRow icon="document-text-outline" label="No paperwork" />
            <RuleRow icon="chatbubble-ellipses-outline" label="No invasive questions" />
            <RuleRow icon="cash-outline" label="No cost" isLast />
          </View>

          <View style={styles.checklist}>
            <CheckItem label="100% free" />
            <CheckItem label="Built on dignity and respect" />
          </View>

          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
            onPress={() => router.replace('/(onboarding)/slide2')}
          >
            <Text style={styles.ctaText}>Learn more</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function RuleRow({
  icon,
  label,
  isLast = false,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.ruleRow, !isLast && styles.ruleRowBorder]}>
      <View style={styles.ruleIconWrap}>
        <Ionicons name={icon} size={26} color={ORANGE} />
      </View>
      <Text style={styles.ruleText}>{label}</Text>
    </View>
  );
}

function CheckItem({ label }: { label: string }) {
  return (
    <View style={styles.checkRow}>
      <View style={styles.checkCircle}>
        <Ionicons name="checkmark" size={13} color={ORANGE} />
      </View>
      <Text style={styles.checkText}>{label}</Text>
    </View>
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
    paddingTop: 8,
    paddingBottom: 18,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    gap: 10,
    paddingBottom: 4,
  },
  headline: {
    fontSize: 40,
    fontWeight: '800',
    color: '#15181C',
    lineHeight: 42,
    letterSpacing: -1.2,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5E646C',
    maxWidth: 340,
    letterSpacing: -0.2,
    textAlign: 'center',
    alignSelf: 'center',
  },
  heroCard: {
    marginTop: 2,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  heroCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#FFF2E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'visible',
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F8BA86',
  },
  sparkleTopLeft: {
    top: 24,
    left: 18,
  },
  sparkleTopRight: {
    top: 28,
    right: 18,
  },
  sparkleBottomLeft: {
    bottom: 30,
    left: 14,
  },
  sparkleBottomRight: {
    bottom: 24,
    right: 14,
  },
  steamRow: {
    position: 'absolute',
    top: 15,
    flexDirection: 'row',
    gap: 7,
  },
  steamStick: {
    width: 3,
    height: 21,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },
  foodLid: {
    width: 82,
    height: 9,
    borderWidth: 2,
    borderColor: ORANGE,
    borderRadius: 8,
    backgroundColor: '#FFF9F2',
    marginBottom: -1,
  },
  foodTub: {
    width: 72,
    height: 58,
    borderWidth: 2,
    borderColor: ORANGE,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDFB',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#181B1F',
    letterSpacing: -0.5,
    lineHeight: 27,
    textAlign: 'center',
  },
  cardUnderline: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: ORANGE,
  },
  cardMetaRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMetaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#EDE3DA',
    marginHorizontal: 8,
  },
  cardMetaText: {
    fontSize: 13,
    color: '#535A62',
    fontWeight: '500',
  },
  ruleList: {
    marginTop: 0,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  ruleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EFE4DA',
  },
  ruleIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  ruleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1B1D21',
    letterSpacing: -0.4,
  },
  checklist: {
    marginTop: 0,
    gap: 7,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFECD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1D21',
    letterSpacing: -0.3,
  },
  ctaBtn: {
    marginTop: 20,
    height: CTA_BUTTON_HEIGHT,
    backgroundColor: ORANGE,
    borderRadius: CTA_BUTTON_RADIUS,
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
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
