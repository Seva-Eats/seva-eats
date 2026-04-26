import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProgressDots from '@/components/onboarding/ProgressDots';

const ONBOARDING_KEY = 'onboarding-completed';
const BG = '#FAF3EB';
const ORANGE = '#F07B2A';

export default function Slide1Screen() {
  const router = useRouter();

  const skip = async () => {
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
          <ProgressDots total={3} current={0} />
          <Pressable onPress={skip} hitSlop={12} style={styles.navBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.headline}>Access food{'\n'}without barriers</Text>

          {/* Illustration placeholder */}
          <View style={styles.illustration}>
            <View style={styles.illustrationInner}>
              <View style={styles.iconRing}>
                <MaterialIcons name="restaurant" size={52} color={ORANGE} />
              </View>
              <View style={styles.illustrationBadges}>
                <View style={styles.badge}>
                  <MaterialIcons name="local-shipping" size={16} color={ORANGE} />
                  <Text style={styles.badgeText}>Free Delivery</Text>
                </View>
                <View style={styles.badge}>
                  <MaterialIcons name="favorite" size={16} color={ORANGE} />
                  <Text style={styles.badgeText}>Made with Love</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.body2}>
            No paperwork. No invasive questions. No costs. Just warm, authentic meals delivered
            wherever you are.
          </Text>

          {/* Checklist */}
          <View style={styles.checklist}>
            <CheckItem label="100% Free Forever" />
            <CheckItem label="Rooted in Dignity & Respect" />
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
          onPress={() => router.push('/(onboarding)/slide2')}
        >
          <Text style={styles.ctaText}>Tell Me More</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function CheckItem({ label }: { label: string }) {
  return (
    <View style={styles.checkRow}>
      <View style={styles.checkCircle}>
        <MaterialIcons name="check" size={14} color="#FFF" />
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </View>
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
    gap: 20,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  illustration: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    marginVertical: 4,
  },
  illustrationInner: {
    alignItems: 'center',
    gap: 16,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF4EC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFE0C8',
  },
  illustrationBadges: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF4EC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 13,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  body2: {
    fontSize: 16,
    lineHeight: 25,
    color: '#5A5A5A',
  },
  checklist: {
    gap: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  ctaBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
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
