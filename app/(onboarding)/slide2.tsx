import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProgressDots from '@/components/onboarding/ProgressDots';

const ONBOARDING_KEY = 'onboarding-completed';
const BG = '#FAF3EB';
const ORANGE = '#F07B2A';

export default function Slide2Screen() {
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
          <ProgressDots total={3} current={1} />
          <Pressable onPress={skip} hitSlop={12} style={styles.navBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>DID YOU KNOW?</Text>
          </View>

          <Text style={styles.headline}>The Tradition{'\n'}of Langar</Text>

          {/* Quote card */}
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardContent}>
              <Text style={styles.quoteOpen}>"</Text>
              <Text style={styles.quoteText}>
                For over 500 years, Sikh gurdwaras have served langar — a free community kitchen
                open to everyone, regardless of caste, creed, religion, or background. No one
                leaves hungry.
              </Text>
              <View style={styles.quoteAttrib}>
                <View style={styles.attribLine} />
                <Text style={styles.attribText}>The Sikh tradition of Langar</Text>
              </View>
            </View>
          </View>

          <Text style={styles.outro}>
            We bring this 500-year-old tradition to your doorstep.
          </Text>

          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <MaterialIcons name="people" size={15} color={ORANGE} />
              <Text style={styles.pillText}>Community</Text>
            </View>
            <View style={styles.pill}>
              <MaterialIcons name="volunteer-activism" size={15} color={ORANGE} />
              <Text style={styles.pillText}>Selfless Service</Text>
            </View>
            <View style={styles.pill}>
              <MaterialIcons name="lock-open" size={15} color={ORANGE} />
              <Text style={styles.pillText}>Open to All</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
          onPress={() => router.push('/(onboarding)/slide3')}
        >
          <Text style={styles.ctaText}>Beautiful</Text>
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
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
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
    fontSize: 48,
    color: ORANGE,
    lineHeight: 40,
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
    fontSize: 18,
    lineHeight: 27,
    color: '#1A1A1A',
    fontWeight: '600',
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
